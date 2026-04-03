import type { ReactElement } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type AppNotificationProps = {
  message: string;
  onClose: () => void;
};

export function AppNotification({
  message,
  onClose,
}: AppNotificationProps): ReactElement {
  return (
    <div className="app-notification" role="alert" aria-live="assertive">
      <div className="app-notification__icon" aria-hidden="true">
        <AlertTriangle aria-hidden="true" />
      </div>
      <div className="app-notification__copy">
        <strong>Upload Error</strong>
        <span>{message}</span>
      </div>
      <button
        aria-label="Dismiss notification"
        className="app-notification__close"
        type="button"
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
