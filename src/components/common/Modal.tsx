import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({
  isOpen,
  title,
  onClose,
  children,
}: ModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="modal"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal__dialog"
        role="dialog"
      >
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">
            {title}
          </h2>
          <button
            aria-label="Close modal"
            className="modal__close"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal__content">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
