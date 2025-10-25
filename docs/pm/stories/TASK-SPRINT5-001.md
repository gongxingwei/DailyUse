# TASK-SPRINT5-001: Sprint 5 数据库迁移与验证

**Task ID**: TASK-SPRINT5-001  
**Sprint**: Sprint 6  
**Story Points**: 2 SP  
**Priority**: P0 (Must Have)  
**Owner**: Backend Developer  
**Status**: To Do  
**Created**: 2025-10-24  
**Epic**: Sprint 5 收尾工作  
**Blocked By**: Neon Database Connection  

---

## 📋 Task Description

**As a** backend developer  
**I want** to complete Sprint 5 Story 9.3 database migration operations  
**So that** the Schedule conflict detection system is fully integrated with the database

---

## 🎯 Acceptance Criteria

### AC-1: Database Connection Verified

**Given** Neon database was previously unreachable  
**When** database connection is tested  
**Then**  
- Run `node test-db-connection.mjs` successfully
- Database server responds without timeout errors
- All 5 test methods pass (raw SQL, connection check, list tables, check Schedule table, get version)
- Connection string in `.env` is valid

---

### AC-2: Prisma Migration Executed

**Given** database connection is available  
**When** Prisma migration is executed  
**Then**  
- Run `pnpm prisma migrate dev --name add-schedule-model` successfully
- `Schedule` table is created with all columns:
  - uuid (PK), userId, title, description, startTime, endTime, isAllDay, location, attendees, tags, recurrence
- Indexes are created:
  - `(userId, startTime, endTime)`
  - `(userId, tags)`
- Migration history is recorded in `_prisma_migrations` table

**Command**:
```bash
cd apps/api
pnpm prisma migrate dev --name add-schedule-model
```

---

### AC-3: Prisma Client Regenerated

**Given** Prisma migration is complete  
**When** Prisma client generation is executed  
**Then**  
- Run `pnpm prisma generate` successfully
- Prisma client types include `Schedule` model
- No file lock errors (EPERM: operation not permitted)
- TypeScript recognizes `prisma.schedule` operations

**Command**:
```bash
cd apps/api
pnpm prisma generate
```

**Troubleshooting**: If file lock error occurs:
1. Close all VS Code terminals
2. Restart VS Code
3. Run `pnpm prisma generate` again

---

### AC-4: Repository Type Validation

**Given** Prisma client is regenerated  
**When** `PrismaScheduleRepository` is type-checked  
**Then**  
- Run `pnpm typecheck` with 0 errors
- `PrismaScheduleRepository.save()` method types are correct
- `PrismaScheduleRepository.findConflicts()` method types are correct
- No `@ts-ignore` or `any` types in repository code

---

### AC-5: Manual Integration Test

**Given** all previous steps are complete  
**When** basic CRUD operations are manually tested  
**Then**  
- Create a schedule: `await scheduleRepository.save(schedule)` succeeds
- Query schedules: `await scheduleRepository.findByUserId(userId)` returns data
- Conflict detection: `await scheduleRepository.findConflicts(startTime, endTime)` works
- Delete schedule: `await scheduleRepository.delete(uuid)` succeeds

**Optional Test Script** (`test-schedule-crud.mjs`):
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testScheduleCRUD() {
  // 1. Create
  const schedule = await prisma.schedule.create({
    data: {
      uuid: crypto.randomUUID(),
      userId: 'test-user-uuid',
      title: 'Test Meeting',
      startTime: new Date('2025-11-05T10:00:00Z'),
      endTime: new Date('2025-11-05T11:00:00Z'),
      isAllDay: false
    }
  });
  console.log('✅ Created schedule:', schedule.uuid);

  // 2. Query
  const schedules = await prisma.schedule.findMany({
    where: { userId: 'test-user-uuid' }
  });
  console.log('✅ Found schedules:', schedules.length);

  // 3. Delete
  await prisma.schedule.delete({ where: { uuid: schedule.uuid } });
  console.log('✅ Deleted schedule');

  await prisma.$disconnect();
}

testScheduleCRUD().catch(console.error);
```

---

## 📝 Task Checklist

### Pre-Task (User Action Required)

- [ ] Login to Neon Console (https://console.neon.tech/)
- [ ] Resume/activate the paused project
- [ ] Verify database endpoint is reachable
- [ ] Update `.env` if connection string changed

### Task Execution

- [ ] Run `node test-db-connection.mjs` → All 5 tests pass
- [ ] Run `pnpm prisma migrate dev --name add-schedule-model` → Migration successful
- [ ] Run `pnpm prisma generate` → Client generated (handle file lock if needed)
- [ ] Run `pnpm typecheck` → 0 TypeScript errors
- [ ] Run manual CRUD test → All operations succeed
- [ ] Commit migration files: `git add prisma/migrations/`
- [ ] Update Story 9.3 status to "Ready for Review"

---

## 🔧 Technical Notes

### Database Connection String

Ensure `.env` contains:
```env
DATABASE_URL="postgresql://user:password@ep-dry-bar-a18hfly2-pooler.ap-southeast-1.aws.neon.tech:5432/dailyuse?sslmode=require"
```

### Prisma Schema Reference

The `Schedule` model is already defined in `apps/api/prisma/schema.prisma`:
```prisma
model Schedule {
  uuid        String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String
  description String?
  startTime   DateTime @map("start_time")
  endTime     DateTime @map("end_time")
  isAllDay    Boolean  @default(false) @map("is_all_day")
  location    String?
  attendees   String[] @default([])
  tags        String[] @default([])
  recurrence  Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([userId, startTime, endTime])
  @@index([userId, tags])
  @@map("schedules")
}
```

### Expected Migration File

Migration will create:
- Table: `schedules`
- Columns: All fields with proper types
- Indexes: 2 composite indexes
- Constraints: PK on `uuid`

---

## ⚠️ Blockers & Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database still unreachable | Medium (30%) | High | Use local PostgreSQL as fallback |
| File lock on Prisma generate | Low (20%) | Medium | Restart VS Code, close terminals |
| Migration conflicts | Low (10%) | Low | Review migration files before apply |

---

## ✅ Definition of Done

- [ ] All 5 acceptance criteria met
- [ ] Prisma migration applied successfully
- [ ] Prisma client generated with Schedule types
- [ ] TypeScript compilation successful (0 errors)
- [ ] Manual integration test passed
- [ ] Migration files committed to git
- [ ] Story 9.3 status updated to "Ready for Review"
- [ ] Documentation updated (if needed)

---

## 📚 Related Documents

- [Story 9.3: Infrastructure - Database Layer](./9.3.story.md)
- [Sprint 5 Index](./SPRINT-05-INDEX.md)
- [Prisma Generation Guide](../../PRISMA_GENERATION_GUIDE.md)
- [Database Connection Test Script](../../test-db-connection.mjs)

---

## 🎓 Success Metrics

- **Time to Complete**: Target ≤ 0.5 day (4 hours)
- **Database Uptime**: 100% after activation
- **Migration Success Rate**: 100% (1/1)
- **Type Errors**: 0

---

**Created**: 2025-10-24  
**Estimated Time**: 4 hours  
**Actual Time**: TBD  
**Completion Date**: TBD
