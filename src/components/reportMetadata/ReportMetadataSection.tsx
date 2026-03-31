import type { ReactElement } from 'react';
import { MetadataField } from './MetadataField';

type MetadataFieldData = {
  key: string;
  label: string;
  value: string;
  span?: 1 | 2 | 4;
  type?: 'text' | 'date-formatted';
};

type ReportMetadataSectionProps = {
  fields: MetadataFieldData[];
  scopeOfTesting: string;
  onFieldChange: (key: string, value: string) => void;
  onScopeChange: (value: string) => void;
};

export function ReportMetadataSection({
  fields,
  scopeOfTesting,
  onFieldChange,
  onScopeChange,
}: ReportMetadataSectionProps): ReactElement {
  return (
    <article className="panel-card panel-card--metadata">
      <div className="panel-card__header panel-card__header--metadata">
        <span>Report Metadata</span>
        <span className="panel-card__badge panel-card__badge--metadata">
          Draft Auto-Saved
        </span>
      </div>

      <div className="metadata-grid">
        {fields.map((field) => (
          <MetadataField
            key={field.key}
            label={field.label}
            value={field.value}
            span={field.span}
            type={field.type}
            onChange={(value) => onFieldChange(field.key, value)}
          />
        ))}
        <MetadataField
          label="Scope of Testing"
          value={scopeOfTesting}
          span={4}
          multiline
          onChange={onScopeChange}
        />
      </div>
    </article>
  );
}
