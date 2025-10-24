-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'work',
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME NOT NULL,
    "delete" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("content", "createTime", "delete", "id", "isRead", "relatedId", "title", "type", "updateTime", "userId") SELECT "content", "createTime", "delete", "id", "isRead", "relatedId", "title", "type", "updateTime", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_isRead_delete_idx" ON "Notification"("userId", "isRead", "delete");
CREATE INDEX "Notification_userId_createTime_delete_idx" ON "Notification"("userId", "createTime", "delete");
CREATE INDEX "Notification_module_type_delete_idx" ON "Notification"("module", "type", "delete");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
