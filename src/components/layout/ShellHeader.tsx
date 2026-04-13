import type { ReactElement } from 'react';
import { CircleHelp, FileText, Radar, Settings2, Shapes } from 'lucide-react';
import type { AppPage } from '../../types/navigation';
import { ThemeToggle } from './ThemeToggle';

type ShellHeaderProps = {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenHelp: () => void;
};

export function ShellHeader({
  activePage,
  onNavigate,
  onOpenHelp,
}: ShellHeaderProps): ReactElement {
  const items: Array<{ key: AppPage; label: string; icon: typeof Settings2 }> = [
    { key: 'reportSetup', label: 'Report Setup', icon: Settings2 },
    { key: 'reportArea', label: 'Report Area', icon: FileText },
    { key: 'graphViewer', label: '3D Graph', icon: Shapes },
    { key: 'graphViewer2d', label: '2D Graph', icon: Radar },
  ];
  const activeIndex = items.findIndex((item) => item.key === activePage);

  return (
    <header className="shell-header">
      <div className="shell-header__brand">Test Report Generator</div>
      <nav
        className="shell-header__nav"
        aria-label="Primary navigation"
        style={{ ['--active-index' as string]: activeIndex }}
      >
        <span className="shell-header__nav-indicator" aria-hidden="true" />
        {items.map((item) => (
          <button
            key={item.key}
            className={`shell-header__nav-item${activePage === item.key ? ' is-active' : ''}`}
            type="button"
            onClick={() => onNavigate(item.key)}
          >
            <item.icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="shell-header__actions">
        <ThemeToggle />
        <button
          aria-label="Open help center"
          className="shell-header__help-button"
          type="button"
          onClick={onOpenHelp}
        >
          <CircleHelp aria-hidden="true" />
          <span>Help Center</span>
        </button>
      </div>
    </header>
  );
}
