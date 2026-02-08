import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

export const commentsRouter = createTRPCRouter({
  listByItem: protectedProcedure
    .input(
      z.object({
        itemId: idSchema,
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const rows = await ctx.prisma.comment.findMany({
        where: {
          ownerId,
          itemId: input.itemId,
          parentId: null,
          deletedAt: null,
          ...(input.cursor ? { id: { lt: input.cursor } } : {}),
        },
        take: input.limit + 1,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          content: true,
          authorId: true,
          createdAt: true,
          replies: {
            where: { deletedAt: null },
            orderBy: [{ createdAt: "asc" }],
            take: 3,
            select: {
              id: true,
              content: true,
              authorId: true,
              createdAt: true,
              parentId: true,
              replyToCommentId: true,
            },
          },
        },
      });

      let nextCursor: string | null = null;
      let comments = rows;
      if (rows.length > input.limit) {
        const next = rows.pop()!;
        nextCursor = next.id;
        comments = rows;
      }

      return { comments, nextCursor };
    }),

  create: protectedProcedure
    .input(z.object({ itemId: idSchema, content: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      return await ctx.prisma.comment.create({
        data: {
          ownerId,
          itemId: input.itemId,
          content: input.content,
          authorId: ownerId,
        },
        select: { id: true, content: true, createdAt: true },
      });
    }),

  reply: protectedProcedure
    .input(
      z.object({
        itemId: idSchema,
        parentId: idSchema,
        replyToCommentId: idSchema.optional(),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      const parent = await ctx.prisma.comment.findFirst({
        where: { id: input.parentId, ownerId, itemId: input.itemId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) throw new TRPCError({ code: "NOT_FOUND" });

      return await ctx.prisma.comment.create({
        data: {
          ownerId,
          itemId: input.itemId,
          parentId: input.parentId,
          replyToCommentId: input.replyToCommentId,
          content: input.content,
          authorId: ownerId,
        },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      await ctx.prisma.comment.updateMany({
        where: { id: input.id, ownerId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { ok: true };
    }),
});

