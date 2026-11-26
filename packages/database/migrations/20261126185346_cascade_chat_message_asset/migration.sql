-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_asset_id_fkey";

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_library_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
