import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AppPage } from '../../types/navigation';
import {
  ChartColumnBig,
  FileText,
  HelpCircle,
  Settings2,
} from 'lucide-react';

type NavItem = {
  label: string;
  key: AppPage;
  icon: LucideIcon;
};

type SidebarNavProps = {
  activeItem: AppPage;
  onNavigate: (item: AppPage) => void;
  footerLabel: string;
};

export function SidebarNav({
  activeItem,
  onNavigate,
  footerLabel,
}: SidebarNavProps): ReactElement {
  const items: NavItem[] = [
    { key: 'reportSetup', label: 'Report Setup', icon: Settings2 },
    { key: 'reportArea', label: 'Report Area', icon: FileText },
    { key: 'graphViewer', label: '3D Graph Viewer', icon: ChartColumnBig },
  ];
  const activeIndex = items.findIndex((item) => item.key === activeItem);

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__top">
        <nav
          className="sidebar-nav__items"
          aria-label="Primary navigation"
          style={{ ['--active-index' as string]: activeIndex }}
        >
          <span className="sidebar-nav__active-indicator" aria-hidden="true" />
          {items.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav__item${activeItem === item.key ? ' is-active' : ''}`}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              <span className="sidebar-nav__item-icon" aria-hidden="true">
                <item.icon aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <button className="sidebar-nav__footer" type="button">
        <span className="sidebar-nav__item-icon" aria-hidden="true">
          <HelpCircle aria-hidden="true" />
        </span>
        <span>{footerLabel}</span>
      </button>
    </aside>
  );
}
