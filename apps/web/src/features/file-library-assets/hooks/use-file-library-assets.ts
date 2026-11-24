import { api } from '#/lib/api';
import type { FileLibraryAssetIndexQuery } from '#backend/modules/file-library-assets/types';
import { FileLibraryAssetType } from '@onlyjs/db/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fileLibraryAssetKeys, fileLibraryAssetsListQueryOptions } from '../queries/file-library-asset-queries';

// ====================================================================
// Type definitions
// ====================================================================
type CreateFileLibraryAssetInput = {
  file: File;
  type: FileLibraryAssetType;
};

type UpdateFileLibraryAssetInput = {
  uuid: string;
  name?: string;
  title?: string;
};

// ====================================================================
// 📁 FILE LIBRARY ASSETS HOOK
// ====================================================================
export function useFileLibraryAssets(filters?: FileLibraryAssetIndexQuery) {
  const queryClient = useQueryClient();

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

  // ====================================================================
  // ➕ CREATE MUTATION
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (input: CreateFileLibraryAssetInput) => {
      const response = await api['file-library-assets'].post({
        file: input.file,
        type: input.type,
      });

      if (response.error) {
        throw new Error('Failed to create file library asset');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
  });

  // ====================================================================
  // ✏️ UPDATE MUTATION
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateFileLibraryAssetInput) => {
      const { uuid, ...data } = input;
      const response = await api['file-library-assets']({ uuid }).put(data);

      if (response.error) {
        throw new Error('Failed to update file library asset');
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(variables.uuid) });
    },
  });

  // ====================================================================
  // 🗑️ DELETE MUTATION
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).delete();

      if (response.error) {
        throw new Error('Failed to delete file library asset');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
  });

  // ====================================================================
  // 🔍 OCR READ MUTATION
  // ====================================================================
  const ocrReadMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).ocr.post();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to read file library asset';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success('Text read successfully');
    },
    onError: (error) => {
      console.error('Failed to read file library asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to read file library asset');
    },
  });

  // ====================================================================
  // 🧾 OCR EXTRACT MUTATION
  // ====================================================================
  const ocrExtractMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).extract.post();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to extract file library asset data';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success('Data extracted successfully');
    },
    onError: (error) => {
      console.error('Failed to extract file library asset data:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to extract file library asset data',
      );
    },
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
    createFileLibraryAsset: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateFileLibraryAsset: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteFileLibraryAsset: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    readFileLibraryAsset: ocrReadMutation.mutateAsync,
    isReading: ocrReadMutation.isPending,

    extractFileLibraryAsset: ocrExtractMutation.mutateAsync,
    isExtracting: ocrExtractMutation.isPending,
  };
}