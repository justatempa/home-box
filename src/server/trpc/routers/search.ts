import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

export const searchRouter = createTRPCRouter({
  items: protectedProcedure
    .input(
      z.object({
        q: z.string().trim().min(1).max(100),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      // SQLite: keep it simple (LIKE matching)
      const q = input.q;
      const items = await ctx.prisma.item.findMany({
        where: {
          ownerId,
          deletedAt: null,
          OR: [
            { name: { contains: q } },
            { note: { contains: q } },
            { category: { name: { contains: q } } },
            // snapshot string match (will be stored as JSON)
            // Prisma JSON contains isn't supported on SQLite in a portable way
          ],
        },
        take: input.limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          coverImage: { select: { url: true, width: true, height: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // Tag search: if q matches tag names, also return items by tag join (best-effort)
      const tagHits = await ctx.prisma.tag.findMany({
        where: { ownerId, deletedAt: null, name: { contains: q } },
        select: { id: true },
        take: 10,
      });
      const tagIds = tagHits.map((t) => t.id);
      const taggedItems = tagIds.length
        ? await ctx.prisma.item.findMany({
            where: {
              ownerId,
              deletedAt: null,
              tags: { some: { tagId: { in: tagIds }, deletedAt: null } },
            },
            take: input.limit,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              name: true,
              updatedAt: true,
              coverImage: { select: { url: true, width: true, height: true } },
              category: { select: { id: true, name: true } },
            },
          })
        : [];

      const merged = new Map<string, (typeof items)[number]>();
      for (const it of [...items, ...taggedItems]) merged.set(it.id, it);

      return Array.from(merged.values()).slice(0, input.limit);
    }),
});
