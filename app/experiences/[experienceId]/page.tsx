import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import MemberBounties from "@/components/MemberBounties";

// This page renders inside the Whop iframe for members
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // Verify the user making the request
  const { userId } = await whopsdk.verifyUserToken(await headers());

  // Check their access level
  const access = await whopsdk.users.checkAccess(experienceId, {
    id: userId,
  });

  if (!access.has_access) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-txt-dim text-sm">
            You need a membership to access Bounties.
          </p>
        </div>
      </div>
    );
  }

  // Fetch bounties and user's submissions from our API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  return (
    <MemberBounties
      userId={userId}
      experienceId={experienceId}
      isAdmin={access.access_level === "admin"}
    />
  );
}
