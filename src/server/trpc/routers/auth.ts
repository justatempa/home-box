import { protectedProcedure, createTRPCRouter } from "@/server/trpc/trpc";

export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.session!.user!.id,
      name: ctx.session!.user!.name ?? null,
      role: ctx.session!.user!.role,
    };
  }),
});
