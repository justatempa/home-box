import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

const tagInput = z.object({
  name: z.string().trim().min(1).max(32),
  color: z.string().trim().max(32).optional(),
});

export const tagsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session!.user!.id;
    return await ctx.prisma.tag.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: [{ usageCount: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        color: true,
        usageCount: true,
      },
    });
  }),

  create: protectedProcedure.input(tagInput).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    try {
      return await ctx.prisma.tag.create({
        data: { ownerId, name: input.name, color: input.color },
        select: { id: true, name: true, color: true, usageCount: true },
      });
    } catch {
      throw new TRPCError({ code: "CONFLICT", message: "Tag already exists" });
    }
  }),

  update: protectedProcedure
    .input(z.object({ id: idSchema }).merge(tagInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const tag = await ctx.prisma.tag.findFirst({ where: { id: input.id, ownerId, deletedAt: null } });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });
      return await ctx.prisma.tag.update({
        where: { id: input.id },
        data: { name: input.name, color: input.color },
        select: { id: true, name: true, color: true, usageCount: true },
      });
    }),

  remove: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    await ctx.prisma.tag.updateMany({ where: { id: input.id, ownerId, deletedAt: null }, data: { deletedAt: new Date() } });
    return { ok: true };
  }),
});
