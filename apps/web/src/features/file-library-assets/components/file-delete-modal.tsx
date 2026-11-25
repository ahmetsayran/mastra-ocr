import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog';
import { useLanguage } from '#/context/language-context';
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { Trash2 } from 'lucide-react';

interface FileDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FileLibraryAssetShowResponse | null;
  onConfirm: (uuid: string) => Promise<void>;
  isDeleting?: boolean;
}

export function FileDeleteModal({
  open,
  onOpenChange,
  asset,
  onConfirm,
  isDeleting = false,
}: FileDeleteModalProps) {
  const { t } = useLanguage();

  const handleConfirm = async () => {
    if (!asset) return;
    await onConfirm(asset.uuid);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            {t('file.deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('file.deleteDescription', { name: asset?.title || asset?.name || '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                {t('common.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}