# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Box is a mobile-first (H5) personal item management system built with Next.js 16, tRPC, Prisma, and SQLite. It features NextAuth JWT authentication, multi-user support with role-based access control (ADMIN/USER), and owner-based data isolation.

## Development Commands

```bash
# Install dependencies
npm install

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with admin user

# Development
npm run dev            # Start dev server on port 3000

# Build and production
npm run build          # Build for production
npm run start          # Start production server

# Linting
npm run lint           # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - SQLite database path
- `NEXTAUTH_SECRET` - Secret for NextAuth JWT
- `NEXTAUTH_URL` - Application URL
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - Admin credentials (seed rejects weak passwords)

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 App Router + React 19 + Tailwind CSS 4
- **API**: tRPC (not REST) - type-safe end-to-end API
- **Database**: Prisma ORM + SQLite (easily swappable to PostgreSQL)
- **Auth**: NextAuth with Credentials Provider + JWT sessions (no refresh tokens)
- **Validation**: Zod schemas

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app layout
│   ├── login/             # Login page
│   └── api/               # API routes (NextAuth, tRPC, upload)
├── components/            # React components organized by feature
├── server/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client singleton
│   └── trpc/
│       ├── context.ts    # tRPC context with session
│       ├── trpc.ts       # tRPC procedures (public, protected, admin)
│       ├── root.ts       # Root router combining all routers
│       └── routers/      # Feature-specific tRPC routers
├── types/                # TypeScript type definitions
└── utils/                # Utility functions and tRPC client setup

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration history
└── seed.ts              # Database seeding script
```

### tRPC Router Organization

All API endpoints are defined in `src/server/trpc/routers/` and combined in `src/server/trpc/root.ts`:
- `auth.ts` - Login, logout, session management
- `users.ts` - User CRUD (admin only)
- `categories.ts` - Category CRUD with images
- `items.ts` - Item CRUD, list, filter, search
- `tags.ts` - Tag CRUD and usage
- `templates.ts` - Template CRUD with JSON schema
- `itemTemplates.ts` - Item template instances
- `dictionaries.ts` - Dictionary management (admin/user)
- `comments.ts` - Comment CRUD with threading
- `search.ts` - Full-text search across items

### Authentication & Authorization

**Roles:**
- `ADMIN` - Full system access, user management, can view all data
- `USER` - Can only access their own data (owner_id isolation)

**Procedures:**
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires valid JWT session
- `adminProcedure` - Requires ADMIN role

**Data Isolation:**
All user-owned models include `ownerId` field. Queries automatically filter by `ownerId = session.user.id` for USER role. ADMIN can access all data but should respect ownership for modifications.

### Soft Delete Pattern

All models use soft delete via `deletedAt` timestamp:
- Delete operations set `deletedAt` to current time
- All queries filter `deletedAt: null` by default
- Deleting categories/tags doesn't cascade delete items (items remain with null categoryId)
- Tags use snapshot pattern - deleting a tag doesn't affect item's `tagNamesSnapshot`
- Templates use snapshot pattern - deleting a template doesn't affect `ItemTemplate` records

## Data Models

### Core Entities

**Item** - Central entity for tracked possessions
- Required: `name`, `ownerId`
- Optional: `categoryId`, `coverImageId`, `inboundAt`, `statusValue`, `acquireMethodValue`, `price`, `isFavorite`, `rating`, `note`
- Relations: `images[]`, `tags[]` (via ItemTag), `templates[]` (via ItemTemplate), `comments[]`
- Snapshot field: `tagNamesSnapshot` (JSON array) - preserves tag names even if tags are deleted

**Category** - Organizes items
- User-scoped (each user has their own categories)
- Fields: `name`, `description`, `coverImageUrl`, `sortOrder`
- Relations: `images[]` (CategoryImage), `items[]`

**Tag** - Labels for items
- User-scoped with snapshot pattern
- Fields: `name`, `color`, `usageCount`
- Junction: `ItemTag` with `tagNameSnapshot` to preserve tag name history

**Template** - Custom field definitions for items
- Scope: `SYSTEM` (admin-created) or `OWNER` (user-created)
- Fields: `templateGroup`, `templateName`, `schema` (JSON with field definitions)
- Schema format: `{ key, label, type, required, options }`
- Types: text, number, select, date, boolean

**ItemTemplate** - Template instances attached to items
- Snapshot fields: `templateGroupSnapshot`, `templateNameSnapshot`, `schemaSnapshot`
- `values` - JSON key-value pairs for template data
- Snapshots ensure template changes don't break existing item data

**Dictionary** - Dropdown options for status, acquire method, etc.
- Scope: `SYSTEM` or `OWNER`
- Structure: `Dictionary` (code, name) → `DictionaryItem[]` (value, label, sortOrder)
- Items reference via `statusValue`, `acquireMethodValue` (stores value, displays label)

**Comment** - Threaded comments on items
- Fields: `itemId`, `parentId`, `replyToCommentId`, `content`, `authorId`
- Supports nested replies via `parentId`

### Image Handling

**ItemImage:**
- Multiple images per item with `sortOrder`
- One image can be set as cover via `Item.coverImageId`
- Fields: `url`, `alt`, `width`, `height`

**CategoryImage:**
- Optional multiple images per category
- Simpler than ItemImage (no cover concept)

**Storage:** Currently stores URLs. Can be extended to S3/OSS/R2 + CDN. Images are owner-scoped for access control.

## Common Patterns

### Creating a New tRPC Router

When adding a new entity (e.g., `DsCompanyDict`):

1. **Define Prisma model** in `prisma/schema.prisma`:
```prisma
model DsCompanyDict {
  id        String   @id @default(cuid())
  ownerId   String
  name      String
  // ... other fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  owner User @relation(fields: [ownerId], references: [id])

  @@index([ownerId, deletedAt])
}
```

2. **Create router** in `src/server/trpc/routers/dsCompanyDict.ts`:
```typescript
import { z } from "zod";
import { createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

const createInput = z.object({
  name: z.string().trim().min(1).max(128),
  // ... other fields
});

const updateInput = createInput.partial();

export const dsCompanyDictRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session!.user!.id;
    return ctx.prisma.dsCompanyDict.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const record = await ctx.prisma.dsCompanyDict.findFirst({
        where: { id: input, ownerId, deletedAt: null },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      return ctx.prisma.dsCompanyDict.create({
        data: { ...input, ownerId },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: idSchema, data: updateInput }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      // Verify ownership
      const existing = await ctx.prisma.dsCompanyDict.findFirst({
        where: { id: input.id, ownerId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.dsCompanyDict.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      // Verify ownership
      const existing = await ctx.prisma.dsCompanyDict.findFirst({
        where: { id: input, ownerId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Soft delete
      return ctx.prisma.dsCompanyDict.update({
        where: { id: input },
        data: { deletedAt: new Date() },
      });
    }),
});
```

3. **Register router** in `src/server/trpc/root.ts`:
```typescript
import { dsCompanyDictRouter } from "@/server/trpc/routers/dsCompanyDict";

export const appRouter = createTRPCRouter({
  // ... existing routers
  dsCompanyDict: dsCompanyDictRouter,
});
```

4. **Run migration**:
```bash
npm run db:migrate
```

### Key Patterns to Follow

**Owner Isolation:**
- Always filter by `ownerId` in protected procedures
- Use `ctx.session!.user!.id` to get current user ID
- Verify ownership before update/delete operations

**Soft Delete:**
- Set `deletedAt: new Date()` instead of actual deletion
- Always filter `deletedAt: null` in queries
- Consider cascade implications (usually don't cascade)

**Prisma findFirst vs findUnique:**
- Use `findFirst` with `where: { id, ownerId, deletedAt: null }` for owner-scoped queries
- `findUnique` only works with unique constraints (doesn't support multiple conditions)
- The project pattern is to use `findFirst` for ownership verification

**Input Validation:**
- Define Zod schemas for all inputs
- Use `.trim()` on strings to prevent whitespace issues
- Set reasonable `.max()` limits on strings and numbers
- Use `.optional().nullable()` for truly optional fields

**Error Handling:**
- Throw `TRPCError` with appropriate codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`
- Let tRPC handle error serialization

## Testing & Development

**Local Development:**
1. Ensure SQLite database exists: `npm run db:migrate`
2. Seed admin user: `npm run db:seed`
3. Start dev server: `npm run dev`
4. Login at `http://localhost:3000/login`

**Database Inspection:**
- Use `npm run db:studio` to open Prisma Studio
- Direct SQLite access: `sqlite3 prisma/dev.db`

**Common Issues:**
- Port 3000 occupied: Kill process with `taskkill //PID <pid> //F` (Windows) or `kill -9 <pid>` (Unix)
- Prisma client out of sync: Run `npm run db:generate`
- Migration conflicts: Check `prisma/migrations/` and resolve manually
