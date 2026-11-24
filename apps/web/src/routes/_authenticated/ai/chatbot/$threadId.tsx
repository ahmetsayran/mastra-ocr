import { ChatbotPage, threadDetailQueryOptions } from '#/features/ai-chatbot';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ai/chatbot/$threadId')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.THREADS.SHOW,
    });
  },
  loader: ({ context, params: { threadId } }) => {
    return context.queryClient.ensureQueryData(threadDetailQueryOptions(threadId));
  },
  component: ChatbotPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading chat...</div>
    </div>
  ),
});
