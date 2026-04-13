import type {
  ChangeEvent,
  DragEvent,
  ReactElement,
  RefObject,
} from 'react';
import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useAppStore } from '../../store/store';

type GraphUploadCardProps = {
  description?: string;
  mode?: 'graph3d' | 'graph2d';
  onFileSelected: (file: File) => boolean | Promise<boolean>;
  title?: string;
};

const acceptedGraphFileTypes = '.txt,text/plain';

function openFileDialog(inputRef: RefObject<HTMLInputElement | null>): void {
  inputRef.current?.click();
}

export function GraphUploadCard({
  description = 'Drag & drop or click to upload',
  mode = 'graph3d',
  onFileSelected,
}: GraphUploadCardProps): ReactElement {
  const {
    graph3d,
    graph2d,
    notifications: { showErrorNotification },
  } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const selectedFileName = mode === 'graph2d'
    ? graph2d.selectedFileName
    : graph3d.selectedFileName;

  const handleFile = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }

    if (!/\.txt$/i.test(file.name)) {
      showErrorNotification('Please upload a valid TXT measurement file.');
      return;
    }

    const didAcceptFile = await onFileSelected(file);

    if (didAcceptFile === false) {
      return;
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void handleFile(event.target.files?.[0] ?? null);
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
    void handleFile(event.dataTransfer.files?.[0] ?? null);
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
        accept={acceptedGraphFileTypes}
        aria-label="Upload graph data file"
        className="upload-card__input"
        type="file"
        onChange={handleInputChange}
      />

      <button
        className="upload-card__drop-zone"
        type="button"
        aria-label="Click or drag to upload a TXT file"
        onClick={() => openFileDialog(inputRef)}
      >
        {selectedFileName ? (
          <>
            <FileText className="upload-card__drop-icon upload-card__drop-icon--file" aria-hidden="true" />
            <span className="upload-card__file-name">{selectedFileName}</span>
          </>
        ) : (
          <>
            <Upload className="upload-card__drop-icon" aria-hidden="true" />
            <span className="upload-card__drop-hint">{description}</span>
          </>
        )}
      </button>

      <div className="upload-card__actions">
        <button
          className="button button--primary upload-card__button"
          type="button"
          onClick={() => openFileDialog(inputRef)}
        >
          <FileText aria-hidden="true" />
          <span>Choose File</span>
        </button>
      </div>
    </div>
  );
}
