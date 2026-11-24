import { api } from '#/lib/api';
import type { ThreadDetailResponse, ThreadShowResponse } from '#backend/modules/threads/types';
import { queryOptions } from '@tanstack/react-query';

// ====================================================================
// Query Keys
// ====================================================================
export const threadKeys = {
  all: ['threads'] as const,
  lists: () => [...threadKeys.all, 'list'] as const,
  details: () => [...threadKeys.all, 'detail'] as const,
  detail: (threadId: string) => [...threadKeys.details(), threadId] as const,
};

// ====================================================================
// 📋 THREADS LIST QUERY
// ====================================================================
export const threadsListQueryOptions = () =>
  queryOptions({
    queryKey: threadKeys.lists(),
    queryFn: async () => {
      const response = await api.threads.get({ query: {} });

      if (response.error) {
        throw new Error('Failed to fetch threads');
      }

      return response.data?.data as ThreadShowResponse[];
    },
  });

// ====================================================================
// 🔍 THREAD DETAIL QUERY
// ====================================================================
export const threadDetailQueryOptions = (threadId: string) =>
  queryOptions({
    queryKey: threadKeys.detail(threadId),
    queryFn: async () => {
      const response = await api.threads({ threadId }).get();

      if (response.error) {
        throw new Error('Failed to fetch thread');
      }

      return response.data as ThreadDetailResponse;
    },
    enabled: !!threadId,
  });
