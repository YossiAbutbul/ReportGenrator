import type { PropsWithChildren, ReactElement } from 'react';
import { useEffect } from 'react';
import { AppNotification } from '../common/AppNotification';
import { HelpCenterModal } from '../help/HelpCenterModal';
import { ShellHeader } from './ShellHeader';
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

  return (
    <div className="app-shell">
      <ShellHeader
        activePage={activePage}
        onNavigate={onNavigate}
        onOpenHelp={() => setIsHelpOpen(true)}
      />
      <div className="app-shell__body">
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
