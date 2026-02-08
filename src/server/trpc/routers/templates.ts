import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, protectedProcedure } from "@/server/trpc/trpc";

const fieldSchema = z.object({
  key: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(64),
  type: z.enum(["text", "number", "select", "date", "boolean"]),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(64)).optional(),
});

const templateSchema = z.object({
  templateGroup: z.string().trim().min(1).max(64),
  templateName: z.string().trim().min(1).max(64),
  schema: z.array(fieldSchema).min(1),
});

export const templatesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session!.user!.id;
    return await ctx.prisma.template.findMany({
      where: { scopeOwner: ownerId, deletedAt: null },
      orderBy: [{ templateGroup: "asc" }, { templateName: "asc" }],
      select: {
        id: true,
        templateGroup: true,
        templateName: true,
        schema: true,
        updatedAt: true,
      },
    });
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    const row = await ctx.prisma.template.findFirst({
      where: { id: input.id, scopeOwner: ownerId, deletedAt: null },
    });
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: protectedProcedure.input(templateSchema).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    return await ctx.prisma.template.create({
      data: {
        scope: "OWNER",
        scopeOwner: ownerId,
        ownerId,
        templateGroup: input.templateGroup,
        templateName: input.templateName,
        schema: input.schema,
      },
    });
  }),

  update: protectedProcedure
    .input(z.object({ id: idSchema }).merge(templateSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const exists = await ctx.prisma.template.findFirst({
        where: { id: input.id, scopeOwner: ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

      return await ctx.prisma.template.update({
        where: { id: input.id },
        data: {
          templateGroup: input.templateGroup,
          templateName: input.templateName,
          schema: input.schema,
        },
      });
    }),

  remove: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    await ctx.prisma.template.updateMany({
      where: { id: input.id, scopeOwner: ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }),
});

