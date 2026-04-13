import JSZip from 'jszip';
import type { ReportPreview } from '../../types/report';

const REPORT_EXPORT_STYLES = `
  @page {
    size: A4;
    margin: 18mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #ffffff;
    color: #1f2f45;
    font-family: Calibri, Arial, sans-serif;
  }

  .report-preview {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .report-page {
    display: block;
    width: 100%;
    padding: 0;
    background: #ffffff;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }

  .report-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .report-page--cover {
    min-height: 250mm;
    page-break-after: always;
  }

  .report-page__header,
  .report-page__cover-copy,
  .report-page__section {
    display: block;
    margin-bottom: 16px;
  }

  .report-page__cover-brand {
    text-align: center;
    padding-top: 8px;
  }

  .report-page__cover-brand img {
    width: 6.25in;
    height: auto;
  }

  .report-page__cover-copy {
    padding-top: 80px;
    text-align: center;
  }

  .report-page__cover-copy h1,
  .report-page__header h2,
  .report-page__section h3 {
    margin: 0;
    color: #103f86;
  }

  .report-page__cover-copy h1 {
    font-size: 44pt;
    line-height: 1;
    margin-bottom: 18px;
  }

  .report-page__cover-subtitle,
  .report-page__date,
  .report-page__lead {
    margin: 0;
    color: #445c7c;
    font-size: 18px;
    line-height: 1.6;
  }

  .report-page__lead--ltr {
    direction: ltr;
    text-align: left;
  }

  .report-page__cover-meta {
    text-align: center;
    padding-top: 12px;
  }

  .report-page__cover-meta strong {
    color: #102d5c;
    display: block;
    margin-bottom: 8px;
  }

  .report-page__setup-image,
  .report-result-table__graph-image {
    display: block;
    max-width: 100%;
    image-rendering: auto;
  }

  .report-page__setup-image {
    width: 5.31in;
    height: 3.1in;
    object-fit: contain;
    border: 1px solid #1d1d1d;
    margin: 0 auto;
  }

  .report-page__setup-block {
    text-align: center;
  }

  .report-data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .report-data-table th,
  .report-data-table td {
    border: 1px solid #1d1d1d;
    padding: 8px 10px;
    color: #223750;
    font-size: 14px;
    vertical-align: middle;
    text-align: left;
  }

  .report-data-table th {
    font-weight: 700;
    text-align: left;
    background: #ffffff;
  }

  .report-data-table--kv th:first-child,
  .report-data-table--kv td:first-child {
    width: 35%;
  }

  .report-chip-list {
    display: block;
  }

  .report-chip {
    display: inline-block;
    padding: 6px 12px;
    margin: 0 8px 8px 0;
    border: 1px solid #dbe6f4;
    border-radius: 999px;
    background: #f8fbff;
    color: #36557f;
    font-size: 13px;
    font-weight: 700;
  }

  .report-page__stats {
    display: block;
    margin-bottom: 12px;
  }

  .report-page__stat {
    display: inline-block;
    padding: 8px 12px;
    margin: 0 10px 10px 0;
    border: 1px solid #dbe6f4;
    border-radius: 999px;
    background: #f8fbff;
    color: #567192;
    font-size: 13px;
    font-weight: 700;
  }

  .report-page__stat svg,
  .report-actions,
  .report-page__footer,
  .report-area-card__action {
    display: none !important;
  }

  .report-page__header h2,
  .report-page__section h3 {
    margin: 0 0 12px;
  }

  .report-result-table__graph-image {
    width: auto;
    height: 1in;
    object-fit: contain;
    margin: 0 auto;
  }

  .report-notes {
    min-height: 180px;
    border: 1px solid #c9d8ec;
    padding: 16px;
    color: #7085a2;
  }
`;

const TEMPLATE_DOCX_PATH = `${import.meta.env.BASE_URL}report-template-assets/report-template-base.docx`;
const EMUS_PER_INCH = 914400;
const COVER_IMAGE_RELATIONSHIP_ID = 'rId11';
const SETUP_IMAGE_RELATIONSHIP_ID = 'rId13';
const BASE_DOCUMENT_RELATIONSHIPS = [
  { id: 'rId1', type: 'styles', target: 'styles.xml' },
  { id: 'rId2', type: 'numbering', target: 'numbering.xml' },
  { id: 'rId3', type: 'footnotes', target: 'footnotes.xml' },
  { id: 'rId4', type: 'endnotes', target: 'endnotes.xml' },
  { id: 'rId5', type: 'settings', target: 'settings.xml' },
  { id: 'rId6', type: 'comments', target: 'comments.xml' },
  { id: 'rId7', type: 'header', target: 'header1.xml' },
  { id: 'rId8', type: 'header', target: 'header2.xml' },
  { id: 'rId9', type: 'footer', target: 'footer1.xml' },
  { id: 'rId10', type: 'footer', target: 'footer2.xml' },
  { id: 'rId11', type: 'image', target: 'media/03ec902e7cf66592cba88fc524233c675d89640c.jpg' },
  { id: 'rId12', type: 'image', target: 'media/0ca1c6e53d8288e8d3ea530d6190e15d5b9c4ed6.svg' },
  { id: 'rId13', type: 'image', target: 'media/ffcab70891cacb07d3310d81069e5d6771cf527c.png' },
  { id: 'rId14', type: 'image', target: 'media/c8d1d4af4bc368af7ed7ffb0169cddf82bc528f5.png' },
  { id: 'rId15', type: 'image', target: 'media/9b1603b9f99824ca661ca23f8192e0aa01ea8dd8.png' },
  { id: 'rId16', type: 'image', target: 'media/277bb08b2571c600726c72a83ddc611a37f8a9ef.png' },
  { id: 'rId17', type: 'image', target: 'media/c765f99bd592cb7c8bdb0e7e96a4a15de0ba06c8.png' },
  { id: 'rId18', type: 'image', target: 'media/5a77147ff053463ec08da2672fa93053299aa04a.png' },
  { id: 'rId19', type: 'image', target: 'media/eb75886c000b8531f304ce62c5835f7a5ac8ebeb.png' },
  { id: 'rId20', type: 'fontTable', target: 'fontTable.xml' },
] as const;

type DocxImagePart = {
  relationshipId: string;
  target: string;
  data: ArrayBuffer;
  widthEmu: number;
  heightEmu: number;
};

function sanitizeFileNamePart(value: string, fallback: string): string {
  const normalized = value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-');
  const collapsed = normalized.replace(/\s+/g, ' ').replace(/-+/g, '-').trim();

  return collapsed.length > 0 ? collapsed : fallback;
}

function buildExportFileName(title: string, date: string, extension: string): string {
  const safeTitle = sanitizeFileNamePart(title, 'Report');
  const safeDate = sanitizeFileNamePart(date, 'Date');

  return `${safeTitle} ${safeDate}.${extension}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createRun(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    fontFamily?: string;
  } = {},
): string {
  const properties: string[] = [];

  properties.push('<w:rFonts w:ascii="Calibri" w:cs="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri"/>');

  if (options.bold) {
    properties.push('<w:b/>', '<w:bCs/>');
  }

  if (options.color) {
    properties.push(`<w:color w:val="${options.color}"/>`);
  }

  if (options.size) {
    properties.push(`<w:sz w:val="${options.size}"/>`, `<w:szCs w:val="${options.size}"/>`);
  }

  return `
    <w:r>
      ${properties.length > 0 ? `<w:rPr>${properties.join('')}</w:rPr>` : ''}
      <w:t xml:space="preserve">${xmlEscape(text)}</w:t>
    </w:r>
  `;
}

function createParagraph(
  text: string,
  options: {
    align?: 'left' | 'center';
    bold?: boolean;
    size?: number;
    color?: string;
    spacingAfter?: number;
    spacingBefore?: number;
    pageBreakBefore?: boolean;
    styleId?: 'Heading1' | 'Heading2' | 'Title';
    bidi?: boolean;
  } = {},
): string {
  const paragraphProperties: string[] = [];

  if (options.styleId) {
    paragraphProperties.push(`<w:pStyle w:val="${options.styleId}"/>`);
  }

  if (options.pageBreakBefore) {
    paragraphProperties.push('<w:pageBreakBefore/>');
  }

  if (options.align) {
    paragraphProperties.push(`<w:jc w:val="${options.align}"/>`);
  }

  if (options.bidi === false) {
    paragraphProperties.push('<w:bidi w:val="false"/>');
  }

  if (options.spacingAfter !== undefined || options.spacingBefore !== undefined) {
    paragraphProperties.push(
      `<w:spacing${options.spacingAfter !== undefined ? ` w:after="${options.spacingAfter}"` : ''}${options.spacingBefore !== undefined ? ` w:before="${options.spacingBefore}"` : ''}/>`,
    );
  }

  return `
    <w:p>
      ${paragraphProperties.length > 0 ? `<w:pPr>${paragraphProperties.join('')}</w:pPr>` : ''}
      ${createRun(text, options)}
    </w:p>
  `;
}

function createEmptyEditableParagraph(): string {
  return `
    <w:p>
      <w:pPr>
        <w:bidi w:val="false"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:cs="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
          <w:szCs w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve"></w:t>
      </w:r>
    </w:p>
  `;
}

function appendEditableParagraphBeforePageBreak(content: string): string {
  return `${content}${createEmptyEditableParagraph()}`;
}

function createPageBreak(): string {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function createImageParagraph(
  relationshipId: string,
  widthEmu: number,
  heightEmu: number,
  options: {
    align?: 'left' | 'center';
    spacingAfter?: number;
  } = {},
): string {
  const paragraphProperties: string[] = [];

  if (options.align) {
    paragraphProperties.push(`<w:jc w:val="${options.align}"/>`);
  }

  if (options.spacingAfter !== undefined) {
    paragraphProperties.push(`<w:spacing w:after="${options.spacingAfter}"/>`);
  }

  return `
    <w:p>
      ${paragraphProperties.length > 0 ? `<w:pPr>${paragraphProperties.join('')}</w:pPr>` : ''}
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent t="0" r="0" b="0" l="0"/>
            <wp:docPr id="1" name="" descr="" title=""/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="" descr=""/>
                    <pic:cNvPicPr>
                      <a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
                    </pic:cNvPicPr>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${relationshipId}" cstate="none"/>
                    <a:srcRect/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr bwMode="auto">
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${widthEmu}" cy="${heightEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `;
}

function createTable(
  rows: string[][],
  options: {
    columnWidths?: number[];
    headerRow?: boolean;
    centerColumns?: number[];
  } = {},
): string {
  const gridColumns = options.columnWidths?.length
    ? options.columnWidths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')
    : rows[0]?.map(() => '<w:gridCol w:w="100"/>').join('') ?? '';

  const bodyRows = rows.map((row, rowIndex) => {
    const cells = row.map((cellContent, cellIndex) => {
      const isHeader = options.headerRow && rowIndex === 0;
      const align = options.centerColumns?.includes(cellIndex) ? 'center' : 'left';

      return `
        <w:tc>
          <w:tcPr>
            ${options.columnWidths?.[cellIndex] ? `<w:tcW w:type="dxa" w:w="${options.columnWidths[cellIndex]}"/>` : ''}
            <w:tcMar>
              <w:top w:type="dxa" w:w="100"/>
              <w:left w:type="dxa" w:w="120"/>
              <w:bottom w:type="dxa" w:w="100"/>
              <w:right w:type="dxa" w:w="120"/>
            </w:tcMar>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          ${
            cellContent.includes('<w:p>')
              ? cellContent
              : createParagraph(cellContent, {
                align,
                bold: isHeader,
                size: 21,
                spacingAfter: 0,
                bidi: false,
              })
          }
        </w:tc>
      `;
    }).join('');

    return `<w:tr>${cells}</w:tr>`;
  }).join('');

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:type="pct" w:w="5000"/>
        <w:jc w:val="left"/>
        <w:tblBorders>
          <w:top w:val="single" w:color="000000" w:sz="1"/>
          <w:left w:val="single" w:color="000000" w:sz="1"/>
          <w:bottom w:val="single" w:color="000000" w:sz="1"/>
          <w:right w:val="single" w:color="000000" w:sz="1"/>
          <w:insideH w:val="single" w:color="000000" w:sz="1"/>
          <w:insideV w:val="single" w:color="000000" w:sz="1"/>
        </w:tblBorders>
        <w:tblLayout w:type="fixed"/>
      </w:tblPr>
      <w:tblGrid>${gridColumns}</w:tblGrid>
      ${bodyRows}
    </w:tbl>
  `;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function createEmbeddableMarkup(root: HTMLElement): Promise<string> {
  const clone = root.cloneNode(true) as HTMLElement;
  const images = [...clone.querySelectorAll('img')];

  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute('src');

      if (!src) {
        return;
      }

      if (src.startsWith('data:')) {
        return;
      }

      try {
        const response = await fetch(src);
        const blob = await response.blob();
        image.setAttribute('src', await blobToDataUrl(blob));
      } catch {
        image.removeAttribute('src');
      }
    }),
  );

  return clone.outerHTML;
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      reject(new Error('Could not read image dimensions.'));
      URL.revokeObjectURL(url);
    };

    image.src = url;
  });
}

async function buildDocxImageParts(report: ReportPreview): Promise<DocxImagePart[]> {
  const imageParts: DocxImagePart[] = [];
  let imageIndex = 0;

  for (const section of report.sections) {
    for (const row of section.rows) {
      if (!row.graphImageSrc) {
        continue;
      }

      const response = await fetch(row.graphImageSrc);
      const blob = await response.blob();
      const { width, height } = await getImageDimensions(blob);

      if (!width || !height) {
        continue;
      }

      imageIndex += 1;
      const target = `media/generated-graph-${imageIndex}.png`;
      const heightEmu = EMUS_PER_INCH;
      const widthEmu = Math.max(1, Math.round((width / height) * heightEmu));

      imageParts.push({
        relationshipId: `rId${200 + imageIndex}`,
        target,
        data: await blobToArrayBuffer(blob),
        widthEmu,
        heightEmu,
      });
    }
  }

  return imageParts;
}

function buildResultsTableXml(
  section: ReportPreview['sections'][number],
  imagePartsByRowKey: Map<string, DocxImagePart>,
): string {
  const rows: string[][] = [
    ['Unit ID', 'Frequency', 'TRP (dBm)', 'Peak (dBm)', '3D Graph'],
  ];

  section.rows.forEach((row) => {
    const imagePart = imagePartsByRowKey.get(row.rowKey);
    const imageCell = imagePart
      ? createImageParagraph(
        imagePart.relationshipId,
        imagePart.widthEmu,
        imagePart.heightEmu,
        { align: 'center', spacingAfter: 0 },
      )
      : createParagraph('No graph', { align: 'center', size: 20, spacingAfter: 0 });

    rows.push([
      row.unit,
      row.frequency,
      row.trp,
      row.peak,
      imageCell,
    ]);
  });

  return createTable(rows, {
    headerRow: true,
    columnWidths: [2200, 1800, 1500, 1500, 1800],
  });
}

function buildDocumentXml(
  report: ReportPreview,
  imagePartsByRowKey: Map<string, DocxImagePart>,
  unitPlacementImagePart: DocxImagePart | null,
): string {
  const measurementTable = createTable(
    [
      ['Parameter', 'Value'],
      ...report.measurementParameters.map((row) => [row.key, row.value]),
    ],
    { headerRow: true, columnWidths: [2500, 5000] },
  );

  const firmwareHardwareTable = createTable(
    [
      ['Parameter', 'Value'],
      ...report.firmwareHardwareParameters.map((row) => [row.key, row.value]),
    ],
    { headerRow: true, columnWidths: [2500, 5000] },
  );

  const unitIdsTable = createTable(
    [
      ['Parameter', 'Value'],
      ...report.sections.map((section) => [
        section.title,
        section.unitIds.length > 0 ? section.unitIds.join(', ') : '-',
      ]),
    ],
    { headerRow: true, columnWidths: [2500, 5000] },
  );

  const resultPages = report.sections.map((section) => `
    ${appendEditableParagraphBeforePageBreak(`
    ${createParagraph(section.title, {
      styleId: 'Heading1',
      bold: true,
      size: 32,
      color: '002060',
      spacingAfter: 220,
      spacingBefore: 120,
      pageBreakBefore: true,
    })}
    ${buildResultsTableXml(section, imagePartsByRowKey)}
    `)}
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${appendEditableParagraphBeforePageBreak(`
    ${createImageParagraph(COVER_IMAGE_RELATIONSHIP_ID, Math.round(6.25 * EMUS_PER_INCH), Math.round(2.456 * EMUS_PER_INCH), {
      align: 'center',
      spacingAfter: 220,
    })}
    ${createParagraph(report.title, {
      align: 'center',
      bold: true,
      size: 160,
      color: '002060',
      spacingAfter: 260,
    })}
    ${createParagraph(`By: ${report.author}`, {
      align: 'center',
      size: 28,
      spacingAfter: 120,
    })}
    ${createParagraph(report.date, {
      align: 'center',
      size: 28,
      spacingAfter: 0,
    })}
    `)}
    ${createPageBreak()}

    ${appendEditableParagraphBeforePageBreak(`
    ${createParagraph('Test Setup', {
      styleId: 'Heading1',
      bold: true,
      size: 32,
      color: '002060',
      spacingAfter: 220,
      spacingBefore: 120,
    })}
    ${createImageParagraph(
      SETUP_IMAGE_RELATIONSHIP_ID,
      Math.round(5.31 * EMUS_PER_INCH),
      Math.round(3.1 * EMUS_PER_INCH),
      { align: 'center', spacingAfter: 220 },
    )}
    ${unitPlacementImagePart ? createImageParagraph(
      unitPlacementImagePart.relationshipId,
      unitPlacementImagePart.widthEmu,
      unitPlacementImagePart.heightEmu,
      { align: 'center', spacingAfter: 0 },
    ) : ''}
    `)}
    ${createPageBreak()}
    ${appendEditableParagraphBeforePageBreak(`
    ${createParagraph('Report Details', {
      styleId: 'Heading1',
      bold: true,
      size: 32,
      color: '002060',
      spacingAfter: 220,
      spacingBefore: 120,
    })}
    ${createParagraph('Scope of Testing', {
      styleId: 'Heading2',
      bold: true,
      size: 26,
      color: '002060',
      spacingAfter: 180,
      spacingBefore: 120,
    })}
    ${createParagraph(report.metadata.scopeOfTesting.trim() || '1. TRP test', {
      align: 'left',
      size: 24,
      spacingAfter: 120,
      bidi: false,
    })}
    ${createParagraph('Measurement Parameters', {
      styleId: 'Heading2',
      bold: true,
      size: 26,
      color: '002060',
      spacingAfter: 180,
      spacingBefore: 120,
    })}
    ${measurementTable}
    ${createParagraph('', { spacingAfter: 180, bidi: false })}
    ${createParagraph('Firmware / Hardware Versions', {
      styleId: 'Heading2',
      bold: true,
      size: 26,
      color: '002060',
      spacingAfter: 180,
      spacingBefore: 120,
    })}
    ${firmwareHardwareTable}
    ${createParagraph('', { spacingAfter: 180, bidi: false })}
    ${createParagraph('Unit IDs', {
      styleId: 'Heading2',
      bold: true,
      size: 26,
      color: '002060',
      spacingAfter: 180,
      spacingBefore: 120,
    })}
    ${unitIdsTable}
    `)}

    ${resultPages}

    ${appendEditableParagraphBeforePageBreak(`
    ${createParagraph('Notes', {
      styleId: 'Heading1',
      bold: true,
      size: 32,
      color: '002060',
      spacingAfter: 220,
      spacingBefore: 120,
      pageBreakBefore: true,
    })}
    ${createEmptyEditableParagraph()}
    ${createEmptyEditableParagraph()}
    ${createEmptyEditableParagraph()}
    `)}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="706" w:footer="706" w:gutter="0"/>
      <w:pgNumType/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildDocumentRelationshipsXml(imageParts: DocxImagePart[]): string {
  const baseRelationships = BASE_DOCUMENT_RELATIONSHIPS.map((relationship) => `
    <Relationship
      Id="${relationship.id}"
      Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${relationship.type}"
      Target="${relationship.target}"/>`);
  const imageRelationships = imageParts.map((imagePart) => `
    <Relationship
      Id="${imagePart.relationshipId}"
      Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
      Target="${imagePart.target}"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${[...baseRelationships, ...imageRelationships].join('')}
</Relationships>`;
}

async function buildUnitPlacementImagePart(
  dataUrl: string,
): Promise<DocxImagePart> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const { width, height } = await getImageDimensions(blob);
  const maxWidthInches = 3;
  const maxHeightInches = 5;
  let widthEmu = Math.round((width / 96) * EMUS_PER_INCH);
  let heightEmu = Math.round((height / 96) * EMUS_PER_INCH);
  const maxWidthEmu = Math.round(maxWidthInches * EMUS_PER_INCH);
  const maxHeightEmu = Math.round(maxHeightInches * EMUS_PER_INCH);

  if (widthEmu > maxWidthEmu) {
    const ratio = maxWidthEmu / widthEmu;
    widthEmu = maxWidthEmu;
    heightEmu = Math.round(heightEmu * ratio);
  }

  if (heightEmu > maxHeightEmu) {
    const ratio = maxHeightEmu / heightEmu;
    heightEmu = maxHeightEmu;
    widthEmu = Math.round(widthEmu * ratio);
  }

  return {
    relationshipId: 'rId100',
    target: 'media/unit-placement.png',
    data: await blobToArrayBuffer(blob),
    widthEmu,
    heightEmu,
  };
}

export async function exportReportAsWord(
  report: ReportPreview,
  unitPlacementDataUrl: string | null = null,
): Promise<void> {
  const response = await fetch(TEMPLATE_DOCX_PATH);

  if (!response.ok) {
    throw new Error('Could not load the Word template.');
  }

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const imageParts = await buildDocxImageParts(report);
  const imagePartsByRowKey = new Map<string, DocxImagePart>();
  let imagePartIndex = 0;

  report.sections.forEach((section) => {
    section.rows.forEach((row) => {
      if (!row.graphImageSrc) {
        return;
      }

      const imagePart = imageParts[imagePartIndex];
      imagePartIndex += 1;

      if (imagePart) {
        imagePartsByRowKey.set(row.rowKey, imagePart);
      }
    });
  });

  let unitPlacementImagePart: DocxImagePart | null = null;

  if (unitPlacementDataUrl) {
    unitPlacementImagePart = await buildUnitPlacementImagePart(unitPlacementDataUrl);
    imageParts.push(unitPlacementImagePart);
  }

  zip.file('word/document.xml', buildDocumentXml(report, imagePartsByRowKey, unitPlacementImagePart));
  zip.file('word/_rels/document.xml.rels', buildDocumentRelationshipsXml(imageParts));

  imageParts.forEach((imagePart) => {
    zip.file(`word/${imagePart.target}`, imagePart.data);
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = buildExportFileName(report.title, report.date, 'docx');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
