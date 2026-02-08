import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

export const itemTemplatesRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        itemId: idSchema,
        templateId: idSchema.optional(),
        instanceId: idSchema.optional(),
        templateGroupSnapshot: z.string().trim().min(1).max(64),
        templateNameSnapshot: z.string().trim().min(1).max(64),
        schemaSnapshot: z.any().optional(),
        values: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;

      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      // If templateId is provided, we can fetch current template schema to snapshot
      let schemaSnapshot = input.schemaSnapshot ?? null;
      if (input.templateId) {
        const tpl = await ctx.prisma.template.findFirst({
          where: { id: input.templateId, scopeOwner: ownerId, deletedAt: null },
          select: { templateGroup: true, templateName: true, schema: true },
        });
        if (tpl) {
          schemaSnapshot = tpl.schema;
        }
      }

      if (input.instanceId) {
        const exists = await ctx.prisma.itemTemplate.findFirst({
          where: { id: input.instanceId, ownerId, itemId: input.itemId, deletedAt: null },
          select: { id: true },
        });
        if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

        return await ctx.prisma.itemTemplate.update({
          where: { id: input.instanceId },
          data: {
            templateGroupSnapshot: input.templateGroupSnapshot,
            templateNameSnapshot: input.templateNameSnapshot,
            schemaSnapshot: schemaSnapshot ?? undefined,
            values: input.values,
          },
        });
      }

      return await ctx.prisma.itemTemplate.create({
        data: {
          ownerId,
          itemId: input.itemId,
          templateGroupSnapshot: input.templateGroupSnapshot,
          templateNameSnapshot: input.templateNameSnapshot,
          schemaSnapshot: schemaSnapshot ?? undefined,
          values: input.values,
        },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      await ctx.prisma.itemTemplate.updateMany({
        where: { id: input.id, ownerId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { ok: true };
    }),
});
