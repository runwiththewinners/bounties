"use client";

import { useState, useEffect } from "react";

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: string;
  maxClaims: number;
  claimed: number;
  expiry: string | null;
  status: string;
  requirements: string[];
  requirementIcons: string[];
  hot: boolean;
}

interface UserSubmission {
  id: string;
  bountyId: string;
  status: string;
  reward: number;
  createdAt: string;
}

export default function MemberBounties({
  userId,
  experienceId,
  isAdmin,
}: {
  userId: string;
  experienceId: string;
  isAdmin: boolean;
}) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<UserSubmission[]>([]);
  const [modal, setModal] = useState<Bounty | null>(null);
  const [proofLink, setProofLink] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  // Leaderboard from database
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, completed: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes, stRes, lbRes] = await Promise.all([
          fetch("/api/bounties"),
          fetch(`/api/submissions?userId=${userId}`),
          fetch("/api/stats"),
          fetch("/api/leaderboard"),
        ]);
        setBounties(await bRes.json());
        setMySubmissions(await sRes.json());
        const statsData = await stRes.json();
        setStats({ totalPaid: statsData.totalPaid || 0, completed: statsData.completedCount || 0 });
        setLeaderboard(await lbRes.json());
      } catch (e) {
        console.error("Load error:", e);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const activeBounties = bounties.filter((b) => b.status === "active");
  const closedBounties = bounties.filter((b) => b.status !== "active");

  const handleSubmit = async () => {
    if (!modal) return;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId: modal.id,
          userId,
          userName: "You", // In production, fetch from Whop user profile
          userInitials: "ME",
          reward: modal.reward,
          proofLink: proofLink || null,
          proofNotes: proofNotes || null,
        }),
      });
      if (res.ok) {
        const sub = await res.json();
        setMySubmissions((prev) => [...prev, sub]);
        setModal(null);
        setProofLink("");
        setProofNotes("");
        showToast("Submitted! We'll review your proof and pay out within 24 hours.");
      }
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const formatDate = (d: string) => {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-[500px] mx-auto px-5 pt-24 text-center text-txt-dim text-sm">
        Loading bounties...
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto px-5 pb-32">
      {/* Hero */}
      <header className="text-center pt-10 pb-5 animate-fadeUp">
        <div className="inline-flex items-center gap-2 px-[18px] py-[7px] rounded-full border border-green-500/20 bg-green-500/5 text-[10.5px] font-bold tracking-[3px] uppercase text-green-400 mb-6">
          <span className="w-[7px] h-[7px] rounded-full bg-green-400 shadow-[0_0_12px_theme(colors.green.400)]" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
          Earn Money
        </div>
        <h1 className="font-display text-[clamp(2.8rem,10vw,4.5rem)] leading-[0.88] tracking-tight">
          <span className="gold-text">Bounties</span>
        </h1>
        <p className="text-sm font-light text-txt-muted mt-3.5 leading-relaxed">
          Complete tasks. Get paid. Help grow the community.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 animate-fadeUp" style={{ animationDelay: "0.15s" }}>
        {[
          { val: `$${stats.totalPaid}`, label: "Total Paid Out", color: "text-green-400" },
          { val: activeBounties.length, label: "Active Bounties", color: "gold-text" },
          { val: stats.completed, label: "Completed", color: "text-green-400" },
        ].map((s, i) => (
          <div key={i} className="card p-3.5 text-center">
            <div className={`font-heading text-[22px] font-bold leading-none ${s.color}`}>{s.val}</div>
            <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-txt-dim mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="card mb-5 animate-fadeUp" style={{ animationDelay: "0.2s" }}>
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
          <span className="font-heading text-[13px] tracking-[1.5px] uppercase text-[var(--gold)]">🏆 Top Earners</span>
          <span className="text-[11px] text-txt-dim">All Time</span>
        </div>
        {leaderboard.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.08] last:border-b-0">
            <span className="w-6 font-heading text-sm font-bold text-center" style={{ color: i === 0 ? "var(--gold)" : i === 1 ? "#c0c0c0" : "#cd7f32" }}>
              {i + 1}
            </span>
            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center font-heading text-[11px] font-bold text-[#0a0a0a] ${i === 0 ? "av-gold" : i === 1 ? "av-green" : "av-blue"}`}>
              {p.initials}
            </div>
            <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
            <span className="font-heading text-[15px] font-bold text-green-400">${p.earned}</span>
          </div>
        ))}
      </div>

      {/* Your Submissions */}
      {mySubmissions.length > 0 && (
        <div className="card mb-5 animate-fadeUp" style={{ animationDelay: "0.25s" }}>
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <span className="font-heading text-[13px] tracking-[1.5px] uppercase text-[var(--gold)]">📋 Your Submissions</span>
          </div>
          {mySubmissions.map((s) => {
            const bounty = bounties.find((b) => b.id === s.bountyId);
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] last:border-b-0">
                <div>
                  <div className="text-[13px] font-semibold">{bounty?.title || "Unknown"}</div>
                  <div className="text-[11px] text-txt-dim mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge badge-${s.status} text-[10px] ml-3 shrink-0`}>
                  {s.status === "approved" ? `✅ Approved +$${s.reward}` : s.status === "pending" ? "⏳ Pending" : "✕ Declined"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Bounties */}
      <div className="section-label">Active Bounties</div>
      {activeBounties.map((b, i) => (
        <div key={b.id} className="card mb-4 animate-fadeUp transition-all hover:border-white/[0.12]" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
          <div className="flex items-start justify-between p-4 pb-0">
            <div className="font-heading text-[28px] font-bold text-green-400 leading-none">${b.reward}</div>
            <div className="flex gap-1.5 items-center">
              <span className={`diff-${b.difficulty} text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded-md`}>
                {b.difficulty}
              </span>
            </div>
          </div>
          <div className="p-4 pt-3">
            <div className="font-heading text-[17px] font-semibold leading-tight mb-1.5">{b.title}</div>
            <div className="text-[13px] text-txt-muted leading-relaxed mb-3">{b.description}</div>

            {b.requirements.length > 0 && (
              <div className="mb-3.5">
                <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-txt-dim mb-2">Requirements</div>
                {b.requirements.map((req, ri) => (
                  <div key={ri} className="flex items-start gap-2 py-[7px] text-[12px] text-txt-muted leading-snug">
                    <span className="shrink-0 mt-px">{b.requirementIcons[ri] || "•"}</span>
                    {req}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 my-3.5 flex-wrap">
              {b.hot && <div className="flex items-center gap-1.5 text-[11px] text-[var(--fire)]">🔥 Popular</div>}
              {b.reward >= 25 && <div className="flex items-center gap-1.5 text-[11px] text-[var(--fire)]">💰 High Reward</div>}
              <div className="flex items-center gap-1.5 text-[11px] text-txt-dim">✅ {b.claimed} completed</div>
              {b.expiry ? (
                <div className="flex items-center gap-1.5 text-[11px] text-txt-dim">⏰ Ends {formatDate(b.expiry)}</div>
              ) : b.maxClaims === 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-txt-dim">♾️ Unlimited</div>
              ) : null}
            </div>

            {b.maxClaims > 0 && (
              <div className="mb-3.5">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((b.claimed / b.maxClaims) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-txt-dim font-semibold tracking-wide">
                  <span>{b.claimed} of {b.maxClaims} claimed</span>
                  <span>{b.maxClaims - b.claimed} spots left</span>
                </div>
              </div>
            )}

            <button className="btn-cta" onClick={() => setModal(b)}>
              Submit Proof — Earn ${b.reward}
            </button>
          </div>
        </div>
      ))}

      {/* Closed Bounties */}
      {closedBounties.length > 0 && (
        <>
          <div className="section-label mt-6">Completed Bounties</div>
          {closedBounties.map((b) => (
            <div key={b.id} className="card mb-4 opacity-50">
              <div className="flex items-start justify-between p-4 pb-0">
                <div className="font-heading text-[28px] font-bold text-green-400 leading-none">${b.reward}</div>
                <span className={`badge badge-${b.status === "expired" ? "expired" : "approved"}`}>
                  {b.status === "expired" ? "⛔ Expired" : "✅ All Claimed"}
                </span>
              </div>
              <div className="p-4 pt-3">
                <div className="font-heading text-[17px] font-semibold leading-tight mb-1.5">{b.title}</div>
                <div className="text-[13px] text-txt-muted leading-relaxed mb-3">{b.description}</div>
                <button className="btn-cta" disabled>
                  {b.status === "expired" ? "Expired" : "All Spots Claimed"}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Submit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="w-full max-w-[460px] rounded-2xl border border-white/[0.08] bg-[#1a1a1d] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <span className="font-heading text-base tracking-[1.5px] uppercase text-[var(--gold)]">📸 Submit Proof</span>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-txt-muted text-base flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-white/[0.03] border border-white/[0.08] mb-4">
                <span className="font-heading text-[15px] font-semibold">{modal.title}</span>
                <span className="font-heading text-xl font-bold text-green-400">${modal.reward}</span>
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Proof Screenshot</label>
                <div className="border border-dashed border-green-400/30 rounded-[10px] p-7 text-center cursor-pointer hover:border-green-400 hover:bg-green-400/[0.06] transition-all bg-green-400/[0.03]">
                  <span className="text-[28px] block mb-2">📸</span>
                  <span className="text-[12px] font-semibold block">Upload Your Proof</span>
                  <span className="text-[11px] text-txt-dim block mt-1">Screenshot of completed task</span>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Link (optional)</label>
                <textarea
                  className="form-input resize-vertical leading-relaxed"
                  rows={2}
                  placeholder="Paste the link to your post, story, or video"
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Notes (optional)</label>
                <textarea
                  className="form-input resize-vertical leading-relaxed"
                  rows={2}
                  placeholder="Anything else we should know?"
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                />
              </div>

              <button className="btn-cta !text-sm !py-3.5 mt-1" onClick={handleSubmit}>
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-[10px] bg-green-400/15 border border-green-400/30 text-green-400 text-[13px] font-semibold z-[300]">
          {toast}
        </div>
      )}
    </div>
  );
}
