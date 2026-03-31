import type { PropsWithChildren, ReactElement } from 'react';
import { ShellHeader } from './ShellHeader';
import { SidebarNav } from './SidebarNav';
import type { AppPage } from '../../types/navigation';

type AppShellProps = PropsWithChildren<{
  activePage: AppPage;
  canOpenReportArea: boolean;
  onNavigate: (page: AppPage) => void;
}>;

export function AppShell({
  children,
  activePage,
  canOpenReportArea,
  onNavigate,
}: AppShellProps): ReactElement {
  return (
    <div className="app-shell">
      <ShellHeader />
      <div className="app-shell__body">
        <SidebarNav
          activeItem={activePage}
          canOpenReportArea={canOpenReportArea}
          onNavigate={onNavigate}
          productName="TRP Clinical 1"
          versionLabel="v2.4.0 Stable"
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
