import { useLanguage } from '#/context/language-context';
import { api } from '#/lib/api';
import type { ThreadUpdatePayload } from '#backend/modules/threads/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { threadKeys } from '../queries/thread-queries';

// ====================================================================
// 💬 THREADS HOOK
// ====================================================================
export function useThreads() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({ uuid, payload }: { uuid: string; payload: ThreadUpdatePayload }) => {
      const response = await api.threads({ uuid }).put(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('thread.renameFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(uuid) });
      toast.success(t('thread.renamed'));
    },
    onError: (error) => {
      console.error('Failed to update chat:', error);
      toast.error(error instanceof Error ? error.message : t('thread.renameFailed'));
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api.threads({ uuid }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('thread.deleteFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      toast.success(t('thread.deleted'));
    },
    onError: (error) => {
      console.error('Failed to delete chat:', error);
      toast.error(error instanceof Error ? error.message : t('thread.deleteFailed'));
    },
  });

  return {
    updateThread: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteThread: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
