import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { useLanguage } from '#/context/language-context';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThreadRenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: { uuid: string; title: string } | null;
  onSave: (uuid: string, title: string) => Promise<void>;
  isSaving?: boolean;
}

export function ThreadRenameModal({
  open,
  onOpenChange,
  thread,
  onSave,
  isSaving = false,
}: ThreadRenameModalProps) {
  const [title, setTitle] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (thread) {
      setTitle(thread.title);
    }
  }, [thread]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!thread || !title.trim()) return;

    await onSave(thread.uuid, title.trim());
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('thread.renameTitle')}</DialogTitle>
            <DialogDescription>{t('thread.renameDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="thread-title">{t('common.title')}</Label>
            <Input
              id="thread-title"
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('thread.titlePlaceholder')}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!title.trim() || isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.saveChanges')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
