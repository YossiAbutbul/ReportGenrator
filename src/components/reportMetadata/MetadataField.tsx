import type { ChangeEvent, ReactElement } from 'react';
import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

type MetadataFieldProps = {
  label: string;
  value: string;
  span?: 1 | 2 | 4;
  type?: 'text' | 'date-formatted';
  multiline?: boolean;
  onChange: (value: string) => void;
};

function formatDateInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayDateToIso(value: string): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return '';
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function isoDateToDisplay(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

type PickerCapableInput = HTMLInputElement & {
  showPicker?: () => void;
};

export function MetadataField({
  label,
  value,
  span = 1,
  type = 'text',
  multiline = false,
  onChange,
}: MetadataFieldProps): ReactElement {
  const datePickerRef = useRef<PickerCapableInput>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const nextValue =
      type === 'date-formatted'
        ? formatDateInput(event.target.value)
        : event.target.value;

    onChange(nextValue);
  };

  const handleDatePickerChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    onChange(isoDateToDisplay(event.target.value));
  };

  const openDatePicker = (): void => {
    datePickerRef.current?.showPicker?.();
    datePickerRef.current?.focus();
    datePickerRef.current?.click();
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
              inputMode={type === 'date-formatted' ? 'numeric' : undefined}
              placeholder={type === 'date-formatted' ? 'dd/mm/yyyy' : undefined}
              maxLength={type === 'date-formatted' ? 10 : undefined}
              onChange={handleChange}
            />
            {type === 'date-formatted' ? (
              <>
                <input
                  ref={datePickerRef}
                  className="metadata-field__native-date"
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  value={displayDateToIso(value)}
                  onChange={handleDatePickerChange}
                />
                <button
                  className="metadata-field__picker-button"
                  type="button"
                  aria-label={`Choose ${label}`}
                  onClick={openDatePicker}
                >
                  <CalendarDays
                    className="metadata-field__trailing-icon"
                    aria-hidden="true"
                  />
                </button>
              </>
            ) : null}
          </div>
        )}
      </label>
    </div>
  );
}
