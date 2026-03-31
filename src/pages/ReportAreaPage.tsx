import type { ReactElement } from 'react';
import { Eye, FileText } from 'lucide-react';
import { useAppStore } from '../store/store';

export function ReportAreaPage(): ReactElement {
  const { metadata, tableRows } = useAppStore();

  return (
    <section className="report-area-page" aria-label="Report area">
      <article className="panel-card report-area-card">
        <div className="report-area-card__eyebrow">Report Area</div>
        <h1>{metadata.reportTitle || 'Report preview will live here'}</h1>
        <p>
          The tab is active now so we can verify page switching. Next we can hook this area to the
          generated report preview.
        </p>

        <div className="report-area-card__actions">
          <div className="report-area-card__action">
            <Eye aria-hidden="true" />
            <span>{tableRows.length > 0 ? `${tableRows.length} parsed rows ready` : 'Preview shell ready'}</span>
          </div>
          <div className="report-area-card__action">
            <FileText aria-hidden="true" />
            <span>{metadata.author || 'Waiting for report content'}</span>
          </div>
        </div>
      </article>
    </section>
  );
}
