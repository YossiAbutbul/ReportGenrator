import type { PropsWithChildren, ReactElement } from 'react';
import { useState } from 'react';
import { HelpCenterModal } from '../help/HelpCenterModal';
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="app-shell">
      <ShellHeader />
      <div className="app-shell__body">
        <SidebarNav
          activeItem={activePage}
          onNavigate={onNavigate}
          onOpenHelp={() => setIsHelpOpen(true)}
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
      <HelpCenterModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
