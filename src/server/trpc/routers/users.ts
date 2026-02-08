import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "@/server/trpc/trpc";

export const usersRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().trim().min(3).max(64),
        password: z.string().min(8).max(200),
        role: z.enum(["ADMIN", "USER"]).default("USER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { username: input.username, deletedAt: null },
        select: { id: true },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });

      const passwordHash = await argon2.hash(input.password);

      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          passwordHash,
          role: input.role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user;
    }),

  disable: adminProcedure
    .input(z.object({ userId: z.string().min(1), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session!.user!.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot disable yourself" });
      }
      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
        select: { id: true, isActive: true },
      });
      return user;
    }),

  resetPassword: adminProcedure
    .input(z.object({ userId: z.string().min(1), newPassword: z.string().min(8).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await argon2.hash(input.newPassword);
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { passwordHash },
        select: { id: true },
      });
      return { ok: true };
    }),
});

