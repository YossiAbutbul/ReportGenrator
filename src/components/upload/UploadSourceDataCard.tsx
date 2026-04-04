import type {
  ChangeEvent,
  DragEvent,
  ReactElement,
  RefObject,
} from 'react';
import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { downloadReportTemplate } from '../../services/downloadTemplate';
import { useAppStore } from '../../store/store';

type UploadSourceDataCardProps = {
  onFileSelected?: (file: File) => boolean | Promise<boolean>;
};

const acceptedFileTypes =
  '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

function openFileDialog(inputRef: RefObject<HTMLInputElement | null>): void {
  inputRef.current?.click();
}

export function UploadSourceDataCard({
  onFileSelected,
}: UploadSourceDataCardProps): ReactElement {
  const {
    notifications: { showErrorNotification },
    reportSetupUi: { sourceDataFileName },
  } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }

    const isValidFile = /\.(xls|xlsx|csv)$/i.test(file.name);

    if (!isValidFile) {
      showErrorNotification('Please upload a valid Excel or CSV source file.');
      return;
    }

    const didAcceptFile = await onFileSelected?.(file);

    if (didAcceptFile === false) {
      return;
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    void handleFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    void handleFile(file);
  };

  return (
    <div
      className={`upload-card${isDragActive ? ' is-drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="upload-card__input"
        type="file"
        accept={acceptedFileTypes}
        onChange={handleInputChange}
        aria-label="Upload source data file"
      />

      <div className="upload-card__icon" aria-hidden="true">
        <Upload aria-hidden="true" />
      </div>

      <div className="upload-card__copy">
        <h1>Upload Source Data</h1>
        <div className="upload-card__status">
          <p className={sourceDataFileName ? 'upload-card__file-text' : ''}>
            {sourceDataFileName
              ? sourceDataFileName
              : 'Drag and drop your Excel report files for automated analysis'}
          </p>
        </div>
      </div>

      <div className="upload-card__actions">
        <button
          className="button button--ghost upload-card__button"
          type="button"
          onClick={downloadReportTemplate}
        >
          <Download aria-hidden="true" />
          <span>Download Template</span>
        </button>
        <button
          className="button button--primary upload-card__button"
          type="button"
          onClick={() => openFileDialog(inputRef)}
        >
          <FileSpreadsheet aria-hidden="true" />
          <span>Choose File</span>
        </button>
      </div>
    </div>
  );
}
