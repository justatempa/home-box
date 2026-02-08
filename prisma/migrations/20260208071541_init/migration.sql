-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "CategoryImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
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
    CONSTRAINT "Item_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "ItemImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "ItemImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Tag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tagId" TEXT,
    "tagNameSnapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL DEFAULT 'OWNER',
    "scopeOwner" TEXT NOT NULL,
    "ownerId" TEXT,
    "templateGroup" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Template_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "templateGroupSnapshot" TEXT NOT NULL,
    "templateNameSnapshot" TEXT NOT NULL,
    "schemaSnapshot" JSONB,
    "values" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "ItemTemplate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dictionary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL DEFAULT 'SYSTEM',
    "scopeOwner" TEXT NOT NULL,
    "ownerId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Dictionary_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DictionaryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dictionaryId" TEXT NOT NULL,
    "dictionaryCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "DictionaryItem_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "parentId" TEXT,
    "replyToCommentId" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Comment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Category_ownerId_deletedAt_idx" ON "Category"("ownerId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_ownerId_name_key" ON "Category"("ownerId", "name");

-- CreateIndex
CREATE INDEX "CategoryImage_ownerId_categoryId_deletedAt_idx" ON "CategoryImage"("ownerId", "categoryId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Item_coverImageId_key" ON "Item"("coverImageId");

-- CreateIndex
CREATE INDEX "Item_ownerId_deletedAt_idx" ON "Item"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Item_ownerId_inboundAt_idx" ON "Item"("ownerId", "inboundAt");

-- CreateIndex
CREATE INDEX "Item_ownerId_categoryId_idx" ON "Item"("ownerId", "categoryId");

-- CreateIndex
CREATE INDEX "Item_ownerId_statusValue_idx" ON "Item"("ownerId", "statusValue");

-- CreateIndex
CREATE INDEX "Item_ownerId_isFavorite_idx" ON "Item"("ownerId", "isFavorite");

-- CreateIndex
CREATE INDEX "ItemImage_ownerId_itemId_deletedAt_idx" ON "ItemImage"("ownerId", "itemId", "deletedAt");

-- CreateIndex
CREATE INDEX "Tag_ownerId_deletedAt_idx" ON "Tag"("ownerId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_ownerId_name_key" ON "Tag"("ownerId", "name");

-- CreateIndex
CREATE INDEX "ItemTag_ownerId_itemId_deletedAt_idx" ON "ItemTag"("ownerId", "itemId", "deletedAt");

-- CreateIndex
CREATE INDEX "ItemTag_ownerId_tagId_deletedAt_idx" ON "ItemTag"("ownerId", "tagId", "deletedAt");

-- CreateIndex
CREATE INDEX "Template_scopeOwner_deletedAt_idx" ON "Template"("scopeOwner", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Template_scopeOwner_templateGroup_templateName_key" ON "Template"("scopeOwner", "templateGroup", "templateName");

-- CreateIndex
CREATE INDEX "ItemTemplate_ownerId_itemId_deletedAt_idx" ON "ItemTemplate"("ownerId", "itemId", "deletedAt");

-- CreateIndex
CREATE INDEX "Dictionary_scopeOwner_deletedAt_idx" ON "Dictionary"("scopeOwner", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dictionary_scopeOwner_code_key" ON "Dictionary"("scopeOwner", "code");

-- CreateIndex
CREATE INDEX "DictionaryItem_dictionaryCode_isActive_deletedAt_idx" ON "DictionaryItem"("dictionaryCode", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryItem_dictionaryId_value_key" ON "DictionaryItem"("dictionaryId", "value");

-- CreateIndex
CREATE INDEX "Comment_ownerId_itemId_parentId_deletedAt_idx" ON "Comment"("ownerId", "itemId", "parentId", "deletedAt");
