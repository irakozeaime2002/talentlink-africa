"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { adminGetUsers, adminDeleteUser, adminUpdateUser, adminResetPassword, adminCreateAdmin } from "../../../lib/api";
import toast from "react-hot-toast";
import { Search, Trash2, Edit, Key, Plus, X, Check, Shield } from "lucide-react";

interface User { _id: string; name: string; email: string; role: string; phone?: string; createdAt: string; }

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  recruiter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  applicant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function AdminUsersPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showCreateAdmin, setShowCreateAdmin] = useState(searchParams.get("createAdmin") === "1");
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, search, roleFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetUsers({ search: search || undefined, role: roleFilter !== "all" ? roleFilter : undefined });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.name}? This will also delete their jobs and applications.`)) return;
    try { await adminDeleteUser(u._id); toast.success("User deleted"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try { await adminUpdateUser(editUser._id, { name: editUser.name, email: editUser.email, role: editUser.role, phone: editUser.phone }); toast.success("User updated"); setEditUser(null); load(); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!resetUser || !newPassword) return;
    setSaving(true);
    try { await adminResetPassword(resetUser._id, newPassword); toast.success("Password reset"); setResetUser(null); setNewPassword(""); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await adminCreateAdmin(adminForm); toast.success("Admin created!"); setShowCreateAdmin(false); setAdminForm({ name: "", email: "", password: "" }); load(); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total users</p>
        </div>
        <button onClick={() => setShowCreateAdmin(true)} className="btn-glow text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={15} /> New Admin
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..."
            className="w-full border dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
        </div>
        {["all", "admin", "recruiter", "applicant"].map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition capitalize ${roleFilter === r ? "border-transparent text-white btn-glow" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-white/10">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse" /></td></tr>
            )) : users.map((u) => (
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
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${ROLE_COLORS[u.role] || ""}`}>
                    {u.role === "admin" && <Shield size={10} className="inline mr-1" />}{u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditUser({ ...u })} className="p-1.5 text-gray-400 hover:text-blue-500 transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit size={14} /></button>
                    <button onClick={() => setResetUser(u)} className="p-1.5 text-gray-400 hover:text-amber-500 transition rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"><Key size={14} /></button>
                    <button onClick={() => handleDelete(u)} className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Edit User</h2>
              <button onClick={() => setEditUser(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            {[{ label: "Name", key: "name" }, { label: "Email", key: "email" }, { label: "Phone", key: "phone" }].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input value={(editUser as any)[key] || ""} onChange={(e) => setEditUser({ ...editUser, [key]: e.target.value })}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition">
                <option value="applicant">Applicant</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={handleUpdate} disabled={saving} className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <button onClick={() => setResetUser(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500">Set new password for <strong>{resetUser.name}</strong></p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
              className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
            <button onClick={handleReset} disabled={saving || newPassword.length < 6} className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {saving ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </div>
      )}

      {/* Create admin modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={16} style={{ color: "var(--accent)" }} /> Create Admin</h2>
              <button onClick={() => setShowCreateAdmin(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              {[{ label: "Full Name", key: "name", type: "text" }, { label: "Email", key: "email", type: "email" }, { label: "Password", key: "password", type: "password" }].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <input type={type} required value={(adminForm as any)[key]} onChange={(e) => setAdminForm({ ...adminForm, [key]: e.target.value })}
                    className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
                </div>
              ))}
              <button type="submit" disabled={saving} className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
                {saving ? "Creating..." : "Create Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
