import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

const dictInput = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(64),
});

const dictItemInput = z.object({
  dictionaryId: idSchema,
  value: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(64),
  sortOrder: z.number().int().min(0).max(1_000_000).default(0),
  isActive: z.boolean().default(true),
});

export const dictionariesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    // v1: only system dictionaries
    const rows = await ctx.prisma.dictionary.findMany({
      where: { scope: "SYSTEM", deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        },
      },
      orderBy: { code: "asc" },
    });

    return rows;
  }),

  upsert: adminProcedure.input(dictInput).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.dictionary.upsert({
      where: {
        scopeOwner_code: {
          scopeOwner: "system",
          code: input.code,
        },
      },
      create: {
        scope: "SYSTEM",
        scopeOwner: "system",
        code: input.code,
        name: input.name,
      },
      update: {
        name: input.name,
      },
    });
  }),

  itemsUpsert: adminProcedure.input(dictItemInput).mutation(async ({ ctx, input }) => {
    const dict = await ctx.prisma.dictionary.findFirst({
      where: { id: input.dictionaryId, scope: "SYSTEM", deletedAt: null },
      select: { id: true, code: true },
    });
    if (!dict) throw new TRPCError({ code: "NOT_FOUND" });

    return await ctx.prisma.dictionaryItem.upsert({
      where: {
        dictionaryId_value: {
          dictionaryId: dict.id,
          value: input.value,
        },
      },
      create: {
        dictionaryId: dict.id,
        dictionaryCode: dict.code,
        value: input.value,
        label: input.label,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      update: {
        label: input.label,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        deletedAt: null,
      },
    });
  }),

  itemsDisable: adminProcedure
    .input(z.object({ id: idSchema, isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.dictionaryItem.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
});

