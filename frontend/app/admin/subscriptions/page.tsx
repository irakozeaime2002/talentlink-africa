"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetSubscriptions, adminUpdateUserPlan } from "../../../lib/api";
import toast from "react-hot-toast";
import { Search, Crown, X, Check } from "lucide-react";

interface SubUser {
  _id: string;
  name: string;
  email: string;
  plan: string;
  planExpiresAt?: string;
  createdAt: string;
}

const PLAN_STYLES: Record<string, string> = {
  free:       "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  pro:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function AdminSubscriptionsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [users, setUsers] = useState<SubUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editUser, setEditUser] = useState<SubUser | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, search, planFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetSubscriptions({
        search: search || undefined,
        plan: planFilter !== "all" ? planFilter : undefined,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error("Failed to load subscriptions"); }
    finally { setLoading(false); }
  };

  const openEdit = (u: SubUser) => {
    setEditUser(u);
    setNewPlan(u.plan || "free");
    setNewExpiry(u.planExpiresAt ? u.planExpiresAt.slice(0, 10) : "");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminUpdateUserPlan(editUser._id, newPlan, newExpiry || undefined);
      toast.success(`${editUser.name}'s plan updated to ${newPlan}`);
      setEditUser(null);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // Summary counts
  const counts = { free: 0, pro: 0, enterprise: 0 };
  users.forEach((u) => { if (u.plan in counts) (counts as any)[u.plan]++; });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown size={22} style={{ color: "var(--accent)" }} /> Subscriptions
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} recruiters total</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["free", "pro", "enterprise"] as const).map((p) => (
          <div key={p} className="glass-card p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts[p]}</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize mt-1 inline-block ${PLAN_STYLES[p]}`}>{p}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full border dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
          />
        </div>
        {["all", "free", "pro", "enterprise"].map((p) => (
          <button key={p} onClick={() => setPlanFilter(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition capitalize ${planFilter === p ? "border-transparent text-white btn-glow" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-white/10">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">Recruiter</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {loading ? [...Array(6)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse" /></td></tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No recruiters found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full accent-icon-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${PLAN_STYLES[u.plan || "free"]}`}>
                    {u.plan || "free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString() : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:opacity-80 transition font-semibold text-gray-600 dark:text-gray-300"
                  >
                    Change Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit plan modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Change Plan</h2>
              <button onClick={() => setEditUser(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500">Updating plan for <strong>{editUser.name}</strong></p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {(["free", "pro", "enterprise"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewPlan(p)}
                    className={`py-2 rounded-xl text-sm font-semibold border transition capitalize ${newPlan === p ? "btn-glow text-white border-transparent" : "border-gray-200 dark:border-white/10 text-gray-500"}`}
                  >
                    {newPlan === p && <Check size={12} className="inline mr-1" />}{p}
                  </button>
                ))}
              </div>
            </div>

            {newPlan !== "free" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
