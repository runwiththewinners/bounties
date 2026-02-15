import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import AdminDashboard from "@/components/AdminDashboard";

// This page renders in the Whop dashboard for your team
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Verify the user is an admin
  const { userId } = await whopsdk.verifyUserToken(await headers());

  return <AdminDashboard companyId={companyId} userId={userId} />;
}
