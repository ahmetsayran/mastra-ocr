import { ChatbotPage, threadsListQueryOptions } from '#/features/ai-chatbot';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ai/chatbot/')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.THREADS.SHOW,
    });
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(threadsListQueryOptions());
  },
  component: ChatbotPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading chats...</div>
    </div>
  ),
});
