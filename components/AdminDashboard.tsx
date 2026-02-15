"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const [tab, setTab] = useState<"review" | "history" | "manage" | "create">("review");
  const [bounties, setBounties] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [editingStats, setEditingStats] = useState(false);

  // Create bounty form
  const [form, setForm] = useState({
    title: "", description: "", reward: "", difficulty: "easy",
    maxClaims: "", expiry: "", requirements: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes, stRes] = await Promise.all([
          fetch("/api/bounties"),
          fetch("/api/submissions"),
          fetch("/api/stats"),
        ]);
        setBounties(await bRes.json());
        setSubmissions(await sRes.json());
        const statsData = await stRes.json();
        setTotalPaid(statsData.totalPaid || 0);
        setCompletedCount(statsData.completedCount || 0);
      } catch (e) {
        console.error("Load error:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const pendingSubs = submissions.filter((s) => s.status === "pending");
  const historySubs = submissions.filter((s) => s.status !== "pending");
  const activeBounties = bounties.filter((b) => b.status === "active" || b.status === "paused");
  const closedBounties = bounties.filter((b) => b.status !== "active" && b.status !== "paused");

  const stats = {
    pending: pendingSubs.length,
    totalPaid: totalPaid,
    active: activeBounties.length,
    completed: completedCount + historySubs.filter((s) => s.status === "approved").length,
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const getBountyTitle = (bountyId: string) => {
    return bounties.find((b) => b.id === bountyId)?.title || "Unknown Bounty";
  };

  // ─── APPROVE: Triggers Whop Transfer API payout ───
  const handleApprove = async (sub: any) => {
    setProcessing(sub.id);
    try {
      // Step 1: Call our transfer API (which calls Whop Transfers API)
      const transferRes = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: sub.id,
          userId: sub.userId,
          amount: sub.reward,
          bountyTitle: getBountyTitle(sub.bountyId),
        }),
      });

      const transferData = await transferRes.json();

      if (!transferRes.ok) {
        showToast(`Payout failed: ${transferData.details || transferData.error}`);
        setProcessing(null);
        return;
      }

      // Step 2: Update submission status
      await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sub.id,
          status: "approved",
          transferId: transferData.transferId,
        }),
      });

      // Step 3: Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, status: "approved", transferId: transferData.transferId }
            : s
        )
      );

      showToast(`✅ Approved — $${sub.reward} sent to ${sub.userName}'s Whop balance`);
    } catch (e) {
      console.error("Approve error:", e);
      showToast("Something went wrong. Try again.");
    }
    setProcessing(null);
  };

  // ─── DECLINE ───
  const handleDecline = async (sub: any) => {
    setProcessing(sub.id);
    try {
      await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, status: "declined" }),
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: "declined" } : s))
      );

      showToast(`Declined submission from ${sub.userName}`);
    } catch (e) {
      console.error("Decline error:", e);
    }
    setProcessing(null);
  };

  // ─── START EDITING A BOUNTY ───
  const handleStartEdit = (b: any) => {
    setEditingId(b.id);
    setEditForm({
      title: b.title,
      description: b.description,
      reward: String(b.reward),
      difficulty: b.difficulty,
      maxClaims: String(b.maxClaims),
      claimed: String(b.claimed),
      expiry: b.expiry || "",
      requirements: (b.requirements || []).join("\n"),
    });
  };

  // ─── SAVE EDITED BOUNTY ───
  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;
    try {
      const res = await fetch("/api/bounties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: editForm.title,
          description: editForm.description,
          reward: parseFloat(editForm.reward),
          difficulty: editForm.difficulty,
          maxClaims: parseInt(editForm.maxClaims) || 0,
          claimed: parseInt(editForm.claimed) || 0,
          expiry: editForm.expiry || null,
          requirements: editForm.requirements.split("\n").filter(Boolean),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBounties((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
        setEditingId(null);
        setEditForm(null);
        showToast("Bounty updated! ✏️");
      }
    } catch (e) {
      console.error("Edit error:", e);
      showToast("Failed to update bounty");
    }
  };

  // ─── PAUSE / UNPAUSE BOUNTY ───
  const handlePause = async (b: any) => {
    const newStatus = b.status === "paused" ? "active" : "paused";
    try {
      const res = await fetch("/api/bounties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, status: newStatus }),
      });

      if (res.ok) {
        setBounties((prev) =>
          prev.map((x) => (x.id === b.id ? { ...x, status: newStatus } : x))
        );
        showToast(newStatus === "paused" ? "Bounty paused ⏸️" : "Bounty reactivated ▶️");
      }
    } catch (e) {
      console.error("Pause error:", e);
    }
  };

  // ─── CREATE BOUNTY ───
  const handleCreate = async () => {
    if (!form.title || !form.reward) return;

    try {
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          reward: parseFloat(form.reward),
          difficulty: form.difficulty,
          maxClaims: parseInt(form.maxClaims) || 0,
          expiry: form.expiry || null,
          requirements: form.requirements.split("\n").filter(Boolean),
        }),
      });

      if (res.ok) {
        const newBounty = await res.json();
        setBounties((prev) => [...prev, newBounty]);
        setForm({ title: "", description: "", reward: "", difficulty: "easy", maxClaims: "", expiry: "", requirements: "" });
        showToast("Bounty created! 🎯");
      }
    } catch (e) {
      console.error("Create error:", e);
    }
  };

  // ─── DELETE BOUNTY ───
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/bounties?id=${id}`, { method: "DELETE" });
      setBounties((prev) => prev.filter((b) => b.id !== id));
      showToast("Bounty deleted");
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="max-w-[540px] mx-auto px-5 pt-24 text-center text-txt-dim text-sm">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="max-w-[540px] mx-auto px-5 pb-32">
      {/* Header */}
      <div className="pt-5 pb-4 animate-fadeUp">
        <h1 className="font-display text-[clamp(2rem,8vw,3rem)] leading-[0.9] tracking-tight">
          <span className="gold-text">Bounties</span> Admin
        </h1>
        <p className="text-[13px] text-txt-muted mt-2">
          Review submissions, manage bounties, track payouts
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5 animate-fadeUp" style={{ animationDelay: "0.1s" }}>
        {[
          { val: stats.pending, label: "Pending", color: "text-[var(--fire)]", editable: false },
          { val: `$${stats.totalPaid}`, label: "Paid Out", color: "text-green-400", editable: true },
          { val: stats.active, label: "Active", color: "gold-text", editable: false },
          { val: stats.completed, label: "Completed", color: "text-[var(--blue)]", editable: false },
        ].map((s, i) => (
          <div key={i} className={`card p-3 text-center ${s.editable ? "cursor-pointer hover:border-[var(--gold)]/30 transition-all" : ""}`} onClick={() => s.editable && setEditingStats(true)}>
            <div className={`font-heading text-xl font-bold leading-none ${s.color}`}>{s.val}</div>
            <div className="text-[8px] font-semibold tracking-[1px] uppercase text-txt-dim mt-1">{s.label}{s.editable && " ✏️"}</div>
          </div>
        ))}
      </div>

      {/* Edit Total Paid Modal */}
      {editingStats && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setEditingStats(false)}>
          <div className="w-full max-w-[360px] rounded-2xl border border-white/[0.08] bg-[#1a1a1d] p-5">
            <div className="font-heading text-sm tracking-[1.5px] uppercase text-[var(--gold)] mb-4">Edit Total Paid Out</div>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Amount ($)</label>
              <input className="form-input text-lg font-heading font-bold" type="number" value={totalPaid} onChange={(e) => setTotalPaid(parseInt(e.target.value) || 0)} />
            </div>
            <button className="btn-approve w-full" onClick={async () => {
              try {
                await fetch("/api/stats", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ totalPaid }),
                });
                setEditingStats(false);
                showToast("Total paid updated! 💰");
              } catch (e) {
                showToast("Failed to save");
              }
            }}>
              ✅ Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-5 sticky top-3 z-50 backdrop-blur-xl">
        {(["review", "history", "manage", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-[9px] font-heading text-[12px] font-semibold tracking-[1.5px] uppercase text-center relative transition-all ${
              tab === t ? "bg-[var(--gold)] text-[#0a0a0a]" : "text-txt-dim"
            }`}
          >
            {t === "create" ? "+ New" : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "review" && pendingSubs.length > 0 && (
              <span className="absolute top-1 right-2 w-[18px] h-[18px] rounded-full bg-[var(--fire)] text-white text-[9px] font-extrabold flex items-center justify-center font-body">
                {pendingSubs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── REVIEW PANEL ─── */}
      {tab === "review" && (
        pendingSubs.length === 0 ? (
          <div className="text-center py-10 text-txt-dim text-[13px]">No pending submissions 🎉</div>
        ) : (
          pendingSubs.map((sub) => (
            <div key={sub.id} className={`card mb-3.5 animate-fadeUp transition-all ${processing === sub.id ? "opacity-50 pointer-events-none" : ""}`}>
              {/* User header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                <div className="w-9 h-9 rounded-full av-blue flex items-center justify-center font-heading text-[13px] font-bold text-[#0a0a0a] shrink-0">
                  {sub.userInitials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm font-semibold">{sub.userName}</span>
                    {sub.userTier === "premium" && <span className="tier-prem text-[8px] font-bold tracking-[1px] uppercase px-[7px] py-0.5 rounded">💎 Premium</span>}
                    {sub.userTier === "highroller" && <span className="tier-hr text-[8px] font-bold tracking-[1px] uppercase px-[7px] py-0.5 rounded">👑 High Rollers</span>}
                  </div>
                  <div className="text-[11px] text-txt-dim mt-0.5">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-heading text-xl font-bold text-green-400 shrink-0">${sub.reward}</div>
              </div>

              {/* Bounty name */}
              <div className="px-4 py-2.5 text-[12px] font-semibold text-[var(--blue)] tracking-wide border-b border-white/[0.08] bg-[rgba(78,168,246,0.02)]">
                📋 {getBountyTitle(sub.bountyId)}
              </div>

              {/* Proof */}
              {(sub.proofLink || sub.proofNotes) && (
                <div className="px-4 py-3 border-b border-white/[0.08]">
                  {sub.proofLink && (
                    <div className="text-[11px] text-[var(--blue)] break-all mb-1">🔗 {sub.proofLink}</div>
                  )}
                  {sub.proofNotes && (
                    <div className="text-[12px] text-txt-muted italic leading-relaxed">"{sub.proofNotes}"</div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 p-3.5">
                <button className="btn-approve" onClick={() => handleApprove(sub)}>
                  ✅ Approve — Pay ${sub.reward}
                </button>
                <button className="btn-decline" onClick={() => handleDecline(sub)}>
                  ✕ Decline
                </button>
              </div>
            </div>
          ))
        )
      )}

      {/* ─── HISTORY PANEL ─── */}
      {tab === "history" && (
        <>
          <div className="section-label">Recent Decisions</div>
          {historySubs.length === 0 ? (
            <div className="text-center py-10 text-txt-dim text-[13px]">No history yet</div>
          ) : (
            historySubs.map((sub) => (
              <div key={sub.id} className="card mb-2.5">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-[30px] h-[30px] rounded-full av-blue flex items-center justify-center font-heading text-[11px] font-bold text-[#0a0a0a] shrink-0">
                    {sub.userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{sub.userName}</div>
                    <div className="text-[11px] text-txt-dim mt-0.5 truncate">
                      {getBountyTitle(sub.bountyId)} — {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${sub.status} shrink-0 text-[10px]`}>
                    {sub.status === "approved" ? "Approved" : "Declined"}
                  </span>
                  <span className={`font-heading text-sm font-bold ml-2 shrink-0 ${sub.status === "approved" ? "text-green-400" : "text-red-400 line-through"}`}>
                    {sub.status === "approved" ? "+" : ""}${sub.reward}
                  </span>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ─── MANAGE PANEL ─── */}
      {tab === "manage" && (
        <>
          <div className="section-label">Active Bounties</div>
          {activeBounties.map((b) => (
            <div key={b.id} className={`card mb-2.5 ${b.status === "paused" ? "opacity-60" : ""}`}>
              {/* Editing mode */}
              {editingId === b.id ? (
                <div className="p-4">
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Title</label>
                    <input className="form-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Description</label>
                    <textarea className="form-input resize-vertical leading-relaxed" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Reward ($)</label>
                      <input className="form-input" type="number" value={editForm.reward} onChange={(e) => setEditForm({ ...editForm, reward: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Difficulty</label>
                      <select className="form-input appearance-none cursor-pointer" value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Max Claims</label>
                      <input className="form-input" type="number" value={editForm.maxClaims} onChange={(e) => setEditForm({ ...editForm, maxClaims: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Claimed</label>
                      <input className="form-input" type="number" value={editForm.claimed} onChange={(e) => setEditForm({ ...editForm, claimed: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Expiry Date</label>
                      <input className="form-input" type="date" value={editForm.expiry} onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Requirements (one per line)</label>
                    <textarea className="form-input resize-vertical leading-relaxed" rows={4} value={editForm.requirements} onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-approve" onClick={handleSaveEdit}>
                      ✅ Save Changes
                    </button>
                    <button className="btn-decline" onClick={() => { setEditingId(null); setEditForm(null); }}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal display mode */
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="font-heading text-[22px] font-bold text-green-400 min-w-[50px]">${b.reward}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold truncate">{b.title}</span>
                      {b.status === "paused" && <span className="badge badge-pending text-[8px]">⏸️ Paused</span>}
                    </div>
                    <div className="text-[11px] text-txt-dim mt-0.5">
                      {b.claimed}{b.maxClaims > 0 ? `/${b.maxClaims}` : ""} claimed · {b.expiry ? `Ends ${formatDate(b.expiry)}` : b.maxClaims === 0 ? "Unlimited" : `${b.maxClaims - b.claimed} left`}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleStartEdit(b)} className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-txt-muted text-[10px] font-semibold hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all">
                      Edit
                    </button>
                    <button onClick={() => handlePause(b)} className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-txt-muted text-[10px] font-semibold hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all">
                      {b.status === "paused" ? "Resume" : "Pause"}
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="px-3 py-1.5 rounded-md border border-red-400/20 text-red-400 text-[10px] font-semibold hover:bg-red-400/[0.08] transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {closedBounties.length > 0 && (
            <>
              <div className="section-label mt-6">Expired / Closed</div>
              {closedBounties.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3.5 card mb-2.5 opacity-50">
                  <div className="font-heading text-[22px] font-bold text-green-400 min-w-[50px]">${b.reward}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{b.title}</div>
                    <div className="text-[11px] text-txt-dim mt-0.5">
                      {b.claimed}{b.maxClaims > 0 ? `/${b.maxClaims}` : ""} · {b.status === "expired" ? `Ended ${formatDate(b.expiry!)}` : "All claimed"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1.5 rounded-md border border-red-400/20 text-red-400 text-[10px] font-semibold hover:bg-red-400/[0.08] transition-all"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ─── CREATE PANEL ─── */}
      {tab === "create" && (
        <div className="card animate-fadeUp">
          <div className="px-4 py-3.5 border-b border-white/[0.08]">
            <span className="font-heading text-sm tracking-[1.5px] uppercase text-[var(--gold)]">Create New Bounty</span>
          </div>
          <div className="p-4">
            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Bounty Title</label>
              <input className="form-input" placeholder="e.g. Post Your Cashout on Instagram Story" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Description</label>
              <textarea className="form-input resize-vertical leading-relaxed" rows={3} placeholder="Explain what members need to do..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Reward ($)</label>
                <input className="form-input" type="number" placeholder="5" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Difficulty</label>
                <select className="form-input appearance-none cursor-pointer" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div>
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Max Claims</label>
                <input className="form-input" type="number" placeholder="50 (0 = unlimited)" value={form.maxClaims} onChange={(e) => setForm({ ...form, maxClaims: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Expiry Date</label>
                <input className="form-input" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
              </div>
            </div>

            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold tracking-[1px] uppercase text-txt-muted mb-1.5">Requirements (one per line)</label>
              <textarea className="form-input resize-vertical leading-relaxed" rows={4} placeholder={"Like the reel\nLeave a genuine comment\nRepost to your story\nMust have 250+ followers"} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>

            <button className="btn-gold" onClick={handleCreate}>Create Bounty</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-[10px] bg-green-400/15 border border-green-400/30 text-green-400 text-[13px] font-semibold z-[300] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
