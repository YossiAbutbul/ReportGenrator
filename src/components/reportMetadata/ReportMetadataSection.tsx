import type { ReactElement } from 'react';
import { MetadataField } from './MetadataField';

type MetadataFieldData = {
  key: string;
  label: string;
  placeholder?: string;
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
    <div className="sidebar-metadata">
      <div className="sidebar-metadata__fields">
        {fields.map((field) => (
          <MetadataField
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={field.value}
            span={field.span}
            type={field.type}
            onChange={(value) => onFieldChange(field.key, value)}
          />
        ))}

        <MetadataField
          label="Scope of Testing"
          placeholder="e.g. TRP test for LoRa, LTE and BLE bands."
          value={scopeOfTesting}
          span={4}
          multiline
          onChange={onScopeChange}
        />
      </div>
    </div>
  );
}
