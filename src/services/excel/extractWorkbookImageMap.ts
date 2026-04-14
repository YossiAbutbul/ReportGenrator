import JSZip from 'jszip';
import type { Worksheet } from 'exceljs';

const XML_MIME_TYPES: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

type RichValueStructure = {
  keys: string[];
  type: string;
};

function parseXmlDocument(xmlContent: string): Document {
  return new DOMParser().parseFromString(xmlContent, 'application/xml');
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function hasLocalName(node: Node, localName: string): boolean {
  if (!isElement(node)) {
    return false;
  }

  return node.localName === localName || node.nodeName === localName;
}

function getAttributeValue(element: Element, names: string[]): string | null {
  for (const name of names) {
    const directMatch = element.getAttribute(name);

    if (directMatch !== null) {
      return directMatch;
    }
  }

  for (const attribute of Array.from(element.attributes)) {
    if (
      names.includes(attribute.name)
      || names.includes(attribute.localName)
      || names.some((name) => attribute.name.endsWith(`:${name}`))
    ) {
      return attribute.value;
    }
  }

  return null;
}

function getChildElements(element: Document | Element, localName: string): Element[] {
  return Array.from(element.childNodes).filter((node): node is Element =>
    hasLocalName(node, localName),
  );
}

function getDescendantElements(element: Document | Element, localName: string): Element[] {
  return Array.from(element.getElementsByTagName('*')).filter((node): node is Element =>
    hasLocalName(node, localName),
  );
}

function getFirstDescendant(element: Document | Element, localName: string): Element | null {
  return getDescendantElements(element, localName)[0] ?? null;
}

function getNumericValue(rawValue: string | null | undefined): number | null {
  if (!rawValue) {
    return null;
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeZipPath(path: string): string {
  const segments = path.replace(/\\/g, '/').split('/');
  const normalizedSegments: string[] = [];

  segments.forEach((segment) => {
    if (!segment || segment === '.') {
      return;
    }

    if (segment === '..') {
      normalizedSegments.pop();
      return;
    }

    normalizedSegments.push(segment);
  });

  return normalizedSegments.join('/');
}

function resolveZipTarget(basePath: string, targetPath: string): string {
  const baseSegments = basePath.split('/');
  baseSegments.pop();

  return normalizeZipPath([...baseSegments, targetPath].join('/'));
}

async function readZipText(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  return file ? file.async('text') : null;
}

async function buildMediaSource(
  zip: JSZip,
  mediaPath: string,
): Promise<string | null> {
  const imageFile = zip.file(mediaPath);

  if (!imageFile) {
    return null;
  }

  const extension = mediaPath.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = XML_MIME_TYPES[extension] ?? 'application/octet-stream';
  const base64Content = await imageFile.async('base64');

  return `data:${mimeType};base64,${base64Content}`;
}

async function extractLocalImageSources(zip: JSZip): Promise<Map<number, string>> {
  const richValueRelXml = await readZipText(zip, 'xl/richData/richValueRel.xml');
  const richValueRelRelsXml = await readZipText(
    zip,
    'xl/richData/_rels/richValueRel.xml.rels',
  );
  const richValueStructureXml = await readZipText(
    zip,
    'xl/richData/rdrichvaluestructure.xml',
  );
  const richValueXml = await readZipText(zip, 'xl/richData/rdrichvalue.xml');

  if (!richValueRelXml || !richValueRelRelsXml || !richValueStructureXml || !richValueXml) {
    return new Map();
  }

  const relationshipDocument = parseXmlDocument(richValueRelRelsXml);
  const relationshipTargets = new Map<string, string>();

  getDescendantElements(relationshipDocument, 'Relationship').forEach((relationship) => {
    const relationshipId = getAttributeValue(relationship, ['Id', 'id']);
    const targetPath = getAttributeValue(relationship, ['Target', 'target']);

    if (!relationshipId || !targetPath) {
      return;
    }

    relationshipTargets.set(
      relationshipId,
      resolveZipTarget('xl/richData/richValueRel.xml', targetPath),
    );
  });

  const relationDocument = parseXmlDocument(richValueRelXml);
  const relationIds = getDescendantElements(relationDocument, 'rel')
    .map((relation) => getAttributeValue(relation, ['id']))
    .filter((relationId): relationId is string => Boolean(relationId));

  const structureDocument = parseXmlDocument(richValueStructureXml);
  const structures: RichValueStructure[] = getDescendantElements(structureDocument, 's').map(
    (structure) => ({
      keys: getChildElements(structure, 'k')
        .map((key) => getAttributeValue(key, ['n']))
        .filter((keyName): keyName is string => Boolean(keyName)),
      type: getAttributeValue(structure, ['t']) ?? '',
    }),
  );

  const richValueDocument = parseXmlDocument(richValueXml);
  const richValueRows = getDescendantElements(richValueDocument, 'rv');
  const imageSourceByRichValue = new Map<number, string>();

  for (const [richValueIndex, richValueRow] of richValueRows.entries()) {
    const structureIndex = getNumericValue(getAttributeValue(richValueRow, ['s']));

    if (structureIndex === null) {
      continue;
    }

    const structure = structures[structureIndex];

    if (!structure || structure.type !== '_localImage') {
      continue;
    }

    const values = getChildElements(richValueRow, 'v').map((valueNode) =>
      valueNode.textContent?.trim() ?? '',
    );
    const localImageKeyIndex = structure.keys.findIndex(
      (key) => key === '_rvRel:LocalImageIdentifier',
    );
    const localImageIndex =
      localImageKeyIndex >= 0 ? getNumericValue(values[localImageKeyIndex]) : null;

    if (localImageIndex === null) {
      continue;
    }

    const relationId = relationIds[localImageIndex];
    const mediaPath = relationId ? relationshipTargets.get(relationId) : null;

    if (!mediaPath) {
      continue;
    }

    const mediaSource = await buildMediaSource(zip, mediaPath);

    if (mediaSource) {
      imageSourceByRichValue.set(richValueIndex, mediaSource);
    }
  }

  return imageSourceByRichValue;
}

function extractVmToRichValueIndexes(metadataDocument: Document): Map<number, number> {
  const valueMetadata = getDescendantElements(metadataDocument, 'valueMetadata')[0];
  const richValueMetadata = getDescendantElements(metadataDocument, 'futureMetadata').find(
    (element) => getAttributeValue(element, ['name']) === 'XLRICHVALUE',
  );

  if (!valueMetadata || !richValueMetadata) {
    return new Map();
  }

  const valueMetadataIndexes = getChildElements(valueMetadata, 'bk').map((bucket) => {
    const reference = getFirstDescendant(bucket, 'rc');
    return getNumericValue(getAttributeValue(reference ?? bucket, ['v']));
  });

  const richValueIndexes = getChildElements(richValueMetadata, 'bk').map((bucket) => {
    const richValueReference = getFirstDescendant(bucket, 'rvb');
    return getNumericValue(getAttributeValue(richValueReference ?? bucket, ['i']));
  });

  return new Map(
    valueMetadataIndexes.flatMap((futureMetadataIndex, metadataIndex) => {
      if (futureMetadataIndex === null) {
        return [];
      }

      const richValueIndex = richValueIndexes[futureMetadataIndex];

      return richValueIndex === null || richValueIndex === undefined
        ? []
        : [[metadataIndex + 1, richValueIndex] as const];
    }),
  );
}

function getSheetRowImageRefs(
  worksheetDocument: Document,
): Array<{ rowNumber: number; vmIndex: number }> {
  return getDescendantElements(worksheetDocument, 'c')
    .map((cell) => {
      const reference = getAttributeValue(cell, ['r']) ?? '';
      const vmIndex = getNumericValue(getAttributeValue(cell, ['vm']));
      const rowNumberMatch = reference.match(/\d+/);
      const rowNumber = rowNumberMatch ? Number(rowNumberMatch[0]) : NaN;

      if (!Number.isFinite(rowNumber) || vmIndex === null) {
        return null;
      }

      return { rowNumber, vmIndex };
    })
    .filter((entry): entry is { rowNumber: number; vmIndex: number } => entry !== null);
}

async function buildSheetIdToPathMap(zip: JSZip): Promise<Map<number, string>> {
  const workbookXml = await readZipText(zip, 'xl/workbook.xml');
  const workbookRelsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels');
  const result = new Map<number, string>();

  if (!workbookXml || !workbookRelsXml) {
    return result;
  }

  const relsDoc = parseXmlDocument(workbookRelsXml);
  const relById = new Map<string, string>();
  getDescendantElements(relsDoc, 'Relationship').forEach((el) => {
    const id = getAttributeValue(el, ['Id', 'id']);
    const target = getAttributeValue(el, ['Target', 'target']);
    if (id && target) {
      relById.set(id, `xl/${target.replace(/^\.\.\//, '').replace(/^xl\//, '')}`);
    }
  });

  const wbDoc = parseXmlDocument(workbookXml);
  getDescendantElements(wbDoc, 'sheet').forEach((el) => {
    const sheetId = getNumericValue(getAttributeValue(el, ['sheetId']));
    const rId = getAttributeValue(el, ['id', 'r:id']);
    if (sheetId === null || !rId) {
      return;
    }
    const path = relById.get(rId);
    if (path) {
      result.set(sheetId, path);
    }
  });

  return result;
}

export async function extractWorkbookImageMap(
  buffer: ArrayBuffer,
  worksheets: Worksheet[],
): Promise<Map<string, string>> {
  const zip = await JSZip.loadAsync(buffer);
  const metadataXml = await readZipText(zip, 'xl/metadata.xml');

  if (!metadataXml) {
    return new Map();
  }

  const imageSourceByRichValue = await extractLocalImageSources(zip);

  if (imageSourceByRichValue.size === 0) {
    return new Map();
  }

  const metadataDocument = parseXmlDocument(metadataXml);
  const vmToRichValueIndex = extractVmToRichValueIndexes(metadataDocument);
  const sheetIdToPath = await buildSheetIdToPathMap(zip);
  const imageMap = new Map<string, string>();

  for (const worksheet of worksheets) {
    const sheetPath = sheetIdToPath.get(worksheet.id)
      ?? `xl/worksheets/sheet${worksheet.id}.xml`;
    const worksheetXml = await readZipText(zip, sheetPath);

    if (!worksheetXml) {
      continue;
    }

    const worksheetDocument = parseXmlDocument(worksheetXml);
    const rowImageRefs = getSheetRowImageRefs(worksheetDocument);

    rowImageRefs.forEach(({ rowNumber, vmIndex }) => {
      const richValueIndex = vmToRichValueIndex.get(vmIndex);
      const imageSource =
        richValueIndex === undefined ? null : imageSourceByRichValue.get(richValueIndex);

      if (imageSource) {
        imageMap.set(`${worksheet.id}:${rowNumber}`, imageSource);
      }
    });
  }

  return imageMap;
}
