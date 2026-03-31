import type {
  ChangeEvent,
  DragEvent,
  ReactElement,
  RefObject,
} from 'react';
import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { downloadReportTemplate } from '../services/downloadTemplate';

type UploadSourceDataCardProps = {
  onFileSelected?: (file: File) => void;
};

const acceptedFileTypes =
  '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

function openFileDialog(inputRef: RefObject<HTMLInputElement | null>): void {
  inputRef.current?.click();
}

export function UploadSourceDataCard({
  onFileSelected,
}: UploadSourceDataCardProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (file: File | null): void => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    onFileSelected?.(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
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
    handleFile(file);
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
          <p className={selectedFile ? 'upload-card__file-text' : ''}>
            {selectedFile
              ? selectedFile.name
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
