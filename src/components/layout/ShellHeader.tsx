import type { ReactElement } from 'react';
import { Bell, Settings, UserCircle2 } from 'lucide-react';

export function ShellHeader(): ReactElement {
  return (
    <header className="shell-header">
      <div className="shell-header__brand">TRP Generator</div>
      <div className="shell-header__actions" aria-label="Application actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell aria-hidden="true" />
        </button>
        <button className="icon-button" type="button" aria-label="Preferences">
          <Settings aria-hidden="true" />
        </button>
        <button className="avatar-button" type="button" aria-label="Profile">
          <UserCircle2 aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
