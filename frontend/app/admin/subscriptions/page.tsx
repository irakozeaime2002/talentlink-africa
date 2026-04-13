"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetSubscriptions, adminUpdateUserPlan } from "../../../lib/api";
import toast from "react-hot-toast";
import { Crown, Search, Edit, Check, X } from "lucide-react";

interface Sub {
  _id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt?: string;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  free:       "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  pro:        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  enterprise: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

export default function AdminSubscriptionsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState("free");
  const [editExpiry, setEditExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetSubscriptions();
      setSubs(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load subscriptions"); }
    finally { setLoading(false); }
  };

  const startEdit = (sub: Sub) => {
    setEditId(sub._id);
    setEditPlan(sub.plan || "free");
    setEditExpiry(sub.planExpiresAt ? sub.planExpiresAt.slice(0, 10) : "");
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await adminUpdateUserPlan(id, editPlan, editExpiry || undefined);
      toast.success("Plan updated and saved to database!");
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = subs.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    free: subs.filter((s) => (s.plan || "free") === "free").length,
    pro: subs.filter((s) => s.plan === "pro").length,
    enterprise: subs.filter((s) => s.plan === "enterprise").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Subscriptions & Plans</h1>
          <p className="text-gray-500 text-sm mt-0.5">{subs.length} users · plans stored in database</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Free", count: stats.free, color: "from-gray-400 to-gray-500" },
          { label: "Pro", count: stats.pro, color: "from-blue-500 to-blue-600" },
          { label: "Enterprise", count: stats.enterprise, color: "from-violet-500 to-violet-600" },
        ].map(({ label, count, color }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-500">{label} plan</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full border dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-white/10">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.map((sub) => (
              <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full accent-icon-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{sub.name}</p>
                      <p className="text-xs text-gray-400">{sub.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 capitalize">{sub.role}</td>
                <td className="px-4 py-3">
                  {editId === sub._id ? (
                    <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}
                      className="border dark:border-white/10 rounded-lg px-2 py-1 text-xs bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none">
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${PLAN_COLORS[sub.plan || "free"]}`}>
                      {sub.plan || "free"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === sub._id ? (
                    <input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)}
                      className="border dark:border-white/10 rounded-lg px-2 py-1 text-xs bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none" />
                  ) : (
                    <span className="text-xs text-gray-400">
                      {sub.planExpiresAt ? new Date(sub.planExpiresAt).toLocaleDateString() : "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editId === sub._id ? (
                      <>
                        <button onClick={() => handleSave(sub._id)} disabled={saving}
                          className="p-1.5 text-white rounded-lg btn-glow disabled:opacity-50">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(sub)}
                        className="p-1.5 text-gray-400 hover:opacity-80 transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                        style={{ color: "var(--accent)" }}>
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
