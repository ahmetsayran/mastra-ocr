-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "asset_id" INTEGER;

-- CreateIndex
CREATE INDEX "chat_messages_asset_id_idx" ON "chat_messages"("asset_id");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_library_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
