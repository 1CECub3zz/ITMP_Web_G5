import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X, Thermometer, Clock, Droplets, FlaskConical, Target, Check } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/components/ui/use-toast';
import { BREW_TYPES, BREW_METHODS } from '@/lib/brewMeta';
import {
  createMasterProfile,
  getMasterProfiles,
  updateMasterProfile,
  deleteMasterProfile,
} from '@/api/db-services';

const emptyForm = {
  name: '',
  beverageType: 'Coffee',
  method: 'Pour Over',
  targetDoseGrams: '',
  targetWaterTempC: '',
  targetSteepTimeSecs: '',
  targetTdsMin: '',
  targetTdsMax: '',
  targetYieldMl: '',
  notes: '',
};

function secsToMMSS(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mmssToSecs(str) {
  if (!str) return 0;
  if (str.includes(':')) {
    const [m, s] = str.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  return Number(str) || 0;
}

const TYPE_COLORS = {
  Coffee: 'bg-amber-100 text-amber-800 border-amber-200',
  Tea: 'bg-green-100 text-green-800 border-green-200',
  Matcha: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Juice: 'bg-orange-100 text-orange-800 border-orange-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

function ProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState(profile ? {
    ...profile,
    targetSteepTimeSecs: secsToMMSS(profile.targetSteepTimeSecs),
  } : { ...emptyForm });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      targetSteepTimeSecs: mmssToSecs(form.targetSteepTimeSecs),
      targetDoseGrams: Number(form.targetDoseGrams) || 0,
      targetWaterTempC: Number(form.targetWaterTempC) || 0,
      targetTdsMin: Number(form.targetTdsMin) || 0,
      targetTdsMax: Number(form.targetTdsMax) || 0,
      targetYieldMl: Number(form.targetYieldMl) || 0,
    };
    await onSave(payload);
    setSaving(false);
  };

  const inputCls = "w-full bg-muted/40 border border-border rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-brew-green focus:bg-card transition-all";
  const labelCls = "block text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-playfair text-2xl font-bold">{profile ? 'Edit Profile' : 'New Master Profile'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Profile Name *</label>
            <input
              className={inputCls}
              placeholder="e.g. Ethiopia Natural Pour Over"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Beverage Type</label>
              <select className={inputCls} value={form.beverageType} onChange={e => set('beverageType', e.target.value)}>
                {BREW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Brew Method</label>
              <select className={inputCls} value={form.method} onChange={e => set('method', e.target.value)}>
                {BREW_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>🧂 Target Dose (g)</label>
              <input type="number" className={inputCls} placeholder="20" value={form.targetDoseGrams} onChange={e => set('targetDoseGrams', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>🌡️ Water Temp (°C)</label>
              <input type="number" className={inputCls} placeholder="93" value={form.targetWaterTempC} onChange={e => set('targetWaterTempC', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>⏱ Contact Time (MM:SS)</label>
              <input className={inputCls} placeholder="03:30" value={form.targetSteepTimeSecs} onChange={e => set('targetSteepTimeSecs', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>💧 Target Yield (ml)</label>
              <input type="number" className={inputCls} placeholder="300" value={form.targetYieldMl} onChange={e => set('targetYieldMl', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>📊 TDS Min (%)</label>
              <input type="number" step="0.1" className={inputCls} placeholder="1.2" value={form.targetTdsMin} onChange={e => set('targetTdsMin', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>📊 TDS Max (%)</label>
              <input type="number" step="0.1" className={inputCls} placeholder="1.5" value={form.targetTdsMax} onChange={e => set('targetTdsMax', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={3} placeholder="Any process notes, roast info, water chemistry..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl border-2 border-border font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-4 rounded-xl bg-brew-green text-white font-semibold text-lg hover:bg-brew-green/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? '⏳ Saving...' : <><Check size={18} /> Save Profile</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MasterProfiles() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const data = await getMasterProfiles();
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleSave = async (payload) => {
    if (editTarget) {
      const { id, authorUid, createdAt, ...fields } = payload;
      const result = await updateMasterProfile(editTarget.id, fields);
      if (result.success) {
        toast({ description: '✅ Profile updated.' });
        setModalOpen(false);
        setEditTarget(null);
        fetchProfiles();
      } else toast({ variant: 'destructive', description: result.errorMessage });
    } else {
      const result = await createMasterProfile(payload);
      if (result.success) {
        toast({ description: '✅ Profile created.' });
        setModalOpen(false);
        fetchProfiles();
      } else toast({ variant: 'destructive', description: result.errorMessage });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this master profile?')) return;
    const result = await deleteMasterProfile(id);
    if (result.success) {
      toast({ description: '🗑️ Profile deleted.' });
      setProfiles(p => p.filter(x => x.id !== id));
    } else toast({ variant: 'destructive', description: result.errorMessage });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold">Master Profiles</h1>
              <p className="text-muted-foreground mt-1">Target specifications — ideal doses, temps &amp; steep times per recipe.</p>
            </div>
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-brew-green text-white rounded-xl font-semibold shadow-sm hover:bg-brew-green/90 transition-colors"
            >
              <Plus size={20} /> New Profile
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-24 bg-card border-2 border-dashed border-border rounded-3xl">
              <Target size={56} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-xl font-semibold text-muted-foreground">No profiles yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-6">Create a master profile to define your ideal brew targets.</p>
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="px-8 py-3 bg-brew-green text-white rounded-xl font-semibold"
              >
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {profiles.map(profile => (
                  <motion.div
                    key={profile.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-playfair font-bold text-lg leading-tight truncate">{profile.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[profile.beverageType] || TYPE_COLORS.Other}`}>
                            {profile.beverageType}
                          </span>
                          <span className="text-xs text-muted-foreground">{profile.method}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 flex-1">
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Dose</p>
                        <p className="font-bold text-brew-green">{profile.targetDoseGrams || '—'}g</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Thermometer size={10} />Temp</p>
                        <p className="font-bold text-brew-green">{profile.targetWaterTempC || '—'}°C</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Clock size={10} />Time</p>
                        <p className="font-bold text-brew-green">{secsToMMSS(profile.targetSteepTimeSecs)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Droplets size={10} />Yield</p>
                        <p className="font-bold text-brew-green">{profile.targetYieldMl || '—'}ml</p>
                      </div>
                      {(profile.targetTdsMin || profile.targetTdsMax) ? (
                        <div className="col-span-2 bg-muted/50 rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><FlaskConical size={10} />TDS Range</p>
                          <p className="font-bold text-brew-green">{profile.targetTdsMin}% – {profile.targetTdsMax}%</p>
                        </div>
                      ) : null}
                    </div>

                    {profile.notes ? (
                      <p className="text-xs text-muted-foreground mt-3 italic line-clamp-2">"{profile.notes}"</p>
                    ) : null}

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => { setEditTarget(profile); setModalOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/70 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {modalOpen && (
          <ProfileModal
            profile={editTarget}
            onClose={() => { setModalOpen(false); setEditTarget(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
