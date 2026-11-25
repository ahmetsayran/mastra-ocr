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

// The first message or document of a new chat creates the thread
async function createThread(title: string) {
  const response = await api.threads.post({ title: title.slice(0, THREAD_TITLE_LENGTH) });
  if (response.error) {
    throw new Error('Failed to create thread');
  }
  return response.data.uuid;
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

      const targetThreadId = threadId ?? (await createThread(content));
      if (!threadId) {
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
  // 📎 ATTACH DOCUMENT (links an uploaded document to the chat)
  // ====================================================================
  const attachMutation = useMutation({
    mutationFn: async ({ assetUuid, title }: { assetUuid: string; title: string }) => {
      const targetThreadId = threadId ?? (await createThread(title));

      const response = await api.threads({ uuid: targetThreadId }).attachments.post({ assetUuid });
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to add document to chat';
        throw new Error(errorMessage);
      }

      return targetThreadId;
    },
    onSuccess: async (targetThreadId, { title }) => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: threadKeys.detail(targetThreadId) });
      toast.success(`Document added: ${title}. You can ask about it shortly.`);
      if (!threadId) {
        await navigate({ to: '/ai/bot/$uuid', params: { uuid: targetThreadId } });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add document to chat');
    },
  });

  // ====================================================================
  // 📎 ADD DOCUMENT (saved to the file library as an OCR document)
  // ====================================================================
  const addDocument = async (file: File) => {
    let asset: { uuid: string };
    try {
      asset = await createFileLibraryAsset({
        file,
        type: FileLibraryAssetType.OCR_DOCUMENT,
        title: file.name,
      });
    } catch {
      // The error toast comes from the global mutation onError handler
      return;
    }
    attachMutation.mutate({ assetUuid: asset.uuid, title: file.name });
  };

  return {
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    pendingMessage,
    streamedReply,
    addDocument,
    isAddingDocument: isCreating || attachMutation.isPending,
  };
}
