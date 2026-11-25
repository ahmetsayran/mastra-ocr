import { AiBotSidebar } from '#/features/ai-bot';
import type { Sidebar } from '#/components/ui/sidebar';
import type { SidebarResizeHandlers } from '#/hooks/use-sidebar-width';

/**
 * AppSidebar - Every page shows the AI Bot sidebar (new chat and chat threads)
 */
export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & SidebarResizeHandlers) {
  return <AiBotSidebar {...props} />;
}
