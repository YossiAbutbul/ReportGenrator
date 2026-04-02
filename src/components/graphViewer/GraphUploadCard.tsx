import type {
  ChangeEvent,
  DragEvent,
  ReactElement,
  RefObject,
} from 'react';
import { useRef, useState } from 'react';
import { ChartColumnBig, FileUp } from 'lucide-react';

type GraphUploadCardProps = {
  description?: string;
  onFileSelected: (file: File) => void | Promise<void>;
  title?: string;
};

const acceptedGraphFileTypes = '.txt,text/plain';

function openFileDialog(inputRef: RefObject<HTMLInputElement | null>): void {
  inputRef.current?.click();
}

export function GraphUploadCard({
  description = 'Choose a TXT measurement export to generate a 3D graph preview',
  onFileSelected,
  title = 'Upload Graph Data',
}: GraphUploadCardProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleFile = (file: File | null): void => {
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    void onFileSelected(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleFile(event.target.files?.[0] ?? null);
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
    handleFile(event.dataTransfer.files?.[0] ?? null);
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
