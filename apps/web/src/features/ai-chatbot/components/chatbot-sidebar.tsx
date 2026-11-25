import { NavUser } from '#/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '#/components/ui/sidebar';
import { IconMessage, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { threadsListQueryOptions } from '../queries/thread-queries';

/**
 * ChatbotSidebar - New chat button and the user's chat threads
 */
export function ChatbotSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();
  const { threadId } = useParams({ strict: false });
  const { data: threads } = useQuery(threadsListQueryOptions());

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={!threadId} tooltip="New chat">
              <Link to="/ai/chatbot" onClick={() => setOpenMobile(false)}>
                <IconPlus />
                <span>New chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarMenu>
            {threads?.map((thread) => (
              <SidebarMenuItem key={thread.uuid}>
                <SidebarMenuButton
                  asChild
                  isActive={thread.uuid === threadId}
                  tooltip={thread.title}
                >
                  <Link
                    to="/ai/chatbot/$threadId"
                    params={{ threadId: thread.uuid }}
                    onClick={() => setOpenMobile(false)}
                  >
                    <IconMessage />
                    <span>{thread.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
