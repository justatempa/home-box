import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";
import { ItemCreateClient } from "@/components/items/item-create-client";

export default async function NewItemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <ItemCreateClient />;
}

