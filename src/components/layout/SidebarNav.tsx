import type { ReactElement } from 'react';

type NavItem = {
  label: string;
  active?: boolean;
};

type SidebarNavProps = {
  productName: string;
  versionLabel: string;
  actionLabel: string;
  items: NavItem[];
  footerLabel: string;
};

export function SidebarNav({
  productName,
  versionLabel,
  actionLabel,
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

        <button className="sidebar-nav__action" type="button">
          + {actionLabel}
        </button>

        <nav className="sidebar-nav__items" aria-label="Primary navigation">
          {items.map((item) => (
            <button
              key={item.label}
              className={`sidebar-nav__item${item.active ? ' is-active' : ''}`}
              type="button"
            >
              <span className="sidebar-nav__item-icon" aria-hidden="true">
                {item.active ? 'P' : 'D'}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <button className="sidebar-nav__footer" type="button">
        <span className="sidebar-nav__item-icon" aria-hidden="true">
          ?
        </span>
        <span>{footerLabel}</span>
      </button>
    </aside>
  );
}
