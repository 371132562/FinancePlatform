-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "roleId" TEXT,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME NOT NULL,
    "delete" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("code", "createTime", "delete", "department", "email", "id", "name", "password", "phone", "roleId", "updateTime") SELECT "code", "createTime", "delete", "department", "email", "id", "name", "password", "phone", "roleId", "updateTime" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");
CREATE INDEX "User_id_idx" ON "User"("id");
CREATE INDEX "User_code_delete_idx" ON "User"("code", "delete");
CREATE INDEX "User_email_delete_idx" ON "User"("email", "delete");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE UNIQUE INDEX "User_code_delete_key" ON "User"("code", "delete");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
