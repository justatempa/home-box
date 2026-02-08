import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

import type { TRPCContext } from "@/server/trpc/context";

const trpc = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = trpc.router;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
      userRole: ctx.session.user.role,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session?.user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});

export const idSchema = z.string().min(1);

// Accept either an absolute http(s) URL or an app-relative path (e.g. "/uploads/..."
// returned by our local upload endpoint).
export const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      if (value.startsWith("/")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Invalid image url" },
  );
