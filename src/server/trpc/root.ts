import { createTRPCRouter } from "@/server/trpc/trpc";
import { authRouter } from "@/server/trpc/routers/auth";
import { categoriesRouter } from "@/server/trpc/routers/categories";
import { commentsRouter } from "@/server/trpc/routers/comments";
import { dictionariesRouter } from "@/server/trpc/routers/dictionaries";
import { itemTemplatesRouter } from "@/server/trpc/routers/itemTemplates";
import { itemsRouter } from "@/server/trpc/routers/items";
import { searchRouter } from "@/server/trpc/routers/search";
import { tagsRouter } from "@/server/trpc/routers/tags";
import { templatesRouter } from "@/server/trpc/routers/templates";
import { usersRouter } from "@/server/trpc/routers/users";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  categories: categoriesRouter,
  items: itemsRouter,
  tags: tagsRouter,
  templates: templatesRouter,
  itemTemplates: itemTemplatesRouter,
  dictionaries: dictionariesRouter,
  comments: commentsRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCaller = appRouter.createCaller;

