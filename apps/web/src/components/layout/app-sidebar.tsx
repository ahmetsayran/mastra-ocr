import { ChatbotSidebar } from '#/features/ai-chatbot';
import type { Sidebar } from '#/components/ui/sidebar';
import type { SidebarResizeHandlers } from '#/hooks/use-sidebar-width';

/**
 * AppSidebar - Every page shows the chatbot sidebar (new chat and chat threads)
 */
export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & SidebarResizeHandlers) {
  return <ChatbotSidebar {...props} />;
}
