import type { PropsWithChildren, ReactElement } from 'react';
import { ShellHeader } from './ShellHeader';
import { SidebarNav } from './SidebarNav';
import type { AppPage } from '../../types/navigation';

type AppShellProps = PropsWithChildren<{
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}>;

export function AppShell({
  children,
  activePage,
  onNavigate,
}: AppShellProps): ReactElement {
  return (
    <div className="app-shell">
      <ShellHeader />
      <div className="app-shell__body">
        <SidebarNav
          activeItem={activePage}
          onNavigate={onNavigate}
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
