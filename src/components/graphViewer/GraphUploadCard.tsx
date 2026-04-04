import type {
  ChangeEvent,
  DragEvent,
  ReactElement,
  RefObject,
} from 'react';
import { useRef, useState } from 'react';
import { ChartColumnBig, FileUp } from 'lucide-react';
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
  description = 'Choose a TXT measurement export to generate a 3D graph preview',
  mode = 'graph3d',
  onFileSelected,
  title = 'Upload Graph Data',
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

      <div className="upload-card__icon" aria-hidden="true">
        <ChartColumnBig aria-hidden="true" />
      </div>

      <div className="upload-card__copy">
        <h1>{title}</h1>
        <div className="upload-card__status">
          <p className={selectedFileName ? 'upload-card__file-text' : ''}>
            {selectedFileName || description}
          </p>
        </div>
      </div>

      <div className="upload-card__actions">
        <button
          className="button button--primary upload-card__button"
          type="button"
          onClick={() => openFileDialog(inputRef)}
        >
          <FileUp aria-hidden="true" />
          <span>Choose TXT File</span>
        </button>
      </div>
    </div>
  );
}
