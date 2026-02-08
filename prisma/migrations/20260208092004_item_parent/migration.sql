-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "parentId" TEXT,
    "coverImageId" TEXT,
    "inboundAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusValue" TEXT,
    "acquireMethodValue" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "tagNamesSnapshot" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "ItemImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("acquireMethodValue", "categoryId", "coverImageId", "createdAt", "deletedAt", "id", "inboundAt", "isFavorite", "name", "note", "ownerId", "price", "rating", "statusValue", "tagNamesSnapshot", "updatedAt") SELECT "acquireMethodValue", "categoryId", "coverImageId", "createdAt", "deletedAt", "id", "inboundAt", "isFavorite", "name", "note", "ownerId", "price", "rating", "statusValue", "tagNamesSnapshot", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_coverImageId_key" ON "Item"("coverImageId");
CREATE INDEX "Item_ownerId_deletedAt_idx" ON "Item"("ownerId", "deletedAt");
CREATE INDEX "Item_ownerId_inboundAt_idx" ON "Item"("ownerId", "inboundAt");
CREATE INDEX "Item_ownerId_categoryId_idx" ON "Item"("ownerId", "categoryId");
CREATE INDEX "Item_ownerId_parentId_deletedAt_idx" ON "Item"("ownerId", "parentId", "deletedAt");
CREATE INDEX "Item_ownerId_statusValue_idx" ON "Item"("ownerId", "statusValue");
CREATE INDEX "Item_ownerId_isFavorite_idx" ON "Item"("ownerId", "isFavorite");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
