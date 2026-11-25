import { api } from '#/lib/api';
import type { ThreadDetailResponse, ThreadShowResponse } from '#backend/modules/threads/types';
import { queryOptions } from '@tanstack/react-query';
import { notFound, rootRouteId } from '@tanstack/react-router';

// ====================================================================
// Query Keys
// ====================================================================
export const threadKeys = {
  all: ['threads'] as const,
  lists: () => [...threadKeys.all, 'list'] as const,
  details: () => [...threadKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...threadKeys.details(), uuid] as const,
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
export const threadDetailQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: threadKeys.detail(uuid),
    queryFn: async () => {
      const response = await api.threads({ uuid }).get();

      // A missing or invalid thread shows the boilerplate not-found page of the root route
      if (response.status === 404 || response.status === 422) {
        throw notFound({ routeId: rootRouteId });
      }

      if (response.error) {
        throw new Error('Failed to fetch thread');
      }

      return response.data as ThreadDetailResponse;
    },
    enabled: !!uuid,
  });
