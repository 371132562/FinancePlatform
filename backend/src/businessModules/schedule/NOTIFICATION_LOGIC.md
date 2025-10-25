# 员工日程通知逻辑文档

## 概述

本文档详细说明日程管理系统中通知消息的生成逻辑。系统通过 `NotificationService` 模块在特定操作时自动创建通知，确保相关人员能够及时了解日程的变化。

## 通知触发场景

### 1. 日程创建

**触发时机**：用户创建新的日程

**通知逻辑**：
- 为所有执行人员（`assignedUserIds`）创建通知
- 排除创建者自己（即使创建者也在执行人员列表中）
- 排除系统管理员（系统管理员不接收业务通知）

**通知内容**：
```typescript
{
  title: '新的日程任务',
  content: `您有新的日程任务：${schedule.title}`,
  type: 'assigned',
  module: 'work'
}
```

**代码位置**：
```typescript
// schedule.service.ts - createSchedule 方法
if (dto.assignedUserIds.length > 0) {
  await this.notificationService.createScheduleAssignNotification(
    schedule.id,
    userId, // 创建者ID
    dto.assignedUserIds,
    false, // 创建操作
  );
}
```

### 2. 日程状态更新

**触发时机**：用户更新日程状态

**通知逻辑**：
- 为所有执行人员（`assignedUserIds`）创建通知
- 排除更新者自己（即使更新者也在执行人员列表中）
- 排除系统管理员（系统管理员不接收业务通知）
- 如果创建者不在执行人员列表中，且创建者不是更新者，给创建者发送通知（系统管理员除外）

**通知内容**：
```typescript
{
  title: '日程状态更新',
  content: `日程"${schedule.title}"状态已更新`,
  type: 'assigned',
  module: 'work'
}
```

**代码位置**：
```typescript
// schedule.service.ts - updateScheduleStatus 方法
const assignedUserIds = JSON.parse(
  updatedSchedule.assignedUserIds as string,
) as string[];
if (assignedUserIds.length > 0) {
  await this.notificationService.createScheduleAssignNotification(
    dto.id,
    updatedSchedule.creatorId, // 创建者ID
    assignedUserIds,
    true, // 更新操作
    userId, // 更新者ID
  );
}
```

### 3. 状态更新自动回复

**触发时机**：用户更新日程状态时自动生成

**自动回复逻辑**：
- 自动创建一条回复记录
- 回复用户为当前操作的用户
- 回复内容为状态变更说明

**回复内容格式**：
```typescript
`状态已从"${oldStatus}"更新为"${newStatus}"`
```

**代码位置**：
```typescript
// schedule.service.ts - updateScheduleStatus 方法
await this.createStatusUpdateComment(
  dto.id,
  userId,
  schedule.status,
  dto.status,
);
```

### 4. 日程有新回复

**触发时机**：用户为日程添加回复

**通知逻辑**：
- 为所有执行人员（`assignedUserIds`）创建通知
- 排除回复者自己（即使回复者也在执行人员列表中）
- 排除系统管理员（系统管理员不接收业务通知）
- 如果创建者不在执行人员列表中，给创建者发送通知（系统管理员除外）

**通知内容**：
```typescript
{
  title: '日程有新回复',
  content: `日程"${schedule.title}"有新的回复`,
  type: 'assigned',
  module: 'work'
}
```

**代码位置**：
```typescript
// schedule.service.ts - createComment 方法
const assignedUserIds = JSON.parse(
  schedule.assignedUserIds as string,
) as string[];
if (assignedUserIds.length > 0) {
  await this.notificationService.createScheduleAssignNotification(
    dto.scheduleId,
    schedule.creatorId, // 创建者ID
    assignedUserIds,
    false, // 回复操作
    userId, // 回复者ID
  );
}
```

## 通知服务核心方法

### createScheduleAssignNotification

**方法签名**：
```typescript
async createScheduleAssignNotification(
  scheduleId: string,
  creatorId: string,
  assignedUserIds: string[],
  isUpdate: boolean = false,
  updaterId?: string,
): Promise<void>
```

**参数说明**：
- `scheduleId`: 日程ID
- `creatorId`: 创建者ID
- `assignedUserIds`: 执行人员ID列表
- `isUpdate`: 是否为更新操作
- `updaterId`: 更新者ID（仅在更新操作时使用）

**核心逻辑**：

1. **获取日程信息**
   ```typescript
   const schedule = await this.prisma.schedule.findUnique({
     where: { id: scheduleId },
     select: { title: true },
   });
   ```

2. **批量查询用户角色并构建映射**
   ```typescript
   // 准备需要查询的用户ID列表
   const userIdsToQuery = [];
   for (const userId of assignedUserIds) {
     if (userId !== excludeUserId) {
       userIdsToQuery.push(userId);
     }
   }
   
   // 批量查询用户角色
   const users = await this.prisma.user.findMany({
     where: { id: { in: userIdsToQuery } },
     select: { id: true, role: { select: { name: true } } },
   });
   
   // 构建用户角色映射
   const userRoleMap = new Map(users.map((u) => [u.id, u.role?.name]));
   ```

3. **为执行人员创建通知（排除系统管理员）**
   ```typescript
   for (const userId of assignedUserIds) {
     if (userId !== excludeUserId) {
       const userRole = userRoleMap.get(userId);
       
       // 跳过系统管理员
       if (userRole === SystemRoleNames.ADMIN) {
         continue;
       }
       
       notifications.push({
         userId,
         module: 'work',
         type: 'assigned',
         title: isUpdate ? '日程状态更新' : '新的日程任务',
         content: isUpdate
           ? `日程"${schedule.title}"状态已更新`
           : `您有新的日程任务：${schedule.title}`,
         relatedId: scheduleId,
       });
     }
   }
   ```

4. **为创建者创建通知（仅在特定条件下）**
   ```typescript
   const shouldNotifyCreator =
     operationType === 'update' &&
     !assignedUserIds.includes(creatorId) &&
     creatorId !== operatorId;
   
   if (shouldNotifyCreator) {
     const creatorRole = userRoleMap.get(creatorId);
     
     // 跳过系统管理员
     if (creatorRole !== SystemRoleNames.ADMIN) {
       notifications.push({
         userId: creatorId,
         module: 'work',
         type: 'assigned',
         title: '日程更新通知',
         content: `您的日程已更新：${schedule.title}`,
         relatedId: scheduleId,
       });
     }
   }
   ```

## 通知类型区分

### 不同操作的通知标题和内容

| 操作类型 | 通知标题 | 通知内容 | 触发条件 |
|---------|---------|---------|---------|
| 新日程 | 新的日程任务 | 您有新的日程任务：{日程标题} | 创建日程时 |
| 状态更新 | 日程状态更新 | 日程"{日程标题}"状态已更新 | 更新日程状态时 |
| 新回复 | 日程有新回复 | 日程"{日程标题}"有新的回复 | 添加回复时 |
| 创建者通知 | 日程更新通知 | 您的日程已更新：{日程标题} | 创建者不在执行人员列表中时 |

## 通知数据结构

### 通知表结构
```sql
{
  id: string,           // 通知ID
  userId: string,       // 接收用户ID
  module: string,       // 模块标识（'schedule'）
  type: string,         // 通知类型（'assigned'）
  title: string,        // 通知标题
  content: string,      // 通知内容
  relatedId: string,    // 关联日程ID
  isRead: number,       // 是否已读（0:未读, 1:已读）
  createTime: Date,     // 创建时间
  updateTime: Date      // 更新时间
}
```

## 通知触发流程图

### 创建日程
```
用户创建日程
    ↓
创建成功
    ↓
检查是否有执行人员
    ↓
[有] → 创建通知（排除创建者）→ 结束
[无] → 结束
```

### 更新日程状态
```
用户更新状态
    ↓
更新成功
    ↓
自动创建状态回复
    ↓
检查是否有执行人员
    ↓
[有] → 创建通知（排除更新者）→ 结束
[无] → 结束
```

### 添加回复
```
用户添加回复
    ↓
回复成功
    ↓
检查是否有执行人员
    ↓
[有] → 创建通知（排除回复者）→ 结束
[无] → 结束
```

## 注意事项

1. **通知避免自我通知**：创建者/更新者/回复者不会被通知自己创建/更新/回复的日程，包括创建者更新自己创建的日程时也不会收到通知
2. **系统管理员排除**：系统管理员不接收任何日程相关的业务通知，专注于系统管理功能。系统通过批量查询用户角色并构建映射表来高效地排除系统管理员
3. **自动回复静默失败**：状态更新自动回复失败不会影响主流程
4. **通知批量创建**：使用 `createMany` 批量创建通知以提高性能
5. **通知模块标识**：所有日程相关通知的 `module` 字段均为 `'schedule'`
6. **通知类型标识**：所有日程相关通知的 `type` 字段根据操作类型区分（'assigned'、'status_update'、'new_reply'）
7. **通知内容区分**：不同操作的通知标题和内容有明确区分，便于用户理解

## 扩展性说明

系统设计支持未来扩展新的通知场景：

1. **添加新的触发场景**：在 `ScheduleService` 中添加新的业务方法
2. **自定义通知内容**：修改 `NotificationService.createScheduleAssignNotification` 方法
3. **添加新的通知类型**：扩展 `type` 字段的值定义
4. **集成其他模块**：扩展 `module` 字段支持其他业务模块的通知

## 相关文件

- `backend/src/businessModules/schedule/schedule.service.ts` - 日程服务
- `backend/src/commonModules/notification/notification.service.ts` - 通知服务
- `backend/src/businessModules/schedule/schedule.controller.ts` - 日程控制器
- `backend/src/commonModules/notification/notification.controller.ts` - 通知控制器