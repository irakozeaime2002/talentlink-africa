"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetAds, adminCreateAd, adminUpdateAd, adminDeleteAd } from "../../../lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit, Check, X, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";

interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  linkLabel: string;
  dueDate?: string;
  badge?: string;
  active: boolean;
  createdAt: string;
}

const EMPTY: Omit<Ad, "_id" | "active" | "createdAt"> = {
  title: "", description: "", imageUrl: "", linkUrl: "", linkLabel: "Learn More", dueDate: "", badge: "",
};

export default function AdminAdsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try { setAds(await adminGetAds()); }
    catch { toast.error("Failed to load ads"); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (ad: Ad) => {
    setEditId(ad._id);
    setForm({ title: ad.title, description: ad.description, imageUrl: ad.imageUrl || "", linkUrl: ad.linkUrl, linkLabel: ad.linkLabel, dueDate: ad.dueDate ? ad.dueDate.slice(0, 10) : "", badge: ad.badge || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) { toast.error("Title and description are required"); return; }
    const normalized = {
      ...form,
      linkUrl: form.linkUrl && !/^https?:\/\//i.test(form.linkUrl) ? `https://${form.linkUrl}` : form.linkUrl,
    };
    setSaving(true);
    try {
      if (editId) { await adminUpdateAd(editId, normalized); toast.success("Ad updated"); }
      else { await adminCreateAd({ ...normalized, active: true }); toast.success("Ad created"); }
      setShowForm(false);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (ad: Ad) => {
    try { await adminUpdateAd(ad._id, { active: !ad.active }); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Delete "${ad.title}"?`)) return;
    try { await adminDeleteAd(ad._id); toast.success("Ad deleted"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Advertisements</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ads.length} ads · shown on the public job board</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-glow text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus size={15} /> New Ad
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">{editId ? "Edit Ad" : "Create Ad"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Title *", key: "title", placeholder: "e.g. Hiring Season 2025" },
              { label: "Badge (optional)", key: "badge", placeholder: "e.g. 🔥 Hot, New, Limited" },
              { label: "Link URL (optional)", key: "linkUrl", placeholder: "https://..." },
              { label: "Link Label", key: "linkLabel", placeholder: "Learn More" },
              { label: "Image URL (optional)", key: "imageUrl", placeholder: "https://..." },
              { label: "Due Date (optional)", key: "dueDate", placeholder: "", type: "date" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input type={type || "text"} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Short compelling description..."
              className="w-full border dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 btn-glow text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              <Check size={14} /> {saving ? "Saving…" : "Save Ad"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm border dark:border-white/10 text-gray-500 hover:opacity-80 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Ads list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [...Array(2)].map((_, i) => <div key={i} className="glass-card p-5 h-32 animate-pulse" />) :
          ads.length === 0 ? (
            <div className="col-span-2 glass-card p-12 text-center text-gray-400">
              <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No ads yet. Create one to display on the job board.</p>
            </div>
          ) : ads.map((ad) => (
            <div key={ad._id} className={`glass-card overflow-hidden ${!ad.active ? "opacity-50" : ""}`}>
              <div className="h-0.5 w-full btn-glow" />
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {ad.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full btn-glow text-white">{ad.badge}</span>}
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{ad.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ad.description}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${ad.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-400 dark:bg-white/10"}`}>
                    {ad.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="truncate">{ad.linkUrl}</span>
                  {ad.dueDate && <span>· Due {new Date(ad.dueDate).toLocaleDateString()}</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t dark:border-white/10">
                  <button onClick={() => handleToggle(ad)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border dark:border-white/10 text-gray-500 hover:opacity-80 transition">
                    {ad.active ? <ToggleRight size={13} className="text-emerald-500" /> : <ToggleLeft size={13} />}
                    {ad.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(ad)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border dark:border-white/10 text-gray-500 hover:opacity-80 transition">
                    <Edit size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(ad)} className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
