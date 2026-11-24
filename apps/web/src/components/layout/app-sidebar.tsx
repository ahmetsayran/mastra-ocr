import { CompanySidebar } from '#/components/layout/company-sidebar';
import { SystemAdminSidebar } from '#/components/layout/system-admin-sidebar';
import { ChatbotSidebar } from '#/features/ai-chatbot';
import type { Sidebar } from '#/components/ui/sidebar';
import { useSidebarType } from '#/hooks/use-sidebar-type';
import { useSession } from '#/hooks/use-session';
import { hasSystemScope } from '#/lib/auth';
import { useLocation } from '@tanstack/react-router';

/**
 * AppSidebar - Dynamic sidebar component
 *
 * Displays different sidebars based on:
 * 1. User's scope (SYSTEM vs COMPANY)
 * 2. SessionStorage 'sidebar-type' preference
 *
 * Rules:
 * - Users with SYSTEM scope can switch between both sidebars
 * - Users with COMPANY scope can only see CompanySidebar
 * - System sidebar is only accessible to SYSTEM scope users
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarType } = useSidebarType();
  const { session } = useSession();
  
  const pathname = useLocation({ select: (location) => location.pathname });

  const userHasSystemScope = hasSystemScope(session);

  // Chatbot pages show the chat threads instead of the navigation links
  if (pathname.startsWith('/ai/chatbot')) {
    return <ChatbotSidebar {...props} />;
  }

  // If user doesn't have system scope, always show company sidebar
  if (!userHasSystemScope) {
    return <CompanySidebar {...props} />;
  }

  // System scope users can switch between sidebars
  if (sidebarType === 'company') {
    return <CompanySidebar {...props} />;
  }

  return <SystemAdminSidebar {...props} />;
}
