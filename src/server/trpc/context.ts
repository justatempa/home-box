import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";

export async function createTRPCContext() {
  const session = await getServerSession(authOptions);
  return {
    prisma,
    session,
    headers: headers(),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

