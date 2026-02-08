import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";
import { ItemsClient } from "@/components/items/items-client";

export default async function ItemsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <ItemsClient />;
}

