import { ChatbotSidebar } from '#/features/ai-chatbot';
import type { Sidebar } from '#/components/ui/sidebar';

/**
 * AppSidebar - Every page shows the chatbot sidebar (new chat and chat threads)
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <ChatbotSidebar {...props} />;
}
