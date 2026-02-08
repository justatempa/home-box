import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";
import { SearchClient } from "@/components/search/search-client";

export default async function SearchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <SearchClient />;
}

