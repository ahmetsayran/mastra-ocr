-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(2048) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_uuid_key" ON "document_chunks"("uuid");

-- CreateIndex
CREATE INDEX "document_chunks_asset_id_idx" ON "document_chunks"("asset_id");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_library_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
