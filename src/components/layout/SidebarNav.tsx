import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AppPage } from '../../types/navigation';
import {
  FileCog,
  FileText,
  HelpCircle,
} from 'lucide-react';

type NavItem = {
  label: string;
  key: AppPage;
  icon: LucideIcon;
};

type SidebarNavProps = {
  activeItem: AppPage;
  canOpenReportArea: boolean;
  onNavigate: (item: AppPage) => void;
  productName: string;
  versionLabel: string;
  footerLabel: string;
};

export function SidebarNav({
  activeItem,
  canOpenReportArea,
  onNavigate,
  productName,
  versionLabel,
  footerLabel,
}: SidebarNavProps): ReactElement {
  const items: Array<NavItem & { disabled?: boolean }> = [
    { key: 'reportSetup', label: 'Report Setup', icon: FileCog },
    { key: 'reportArea', label: 'Report Area', icon: FileText, disabled: !canOpenReportArea },
  ];

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
              key={item.key}
              className={`sidebar-nav__item${activeItem === item.key ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`}
              type="button"
              disabled={item.disabled}
              aria-disabled={item.disabled ? 'true' : undefined}
              title={item.disabled ? 'Available after report preview is created' : undefined}
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
