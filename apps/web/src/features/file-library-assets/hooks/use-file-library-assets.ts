import type { FileLibraryAssetIndexQuery } from '#backend/modules/file-library-assets/types';
import { useQuery } from '@tanstack/react-query';
import { fileLibraryAssetsListQueryOptions } from '../queries/file-library-asset-queries';
import { useFileLibraryAssetMutations } from './use-file-library-asset-mutations';

// ====================================================================
// 📁 FILE LIBRARY ASSETS HOOK
// ====================================================================
export function useFileLibraryAssets(filters?: FileLibraryAssetIndexQuery) {
  // ====================================================================
  // 📋 GET LIST (with pagination)
  // ====================================================================
  const {
    data: fileLibraryAssetsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...fileLibraryAssetsListQueryOptions(filters),
  });

  return {
    // State
    fileLibraryAssets: fileLibraryAssetsResponse?.data,
    meta: fileLibraryAssetsResponse?.meta,
    isLoading,
    error,

    // Query actions
    refetch,

    // Mutations
    ...useFileLibraryAssetMutations(),
  };
}
