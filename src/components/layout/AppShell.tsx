import type { PropsWithChildren, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { AppNotification } from '../common/AppNotification';
import { HelpCenterModal } from '../help/HelpCenterModal';
import { ShellHeader } from './ShellHeader';
import { SidebarNav } from './SidebarNav';
import type { AppPage } from '../../types/navigation';
import { useAppStore } from '../../store/store';

type AppShellProps = PropsWithChildren<{
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}>;

export function AppShell({
  children,
  activePage,
  onNavigate,
}: AppShellProps): ReactElement {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const {
    help: { isHelpOpen, setIsHelpOpen },
    notifications: { clearNotification, notification },
  } = useAppStore();

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearNotification();
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearNotification, notification]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [activePage]);

  return (
    <div className="app-shell">
      <ShellHeader
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((current) => !current)}
      />
      {isMobileNavOpen ? (
        <button
          aria-label="Close navigation menu"
          className="app-shell__mobile-backdrop"
          type="button"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}
      <div className="app-shell__body">
        <SidebarNav
          activeItem={activePage}
          isMobileOpen={isMobileNavOpen}
          onNavigate={onNavigate}
          onOpenHelp={() => setIsHelpOpen(true)}
          onRequestCloseMobile={() => setIsMobileNavOpen(false)}
          footerLabel="Help Center"
        />
        <main className="app-shell__content">{children}</main>
      </div>
      {notification ? (
        <AppNotification
          message={notification.message}
          onClose={clearNotification}
        />
      ) : null}
      <HelpCenterModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
