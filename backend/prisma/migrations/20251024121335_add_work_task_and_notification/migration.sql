-- CreateTable
CREATE TABLE "WorkTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待完成',
    "creatorId" TEXT NOT NULL,
    "assignedUserIds" JSONB NOT NULL DEFAULT [],
    "companyId" TEXT,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME NOT NULL,
    "delete" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WorkTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkTaskComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME NOT NULL,
    "delete" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WorkTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkTaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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

-- CreateIndex
CREATE INDEX "WorkTask_creatorId_delete_idx" ON "WorkTask"("creatorId", "delete");

-- CreateIndex
CREATE INDEX "WorkTask_status_delete_idx" ON "WorkTask"("status", "delete");

-- CreateIndex
CREATE INDEX "WorkTaskComment_taskId_delete_idx" ON "WorkTaskComment"("taskId", "delete");

-- CreateIndex
CREATE INDEX "WorkTaskComment_userId_delete_idx" ON "WorkTaskComment"("userId", "delete");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_delete_idx" ON "Notification"("userId", "isRead", "delete");

-- CreateIndex
CREATE INDEX "Notification_userId_createTime_delete_idx" ON "Notification"("userId", "createTime", "delete");
