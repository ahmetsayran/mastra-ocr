import { NavUser } from '#/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '#/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import {
  FileDeleteModal,
  FileEditModal,
  FileViewModal,
  fileLibraryAssetDetailQueryOptions,
  useFileLibraryAssets,
} from '#/features/file-library-assets';
import { useConfirmDialog } from '#/hooks/use-confirm-dialog';
import { useDebounce } from '#/hooks/use-debounce';
import type { SidebarResizeHandlers } from '#/hooks/use-sidebar-width';
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { FileLibraryAssetType } from '@onlyjs/db/enums';
import { IconChevronDown, IconFileText, IconMessage, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useThreads } from '../hooks/use-threads';
import { threadsListQueryOptions } from '../queries/thread-queries';
import { ThreadRenameModal } from './thread-rename-modal';

// Records are loaded in pages: chats and documents grow by this many on "Show more"
const RECORDS_PAGE_SIZE = 20;

type AiBotRecord =
  | { kind: 'thread'; uuid: string; title: string; createdAt: Date }
  | {
      kind: 'document';
      uuid: string;
      title: string;
      createdAt: Date;
      asset: FileLibraryAssetShowResponse;
    };

/**
 * AiBotSidebar - New chat button and the records of everything done on the AI Bot page
 *
 * Records:
 * - Chat threads open on /ai/bot/$uuid
 * - OCR documents open in the file library view modal (read, extract, summarize)
 * - Each record has a menu: chats can be renamed or deleted, documents opened, renamed or deleted
 */
export function AiBotSidebar({
  onResizeStart,
  consumeResizeDrag,
  ...props
}: React.ComponentProps<typeof Sidebar> & Partial<SidebarResizeHandlers>) {
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { uuid: threadId } = useParams({ strict: false });
  const [search, setSearch] = useState('');
  const [recordsLimit, setRecordsLimit] = useState(RECORDS_PAGE_SIZE);
  const debouncedSearch = useDebounce(search, 300);
  const { data: threads } = useQuery(
    threadsListQueryOptions({ search: debouncedSearch || undefined, perPage: recordsLimit }),
  );
  const { updateThread, isUpdating: isUpdatingThread, deleteThread } = useThreads();
  const {
    fileLibraryAssets,
    meta: fileLibraryAssetsMeta,
    updateFileLibraryAsset,
    isUpdating: isUpdatingDocument,
    deleteFileLibraryAsset,
    isDeleting: isDeletingDocument,
    readFileLibraryAsset,
    isReading,
    extractFileLibraryAsset,
    isExtracting,
    summarizeFileLibraryAsset,
    isSummarizing,
  } = useFileLibraryAssets({
    type: FileLibraryAssetType.OCR_DOCUMENT,
    title: debouncedSearch || undefined,
    perPage: recordsLimit,
  });
  const [documentUuid, setDocumentUuid] = useState<string | null>(null);
  const [renamingThread, setRenamingThread] = useState<{ uuid: string; title: string } | null>(
    null,
  );
  const [editingDocument, setEditingDocument] = useState<FileLibraryAssetShowResponse | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<FileLibraryAssetShowResponse | null>(
    null,
  );
  const { openDialog: openDeleteThreadDialog, ConfirmDialog: DeleteThreadDialog } =
    useConfirmDialog({
      title: 'Delete chat?',
      description: 'This chat and all of its messages will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'destructive',
    });

  const handleDeleteThread = (uuid: string) => {
    openDeleteThreadDialog(async () => {
      await deleteThread(uuid);
      if (uuid === threadId) {
        await navigate({ to: '/ai/bot' });
      }
    });
  };
  const { data: document } = useQuery(fileLibraryAssetDetailQueryOptions(documentUuid ?? ''));

  const records: AiBotRecord[] = [
    ...(threads?.data ?? []).map((thread) => ({
      kind: 'thread' as const,
      uuid: thread.uuid,
      title: thread.title,
      createdAt: new Date(thread.createdAt),
    })),
    ...(fileLibraryAssets ?? []).map((asset) => ({
      kind: 'document' as const,
      uuid: asset.uuid,
      title: asset.title ?? asset.name,
      createdAt: new Date(asset.createdAt),
      asset,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const hasMoreRecords =
    (threads?.meta.total ?? 0) > recordsLimit || (fileLibraryAssetsMeta?.total ?? 0) > recordsLimit;

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={!threadId}
                tooltip="New chat"
                className="h-9 text-[15px]"
              >
                <Link to="/ai/bot" onClick={() => setOpenMobile(false)}>
                  <IconPlus />
                  <span>New chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarInput
            placeholder="Search records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 text-[15px] group-data-[collapsible=icon]:hidden"
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[13px]">Records</SidebarGroupLabel>
            <SidebarMenu>
              {records.map((record) => (
                <SidebarMenuItem key={record.uuid}>
                  {record.kind === 'thread' ? (
                    <SidebarMenuButton
                      asChild
                      isActive={record.uuid === threadId}
                      tooltip={record.title}
                      className="h-9 text-[15px]"
                    >
                      <Link
                        to="/ai/bot/$uuid"
                        params={{ uuid: record.uuid }}
                        onClick={() => setOpenMobile(false)}
                      >
                        <IconMessage />
                        <span>{record.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      isActive={record.uuid === documentUuid}
                      tooltip={record.title}
                      className="h-9 text-[15px]"
                      onClick={() => {
                        setDocumentUuid(record.uuid);
                        setOpenMobile(false);
                      }}
                    >
                      <IconFileText />
                      <span>{record.title}</span>
                    </SidebarMenuButton>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover className="top-2">
                        <MoreHorizontal />
                        <span className="sr-only">Open menu</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      {record.kind === 'document' && (
                        <DropdownMenuItem onClick={() => setDocumentUuid(record.uuid)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          record.kind === 'thread'
                            ? setRenamingThread({ uuid: record.uuid, title: record.title })
                            : setEditingDocument(record.asset)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          record.kind === 'thread'
                            ? handleDeleteThread(record.uuid)
                            : setDeletingDocument(record.asset)
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              {records.length === 0 && (
                <p className="text-muted-foreground px-2 py-1.5 text-[15px] group-data-[collapsible=icon]:hidden">
                  No records found
                </p>
              )}
              {hasMoreRecords && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-muted-foreground h-9 text-[15px]"
                    onClick={() => setRecordsLimit((limit) => limit + RECORDS_PAGE_SIZE)}
                  >
                    <IconChevronDown />
                    <span>Show more</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail
          onPointerDown={onResizeStart}
          onClick={() => {
            if (!consumeResizeDrag?.()) toggleSidebar();
          }}
          title="Drag to resize, click to toggle"
        />
      </Sidebar>

      {/* Dialogs stay outside the sidebar, which is a closing sheet on mobile */}
      <FileViewModal
        open={!!documentUuid && !!document}
        onOpenChange={(open) => {
          if (!open) setDocumentUuid(null);
        }}
        asset={document ?? null}
        onRead={async (uuid) => {
          await readFileLibraryAsset(uuid);
        }}
        isReading={isReading}
        onExtract={async (uuid) => {
          await extractFileLibraryAsset(uuid);
        }}
        isExtracting={isExtracting}
        onSummarize={async (uuid) => {
          await summarizeFileLibraryAsset(uuid);
        }}
        isSummarizing={isSummarizing}
      />
      <ThreadRenameModal
        open={!!renamingThread}
        onOpenChange={(open) => {
          if (!open) setRenamingThread(null);
        }}
        thread={renamingThread}
        onSave={async (uuid, title) => {
          await updateThread({ uuid, payload: { title } });
        }}
        isSaving={isUpdatingThread}
      />
      <FileEditModal
        open={!!editingDocument}
        onOpenChange={(open) => {
          if (!open) setEditingDocument(null);
        }}
        asset={editingDocument}
        onSave={async (uuid, data) => {
          await updateFileLibraryAsset({ uuid, ...data });
        }}
        isSaving={isUpdatingDocument}
      />
      <FileDeleteModal
        open={!!deletingDocument}
        onOpenChange={(open) => {
          if (!open) setDeletingDocument(null);
        }}
        asset={deletingDocument}
        onConfirm={async (uuid) => {
          await deleteFileLibraryAsset(uuid);
          if (uuid === documentUuid) setDocumentUuid(null);
        }}
        isDeleting={isDeletingDocument}
      />
      <DeleteThreadDialog />
    </>
  );
}
