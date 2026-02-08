import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";
import { TemplatesClient } from "@/components/templates/templates-client";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <TemplatesClient />;
}

