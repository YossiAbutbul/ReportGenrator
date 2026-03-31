import type { PropsWithChildren, ReactElement } from 'react';
import { ShellHeader } from './ShellHeader';
import { SidebarNav } from './SidebarNav';

const navItems = [
  { label: 'Report Setup', active: true },
  { label: 'Analytics' },
  { label: 'Data Tables' },
  { label: 'Settings' },
];

export function AppShell({ children }: PropsWithChildren): ReactElement {
  return (
    <div className="app-shell">
      <ShellHeader />
      <div className="app-shell__body">
        <SidebarNav
          productName="TRP Clinical"
          versionLabel="v2.4.0 Stable"
          actionLabel="New Analysis"
          items={navItems}
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
