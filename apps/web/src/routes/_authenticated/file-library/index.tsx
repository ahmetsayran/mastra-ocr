import { FileLibraryAssetsIndexPage, fileLibraryAssetsListQueryOptions } from '#/features/file-library-assets';
import { useLanguage } from '#/context/language-context';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/file-library/')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.FILE_LIBRARY_ASSETS.SHOW,
    });
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(fileLibraryAssetsListQueryOptions({ page: 1, perPage: 20 }));
  },
  component: FileLibraryAssetsIndexPage,
  pendingComponent: () => {
    const { t } = useLanguage();
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">{t('fileLibrary.loading')}</div>
      </div>
    );
  },
});