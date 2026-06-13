import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PackageCheck, AlertTriangle, X, Check, Package } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { BREW_TYPES } from '@/lib/brewMeta';
import {
  addInventoryLot,
  getInventoryLots,
  deleteInventoryLot,
} from '@/api/db-services';

const emptyForm = {
  materialName: '',
  materialType: 'Coffee',
  lotNumber: '',
  supplier: '',
  receivedDate: '',
  expiryDate: '',
  initialWeightGrams: '',
  lowStockThresholdGrams: '200',
  notes: '',
};

const TYPE_COLORS = {
  Coffee: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 border-amber-200', light: 'bg-amber-50' },
  Tea: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-200', light: 'bg-green-50' },
  Matcha: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', light: 'bg-emerald-50' },
  Juice: { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 border-orange-200', light: 'bg-orange-50' },
  Other: { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200', light: 'bg-slate-50' },
};

function StockBar({ current, initial, threshold, t }) {
  const pct = initial > 0 ? Math.max(0, Math.min(100, (current / initial) * 100)) : 0;
  const isLow = current <= threshold;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>{t('inventory.remaining')}: <strong className={isLow ? 'text-red-600' : 'text-foreground'}>{(current / 1000).toFixed(2)} kg</strong></span>
        <span className="opacity-60">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-brew-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5 font-semibold">
          <AlertTriangle size={11} /> {t('inventory.lowStock')}
        </p>
      )}
    </div>
  );
}

function LotModal({ onClose, onSave, t }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.materialName.trim() || !form.initialWeightGrams) return;
    setSaving(true);
    await onSave(form);
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
          <h2 className="font-playfair text-2xl font-bold">{t('inventory.addLotTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>{t('inventory.materialName')} *</label>
            <input className={inputCls} placeholder={t('inventory.materialNamePlaceholder')} value={form.materialName} onChange={e => set('materialName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('inventory.materialType')}</label>
              <select className={inputCls} value={form.materialType} onChange={e => set('materialType', e.target.value)}>
                {BREW_TYPES.map(tp => <option key={tp} value={tp}>{t(`types.${tp}`)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('inventory.lotNumber')}</label>
              <input className={inputCls} placeholder={t('inventory.lotNumberPlaceholder')} value={form.lotNumber} onChange={e => set('lotNumber', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('inventory.supplier')}</label>
            <input className={inputCls} placeholder={t('inventory.supplierPlaceholder')} value={form.supplier} onChange={e => set('supplier', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('inventory.initialWeight')} *</label>
              <input type="number" className={inputCls} placeholder="5000" value={form.initialWeightGrams} onChange={e => set('initialWeightGrams', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.lowStockThreshold')}</label>
              <input type="number" className={inputCls} placeholder="200" value={form.lowStockThresholdGrams} onChange={e => set('lowStockThresholdGrams', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('inventory.receivedDate')}</label>
              <input type="date" className={inputCls} value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.expiryDate')}</label>
              <input type="date" className={inputCls} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('common.notes')}</label>
            <textarea className={inputCls} rows={2} placeholder={t('inventory.notesPlaceholder')} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl border-2 border-border font-semibold text-muted-foreground hover:bg-muted transition-colors">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.materialName.trim() || !form.initialWeightGrams}
            className="flex-1 py-4 rounded-xl bg-brew-green text-white font-semibold text-lg hover:bg-brew-green/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? `⏳ ${t('common.loading')}` : <><Check size={18} /> {t('inventory.saveButton')}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Inventory() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLots = async () => {
    setLoading(true);
    const data = await getInventoryLots();
    setLots(data);
    // Warn on low stock
    const lowItems = data.filter(l => l.currentStockGrams <= l.lowStockThresholdGrams);
    if (lowItems.length > 0) {
      toast({
        variant: 'destructive',
        title: t('inventory.lowStockWarning').replace('{count}', lowItems.length),
        description: lowItems.map(l => l.materialName).join(', '),
        duration: 8000,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchLots(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (payload) => {
    const result = await addInventoryLot(payload);
    if (result.success) {
      toast({ description: t('status.lotAdded') });
      setModalOpen(false);
      fetchLots();
    } else toast({ variant: 'destructive', description: result.errorMessage });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('inventory.deleteConfirm'))) return;
    const result = await deleteInventoryLot(id);
    if (result.success) {
      toast({ description: t('status.lotRemoved') });
      setLots(prev => prev.filter(l => l.id !== id));
    } else toast({ variant: 'destructive', description: result.errorMessage });
  };

  const filteredLots = filter === 'all' ? lots : lots.filter(l => l.materialType === filter);

  const totalLots = lots.length;
  const lowStockCount = lots.filter(l => l.currentStockGrams <= l.lowStockThresholdGrams).length;
  const totalKg = lots.reduce((a, l) => a + (l.currentStockGrams || 0), 0) / 1000;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold">{t('inventory.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('inventory.subtitle')}</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-brew-green text-white rounded-xl font-semibold shadow-sm hover:bg-brew-green/90 transition-colors"
            >
              <Plus size={20} /> {t('inventory.addLot')}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: t('inventory.totalLots'), value: totalLots, icon: '📦', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t('inventory.totalStock'), value: `${totalKg.toFixed(2)} kg`, icon: '⚖️', color: 'text-green-600', bg: 'bg-green-50' },
              { label: t('inventory.lowStockAlerts'), value: lowStockCount, icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50' },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 border border-border/50`}>
                <p className="text-2xl mb-1">{icon}</p>
                <p className={`font-bold text-xl ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {['all', ...BREW_TYPES].map(tp => (
              <button
                key={tp}
                onClick={() => setFilter(tp)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === tp ? 'bg-brew-green text-white border-brew-green' : 'bg-card border-border hover:bg-muted'}`}
              >
                {tp === 'all' ? t('inventory.allTypes') : t(`types.${tp}`)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="text-center py-24 bg-card border-2 border-dashed border-border rounded-3xl">
              <Package size={56} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-xl font-semibold text-muted-foreground">{t('inventory.noLots')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-6">{t('inventory.noLotsHint')}</p>
              <button onClick={() => setModalOpen(true)} className="px-8 py-3 bg-brew-green text-white rounded-xl font-semibold">
                {t('inventory.addFirstLot')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AnimatePresence>
                {filteredLots.map(lot => {
                  const colors = TYPE_COLORS[lot.materialType] || TYPE_COLORS.Other;
                  const isLow = lot.currentStockGrams <= lot.lowStockThresholdGrams;
                  const isExpired = lot.expiryDate && new Date(lot.expiryDate) < new Date();
                  return (
                    <motion.div
                      key={lot.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`bg-card border rounded-2xl p-5 shadow-sm flex flex-col ${isLow ? 'border-red-300' : 'border-border'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                              {t(`types.${lot.materialType}`) || lot.materialType}
                            </span>
                            {lot.lotNumber && <span className="text-xs text-muted-foreground font-mono">#{lot.lotNumber}</span>}
                            {isExpired && (
                              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                                {t('inventory.expired')}
                              </span>
                            )}
                          </div>
                          <h3 className="font-playfair font-bold text-lg leading-tight">{lot.materialName}</h3>
                          {lot.supplier && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t('inventory.from')} {lot.supplier}</p>
                          )}
                        </div>
                        {isLow && <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-1" />}
                      </div>

                      <StockBar
                        current={lot.currentStockGrams}
                        initial={lot.initialWeightGrams}
                        threshold={lot.lowStockThresholdGrams}
                        t={t}
                      />

                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="bg-muted/40 rounded-xl p-2">
                          <p className="text-[10px] text-muted-foreground">{t('inventory.initial')}</p>
                          <p className="text-sm font-bold">{(lot.initialWeightGrams / 1000).toFixed(2)}kg</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-2">
                          <p className="text-[10px] text-muted-foreground">{t('inventory.used')}</p>
                          <p className="text-sm font-bold">{(lot.totalDeductedGrams / 1000).toFixed(2)}kg</p>
                        </div>
                        <div className={`${isLow ? 'bg-red-50' : 'bg-brew-green/10'} rounded-xl p-2`}>
                          <p className="text-[10px] text-muted-foreground">{t('inventory.remaining')}</p>
                          <p className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-brew-green'}`}>
                            {(lot.currentStockGrams / 1000).toFixed(2)}kg
                          </p>
                        </div>
                      </div>

                      {(lot.receivedDate || lot.expiryDate) && (
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          {lot.receivedDate && <span>{t('inventory.received')} {lot.receivedDate}</span>}
                          {lot.expiryDate && (
                            <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                              {t('inventory.expires')} {lot.expiryDate}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <div className="flex-1 flex items-center gap-1.5">
                          <PackageCheck size={14} className="text-brew-green" />
                          <span className="text-xs text-muted-foreground">{t('inventory.autoDeductNote')}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(lot.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {modalOpen && (
          <LotModal
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
