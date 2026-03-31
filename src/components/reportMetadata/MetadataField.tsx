import type { ChangeEvent, ReactElement } from 'react';
import { CalendarDays } from 'lucide-react';

type MetadataFieldProps = {
  label: string;
  value: string;
  span?: 1 | 2 | 4;
  multiline?: boolean;
  withTrailingIcon?: boolean;
  onChange: (value: string) => void;
};

export function MetadataField({
  label,
  value,
  span = 1,
  multiline = false,
  withTrailingIcon = false,
  onChange,
}: MetadataFieldProps): ReactElement {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    onChange(event.target.value);
  };

  return (
    <div className={`metadata-field metadata-field--span-${span}`}>
      <label className="metadata-field__label">
        <span>{label}</span>
        {multiline ? (
          <textarea
            className="metadata-field__control metadata-field__control--textarea"
            value={value}
            onChange={handleChange}
          />
        ) : (
          <div className="metadata-field__value">
            <input
              className="metadata-field__control"
              type="text"
              value={value}
              onChange={handleChange}
            />
            {withTrailingIcon ? (
              <CalendarDays
                className="metadata-field__trailing-icon"
                aria-hidden="true"
              />
            ) : null}
          </div>
        )}
      </label>
    </div>
  );
}
