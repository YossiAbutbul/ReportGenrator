import type { ReactElement } from 'react';
import { Menu, X } from 'lucide-react';

type ShellHeaderProps = {
  isMobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
};

export function ShellHeader({
  isMobileNavOpen = false,
  onToggleMobileNav,
}: ShellHeaderProps): ReactElement {
  return (
    <header className="shell-header">
      <div className="shell-header__brand">Test Report Generator</div>
      <button
        aria-expanded={isMobileNavOpen}
        aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="shell-header__menu-button"
        type="button"
        onClick={onToggleMobileNav}
      >
        {isMobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </header>
  );
}
