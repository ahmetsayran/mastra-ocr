import { createFileRoute, redirect } from '@tanstack/react-router';

// The panel opens on the AI Bot page (also after sign-in, which goes to '/')
export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    throw redirect({ to: '/ai/bot' });
  },
});
