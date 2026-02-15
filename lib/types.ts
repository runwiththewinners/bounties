export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: "easy" | "medium" | "hard";
  maxClaims: number; // 0 = unlimited
  claimed: number;
  expiry: string | null; // ISO date or null
  status: "active" | "expired" | "completed" | "paused";
  requirements: string[];
  requirementIcons: string[];
  hot: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  bountyId: string;
  userId: string; // Whop user_id
  userName: string;
  userInitials: string;
  userTier: "premium" | "highroller" | null;
  proofLink: string | null;
  proofNotes: string | null;
  status: "pending" | "approved" | "declined";
  reward: number;
  createdAt: string;
  reviewedAt: string | null;
  transferId: string | null; // Whop transfer ID after payout
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  initials: string;
  earned: number;
}

export interface BountyStats {
  totalPaid: number;
  activeBounties: number;
  completedSubmissions: number;
  pendingSubmissions: number;
}
