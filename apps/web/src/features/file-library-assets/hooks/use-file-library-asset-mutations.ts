import { useLanguage } from '#/context/language-context';
import { api } from '#/lib/api';
import { FileLibraryAssetType } from '@onlyjs/db/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fileLibraryAssetKeys } from '../queries/file-library-asset-queries';

// ====================================================================
// Type definitions
// ====================================================================
type CreateFileLibraryAssetInput = {
  file: File;
  type: FileLibraryAssetType;
  title?: string;
};

type UpdateFileLibraryAssetInput = {
  uuid: string;
  name?: string;
  title?: string;
};

// ====================================================================
// 📁 FILE LIBRARY ASSET MUTATIONS HOOK
// (used alone where the file list is not needed, so no list request is sent)
// ====================================================================
export function useFileLibraryAssetMutations() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // ====================================================================
  // ➕ CREATE MUTATION
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (input: CreateFileLibraryAssetInput) => {
      const response = await api['file-library-assets'].post({
        file: input.file,
        type: input.type,
        title: input.title,
      });

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.uploadFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.uploadFailed'));
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
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.updateFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(variables.uuid) });
    },
    onError: (error) => {
      console.error('Failed to update file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.updateFailed'));
    },
  });

  // ====================================================================
  // 🗑️ DELETE MUTATION
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.deleteFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.deleteFailed'));
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
            : t('file.readFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success(t('file.readSuccess'));
    },
    onError: (error) => {
      console.error('Failed to read file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.readFailed'));
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
            : t('file.extractFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success(t('file.extractSuccess'));
    },
    onError: (error) => {
      console.error('Failed to extract file library asset data:', error);
      toast.error(error instanceof Error ? error.message : t('file.extractFailed'));
    },
  });

  // ====================================================================
  // 📝 OCR SUMMARY MUTATION
  // ====================================================================
  const ocrSummaryMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).summary.post();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.summaryFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success(t('file.summarySuccess'));
    },
    onError: (error) => {
      console.error('Failed to summarize file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.summaryFailed'));
    },
  });

  // ====================================================================
  // 🔎 SEARCH INDEX MUTATION (prepares the document for chat search again)
  // ====================================================================
  const searchIndexMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid })['search-index'].post();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.indexFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success(t('file.indexSuccess'));
    },
    onError: (error) => {
      console.error('Failed to index file library asset:', error);
      toast.error(error instanceof Error ? error.message : t('file.indexFailed'));
    },
  });

  // ====================================================================
  // ✍️ OCR EXTRACTION UPDATE MUTATION
  // ====================================================================
  const ocrExtractionUpdateMutation = useMutation({
    mutationFn: async ({
      uuid,
      extraction,
    }: {
      uuid: string;
      extraction: Record<string, unknown>;
    }) => {
      const response = await api['file-library-assets']({ uuid }).extraction.put({ extraction });

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : t('file.extractionSaveFailed');
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(uuid) });
      toast.success(t('file.extractionSaved'));
    },
    onError: (error) => {
      console.error('Failed to update extracted data:', error);
      toast.error(error instanceof Error ? error.message : t('file.extractionSaveFailed'));
    },
  });

  return {
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

    summarizeFileLibraryAsset: ocrSummaryMutation.mutateAsync,
    isSummarizing: ocrSummaryMutation.isPending,

    indexFileLibraryAsset: searchIndexMutation.mutateAsync,
    isIndexing: searchIndexMutation.isPending,

    updateFileLibraryAssetExtraction: ocrExtractionUpdateMutation.mutateAsync,
    isUpdatingExtraction: ocrExtractionUpdateMutation.isPending,
  };
}
