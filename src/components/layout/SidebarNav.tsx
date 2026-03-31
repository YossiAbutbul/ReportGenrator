import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Database,
  FileCog,
  HelpCircle,
  Settings2,
} from 'lucide-react';

type NavItem = {
  label: string;
  active?: boolean;
  icon: LucideIcon;
};

type SidebarNavProps = {
  productName: string;
  versionLabel: string;
  items: NavItem[];
  footerLabel: string;
};

export function SidebarNav({
  productName,
  versionLabel,
  items,
  footerLabel,
}: SidebarNavProps): ReactElement {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__top">
        <div className="sidebar-nav__product">
          <div className="sidebar-nav__product-name">{productName}</div>
          <div className="sidebar-nav__product-version">{versionLabel}</div>
        </div>

        <nav className="sidebar-nav__items" aria-label="Primary navigation">
          {items.map((item) => (
            <button
              key={item.label}
              className={`sidebar-nav__item${item.active ? ' is-active' : ''}`}
              type="button"
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

export const defaultSidebarItems: NavItem[] = [
  { label: 'Report Setup', active: true, icon: FileCog },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Data Tables', icon: Database },
  { label: 'Settings', icon: Settings2 },
];
