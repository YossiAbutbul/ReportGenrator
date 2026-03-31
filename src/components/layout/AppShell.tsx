import type { PropsWithChildren, ReactElement } from 'react';
import { ShellHeader } from './ShellHeader';
import { SidebarNav, defaultSidebarItems } from './SidebarNav';

export function AppShell({ children }: PropsWithChildren): ReactElement {
  return (
    <div className="app-shell">
      <ShellHeader />
      <div className="app-shell__body">
        <SidebarNav
          productName="TRP Clinical 1"
          versionLabel="v2.4.0 Stable"
          items={defaultSidebarItems}
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
