-- RenameTable
ALTER TABLE "chat_threads" RENAME TO "threads";
ALTER SEQUENCE "chat_threads_id_seq" RENAME TO "threads_id_seq";

-- RenamePrimaryKey
ALTER TABLE "threads" RENAME CONSTRAINT "chat_threads_pkey" TO "threads_pkey";

-- RenameIndex
ALTER INDEX "chat_threads_uuid_key" RENAME TO "threads_uuid_key";
ALTER INDEX "chat_threads_resource_id_idx" RENAME TO "threads_resource_id_idx";
ALTER INDEX "chat_threads_deleted_at_idx" RENAME TO "threads_deleted_at_idx";

-- RenameForeignKey
ALTER TABLE "threads" RENAME CONSTRAINT "chat_threads_resource_id_fkey" TO "threads_resource_id_fkey";
