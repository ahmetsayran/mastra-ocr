import { AiBotPage } from '#/features/ai-bot';
import { useLanguage } from '#/context/language-context';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ai/bot/')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.THREADS.SHOW,
    });
  },
  component: AiBotPage,
  pendingComponent: () => {
    const { t } = useLanguage();
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">{t('aiBot.loadingChats')}</div>
      </div>
    );
  },
});
