import { Outlet } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { AppSidebar } from '#/components/layout/app-sidebar';
import { SidebarProvider } from '#/components/ui/sidebar';
import { SearchProvider } from '#/context/search-context';
import { useSidebarWidth } from '#/hooks/use-sidebar-width';
import { cn } from '#/lib/utils';

interface Props {
  children?: React.ReactNode;
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false';
  const { sidebarWidth, isResizing, onResizeStart, consumeResizeDrag } = useSidebarWidth();
  return (
    <SearchProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          sidebarWidth ? ({ '--sidebar-width': sidebarWidth } as React.CSSProperties) : undefined
        }
        className={cn(isResizing && 'cursor-col-resize select-none [&_*]:transition-none')}
      >
        <AppSidebar onResizeStart={onResizeStart} consumeResizeDrag={consumeResizeDrag} />
        <main
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
          )}
        >
          {children ? children : <Outlet />}
        </main>
      </SidebarProvider>
    </SearchProvider>
  );
}
