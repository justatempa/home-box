import { cache } from "react";

import { createCaller } from "@/server/trpc/root";
import { createTRPCContext } from "@/server/trpc/context";

/**
 * Server-side tRPC caller
 * This creates a direct caller for tRPC procedures on the server
 */
const createContext = cache(async () => {
  return createTRPCContext();
});

export const api = createCaller(createContext);
