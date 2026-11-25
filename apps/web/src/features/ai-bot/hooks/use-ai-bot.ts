import { env } from '#/config/env';
import { useFileLibraryAssets } from '#/features/file-library-assets';
import { api } from '#/lib/api';
import { FileLibraryAssetType } from '@onlyjs/db/enums';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { threadKeys } from '../queries/thread-queries';

const THREAD_TITLE_LENGTH = 50;

// Eden drops SSE/stream chunks that arrive together, so the reply stream is read with fetch
async function streamThreadMessage(
  uuid: string,
  content: string,
  onChunk: (chunk: string) => void,
) {
  const response = await fetch(`${env.apiUrl}/threads/${uuid}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Failed to send message');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// ====================================================================
// 💬 CHATBOT HOOK
// ====================================================================
export function useAiBot(threadId?: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [streamedReply, setStreamedReply] = useState('');
  const { createFileLibraryAsset, isCreating } = useFileLibraryAssets();

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      setPendingMessage(content);
      setStreamedReply('');

      // First message of a new chat creates the thread
      let targetThreadId = threadId;
      if (!targetThreadId) {
        const response = await api.threads.post({ title: content.slice(0, THREAD_TITLE_LENGTH) });
        if (response.error) {
          throw new Error('Failed to create thread');
        }
        targetThreadId = response.data.uuid;
        queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      }

      try {
        await streamThreadMessage(targetThreadId, content, (chunk) =>
          setStreamedReply((reply) => reply + chunk),
        );
      } finally {
        await queryClient.invalidateQueries({ queryKey: threadKeys.detail(targetThreadId) });
        if (!threadId) {
          await navigate({ to: '/ai/bot/$uuid', params: { uuid: targetThreadId } });
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
    onSettled: () => {
      setPendingMessage(null);
      setStreamedReply('');
    },
  });

  // ====================================================================
  // 📎 ADD DOCUMENT (saved to the file library as an OCR document)
  // ====================================================================
  const addDocument = async (file: File) => {
    try {
      await createFileLibraryAsset({
        file,
        type: FileLibraryAssetType.OCR_DOCUMENT,
        title: file.name,
      });
      toast.success(`Document added: ${file.name}. You can ask about it shortly.`);
    } catch {
      // The error toast comes from the global mutation onError handler
    }
  };

  return {
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    pendingMessage,
    streamedReply,
    addDocument,
    isAddingDocument: isCreating,
  };
}
