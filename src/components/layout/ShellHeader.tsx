import type { ReactElement } from 'react';

export function ShellHeader(): ReactElement {
  return (
    <header className="shell-header">
      <div className="shell-header__brand">TRP Generator</div>
      <div className="shell-header__actions" aria-label="Application actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          i
        </button>
        <button className="icon-button" type="button" aria-label="Preferences">
          o
        </button>
        <button className="avatar-button" type="button" aria-label="Profile">
          Y
        </button>
      </div>
    </header>
  );
}
