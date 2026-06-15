import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, ChevronRight, ChevronLeft, Coffee, ArrowLeft,
  Thermometer, Timer, Droplets, FlaskConical, Target, Play, Square,
  Package, BookOpen, Beaker
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import RippleButton from '@/components/ui/RippleButton';
import { useToast } from '@/components/ui/use-toast';
import { BREW_METHODS, BREW_TYPES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';
import { uploadBrewImage, submitBrewLog, getMasterProfiles, getInventoryLots } from '@/api/db-services';

// ---------- helpers ----------
function secsToMMSS(s) {
  if (!s && s !== 0) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function calcDilutionWater(yieldMl, targetTdsMax, tds) {
  if (!yieldMl || !targetTdsMax || !tds || tds <= targetTdsMax) return null;
  const totalVol = (tds * yieldMl) / targetTdsMax;
  return Math.max(0, totalVol - yieldMl);
}

// ---------- big input classnames ----------
const BIG_INPUT = "w-full bg-card border border-border rounded-2xl px-5 py-5 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-brew-green transition-all placeholder:text-muted-foreground/50";
const BIG_SELECT = "w-full bg-card border border-border rounded-2xl px-5 py-5 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-brew-green transition-all appearance-none cursor-pointer";
const LABEL = "block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider";

export default function AddBrew() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const STEPS = [
    { num: 1, label: t('addBrew.stepIdentity') },
    { num: 2, label: t('addBrew.stepIngredients') },
    { num: 3, label: t('addBrew.stepExtraction') },
    { num: 4, label: t('addBrew.stepQuality') },
  ];

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Master profiles & inventory lots
  const [profiles, setProfiles] = useState([]);
  const [lots, setLots] = useState([]);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef(null);

  // Form
  const [form, setForm] = useState({
    // Step 1
    name: '', type: 'Coffee', method: 'Pour Over', image_url: null,
    masterProfileId: '', masterProfileName: '',
    // Step 2
    lotId: '', lotName: '',
    actualWeightGrams: '', pax: 1,
    waterVolumeLiters: '',
    // Step 3
    waterTemp: '',
    contactTimeSecs: 0, contactTimeDisplay: '',
    tds: '',
    yieldVolumeMl: '',
    // Step 4
    tastePassed: null, sensoryNotes: '',
    rating: 0, flavor: 0, ease: 0, notes: '',
  });

  const selectedProfile = profiles.find(p => p.id === form.masterProfileId) || null;

  // Fetch reference data
  useEffect(() => {
    getMasterProfiles().then(setProfiles);
    getInventoryLots().then(data => setLots(data.filter(l => l.currentStockGrams > 0)));
  }, []);

  // Filter lots by beverage type
  const filteredLots = lots.filter(l => l.materialType === form.type || l.materialType === 'Other');

  const updateForm = useCallback((key, value) => setForm(prev => ({ ...prev, [key]: value })), []);

  // Auto-fill when master profile selected
  const handleProfileSelect = (profileId) => {
    const p = profiles.find(x => x.id === profileId);
    if (p) {
      updateForm('masterProfileId', profileId);
      updateForm('masterProfileName', p.name);
      if (p.targetDoseGrams) updateForm('actualWeightGrams', String(p.targetDoseGrams));
      if (p.targetWaterTempC) updateForm('waterTemp', String(p.targetWaterTempC));
      if (p.targetSteepTimeSecs) {
        updateForm('contactTimeSecs', p.targetSteepTimeSecs);
        updateForm('contactTimeDisplay', secsToMMSS(p.targetSteepTimeSecs));
      }
      if (p.targetYieldMl) updateForm('yieldVolumeMl', String(p.targetYieldMl));
      if (p.method) updateForm('method', p.method);
      if (p.beverageType) updateForm('type', p.beverageType);
    } else {
      updateForm('masterProfileId', '');
      updateForm('masterProfileName', '');
    }
  };

  // Timer controls
  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000);
  };

  const stopTimer = () => {
    if (!timerRunning) return;
    clearInterval(timerRef.current);
    setTimerRunning(false);
    updateForm('contactTimeSecs', timerSecs);
    updateForm('contactTimeDisplay', secsToMMSS(timerSecs));
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSecs(0);
    updateForm('contactTimeSecs', 0);
    updateForm('contactTimeDisplay', '');
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Dilution calculator
  const dilutionWaterMl = calcDilutionWater(
    Number(form.yieldVolumeMl),
    selectedProfile?.targetTdsMax,
    Number(form.tds)
  );

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      toast({ description: '☁️ Uploading image...' });
      const result = await uploadBrewImage(file);
      if (result.success) {
        updateForm('image_url', result.url);
        toast({ description: t('status.photoUploaded') });
      } else throw new Error(result.errorMessage);
    } catch (error) {
      toast({ variant: 'destructive', description: `${t('addBrew.uploadFailed')}: ${error.message}` });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!form.name || form.rating === 0) {
      return toast({ variant: 'destructive', description: t('addBrew.nameAndRatingRequired') });
    }
    try {
      setSaving(true);
      const result = await submitBrewLog({
        beanName: form.name,
        roaster: form.type,
        method: form.method,
        dose_grams: (Number(form.actualWeightGrams) || 0) * form.pax,
        pax: form.pax,
        time: form.contactTimeDisplay || null,
        rating: form.rating,
        comment: form.notes,
        imageUrl: form.image_url,
        flavor: form.flavor,
        ease: form.ease,
        waterTemp: Number(form.waterTemp) || null,
        waterVolumeLiters: Number(form.waterVolumeLiters) || null,
        contactTimeSecs: form.contactTimeSecs || null,
        tds: Number(form.tds) || null,
        yieldVolumeMl: Number(form.yieldVolumeMl) || null,
        lotId: form.lotId || null,
        lotName: form.lotName || null,
        actualWeightGrams: Number(form.actualWeightGrams) || null,
        masterProfileId: form.masterProfileId || null,
        masterProfileName: form.masterProfileName || null,
        tastePassed: form.tastePassed,
        sensoryNotes: form.sensoryNotes,
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/records'), 2000);
      } else throw new Error(result.errorMessage);
    } catch (error) {
      toast({ variant: 'destructive', description: `${t('addBrew.saveFailed')}: ${error.message}` });
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !form.name.trim()) {
      return toast({ variant: 'destructive', description: t('addBrew.brewNameRequired') });
    }
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  // -------- Step renders --------
  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {profiles.length > 0 && (
        <div className="bg-gradient-to-r from-brew-green/10 to-brew-green/5 border border-brew-green/20 rounded-2xl p-4">
          <label className={LABEL}><BookOpen size={12} className="inline mr-1" />{t('addBrew.loadProfile')}</label>
          <select
            className={BIG_SELECT}
            value={form.masterProfileId}
            onChange={e => handleProfileSelect(e.target.value)}
          >
            <option value="">{t('addBrew.noProfile')}</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({t(`types.${p.beverageType}`) || p.beverageType} · {t(`methods.${p.method}`) || p.method})
              </option>
            ))}
          </select>
          {selectedProfile && (
            <p className="text-xs text-brew-green font-semibold mt-2 flex items-center gap-1">
              <Check size={11} /> {t('addBrew.profilePrefilled').replace('{name}', selectedProfile.name)}
            </p>
          )}
        </div>
      )}
      <div>
        <label className={LABEL}>{t('addBrew.brewName')} *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => updateForm('name', e.target.value)}
          placeholder={t('addBrew.brewNamePlaceholder')}
          className={BIG_INPUT}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>{t('addBrew.beverageType')}</label>
          <select className={BIG_SELECT} value={form.type} onChange={e => updateForm('type', e.target.value)}>
            {BREW_TYPES.map(tp => <option key={tp} value={tp}>{t(`types.${tp}`)}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>{t('addBrew.brewingMethod')}</label>
          <select className={BIG_SELECT} value={form.method} onChange={e => updateForm('method', e.target.value)}>
            {BREW_METHODS.map(m => <option key={m} value={m}>{t(`methods.${m}`)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>{t('addBrew.addPhoto')}</label>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <div
          onClick={() => !uploadingImage && fileInputRef.current?.click()}
          className={`w-full aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${form.image_url ? 'border-brew-green' : 'border-border hover:border-brew-green/50'}`}
        >
          {form.image_url
            ? <img src={form.image_url} className="w-full h-full object-cover rounded-xl" alt="Batch" />
            : uploadingImage
            ? <span className="text-muted-foreground">⏳ {t('common.uploading')}</span>
            : <span className="text-muted-foreground flex items-center gap-2"><Camera size={20} /> {t('common.uploadPhoto')}</span>}
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div>
        <label className={LABEL}><Package size={12} className="inline mr-1" />{t('addBrew.rawMaterialLot')}</label>
        {filteredLots.length > 0 ? (
          <select
            className={BIG_SELECT}
            value={form.lotId}
            onChange={e => {
              const lot = filteredLots.find(l => l.id === e.target.value);
              updateForm('lotId', e.target.value);
              updateForm('lotName', lot?.materialName || '');
            }}
          >
            <option value="">—</option>
            {filteredLots.map(l => (
              <option key={l.id} value={l.id}>
                {l.materialName} ({(l.currentStockGrams / 1000).toFixed(2)}kg{l.lotNumber ? ` · #${l.lotNumber}` : ''})
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-muted/40 border border-dashed border-border rounded-2xl p-5 text-center text-muted-foreground text-sm">
            {t('addBrew.noLotsForType').replace('{type}', t(`types.${form.type}`) || form.type)}{' '}
            <button onClick={() => navigate('/inventory')} className="text-brew-green underline">{t('addBrew.goToInventory')}</button>
          </div>
        )}
        {form.lotId && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Package size={11} /> {t('addBrew.lotAutoDeduct')}
          </p>
        )}
      </div>

      <div>
        <label className={LABEL}>🧂 {t('addBrew.actualWeight')}</label>
        <input
          type="number"
          className={BIG_INPUT}
          placeholder={selectedProfile?.targetDoseGrams ? `${t('addBrew.profileTarget').replace('{value}', selectedProfile.targetDoseGrams + 'g')}` : '0'}
          value={form.actualWeightGrams}
          onChange={e => updateForm('actualWeightGrams', e.target.value)}
        />
        {selectedProfile?.targetDoseGrams && form.actualWeightGrams &&
          Number(form.actualWeightGrams) !== selectedProfile.targetDoseGrams && (
          <p className="text-xs text-amber-600 mt-1.5 font-medium">
            ⚠️ {t('addBrew.overTarget').replace('{diff}',
              `${Number(form.actualWeightGrams) > selectedProfile.targetDoseGrams ? '+' : ''}${(Number(form.actualWeightGrams) - selectedProfile.targetDoseGrams).toFixed(1)}`
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>{t('addBrew.portions')}</label>
          <input type="number" min="1" className={BIG_INPUT} value={form.pax} onChange={e => updateForm('pax', Number(e.target.value))} />
        </div>
        <div>
          <label className={LABEL}>{t('addBrew.waterVolume')}</label>
          <input type="number" step="0.01" className={BIG_INPUT} placeholder="0.30" value={form.waterVolumeLiters} onChange={e => updateForm('waterVolumeLiters', e.target.value)} />
        </div>
      </div>

      {(form.actualWeightGrams || form.pax) && (
        <div className="bg-brew-green/10 border border-brew-green/20 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">{t('addBrew.totalDose')}</span>
          <span className="font-black text-brew-green text-2xl">{((Number(form.actualWeightGrams) || 0) * form.pax).toFixed(1)}g</span>
        </div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div>
        <label className={LABEL}><Thermometer size={12} className="inline mr-1" />{t('addBrew.waterTemp')}</label>
        <input
          type="number"
          className={BIG_INPUT}
          placeholder={selectedProfile?.targetWaterTempC
            ? t('addBrew.profileTarget').replace('{value}', selectedProfile.targetWaterTempC + '°C')
            : '93'}
          value={form.waterTemp}
          onChange={e => updateForm('waterTemp', e.target.value)}
        />
        {selectedProfile?.targetWaterTempC && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('addBrew.profileTarget').replace('{value}', selectedProfile.targetWaterTempC + '°C')}
          </p>
        )}
      </div>

      <div>
        <label className={LABEL}><Timer size={12} className="inline mr-1" />{t('addBrew.contactTime')}</label>
        <div className="bg-muted/40 border border-border rounded-2xl p-5">
          <div className="text-center mb-4">
            <span className={`font-mono text-5xl font-black tracking-wider ${timerRunning ? 'text-brew-green' : 'text-foreground'}`}>
              {secsToMMSS(timerSecs) || '00:00'}
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startTimer}
              disabled={timerRunning}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${timerRunning ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-brew-green text-white hover:bg-brew-green/90 active:scale-95'}`}
            >
              <Play size={20} /> {t('addBrew.timerStart')}
            </button>
            <button
              onClick={stopTimer}
              disabled={!timerRunning}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!timerRunning ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'}`}
            >
              <Square size={20} /> {t('addBrew.timerStop')}
            </button>
            <button
              onClick={resetTimer}
              className="px-5 py-4 rounded-xl font-bold text-lg bg-muted hover:bg-muted/70 transition-all"
            >
              {t('addBrew.timerReset')}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              {t('addBrew.timerManual')}
            </label>
            <input
              className={BIG_INPUT}
              placeholder="03:30"
              value={form.contactTimeDisplay}
              onChange={e => {
                updateForm('contactTimeDisplay', e.target.value);
                if (/^\d+:\d{2}$/.test(e.target.value)) {
                  const [m, s] = e.target.value.split(':').map(Number);
                  updateForm('contactTimeSecs', m * 60 + s);
                }
              }}
            />
          </div>
          {selectedProfile?.targetSteepTimeSecs > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('addBrew.profileTarget').replace('{value}', secsToMMSS(selectedProfile.targetSteepTimeSecs))}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={LABEL}><FlaskConical size={12} className="inline mr-1" />{t('addBrew.tdsLabel')}</label>
        <input
          type="number"
          step="0.01"
          className={BIG_INPUT}
          placeholder="1.35"
          value={form.tds}
          onChange={e => updateForm('tds', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1.5">{t('addBrew.tdsHint')}</p>
        {selectedProfile?.targetTdsMin && selectedProfile?.targetTdsMax && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('addBrew.tdsTargetRange')
              .replace('{min}', selectedProfile.targetTdsMin)
              .replace('{max}', selectedProfile.targetTdsMax)}{' '}
            {form.tds && (
              Number(form.tds) >= selectedProfile.targetTdsMin && Number(form.tds) <= selectedProfile.targetTdsMax
                ? <span className="text-green-600 font-bold">{t('addBrew.tdsInRange')}</span>
                : <span className="text-amber-600 font-bold">{t('addBrew.tdsOutRange')}</span>
            )}
          </p>
        )}
      </div>

      <div>
        <label className={LABEL}><Droplets size={12} className="inline mr-1" />{t('addBrew.yieldLabel')}</label>
        <input
          type="number"
          className={BIG_INPUT}
          placeholder="280"
          value={form.yieldVolumeMl}
          onChange={e => updateForm('yieldVolumeMl', e.target.value)}
        />
        {form.waterVolumeLiters && form.yieldVolumeMl && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('addBrew.waterRetention').replace('{loss}',
              Math.max(0, (Number(form.waterVolumeLiters) * 1000) - Number(form.yieldVolumeMl)).toFixed(0)
            )}
          </p>
        )}
      </div>

      {dilutionWaterMl !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Beaker size={18} className="text-blue-600" />
            <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">{t('addBrew.dilutionTitle')}</h3>
          </div>
          <p className="text-blue-900 text-lg font-semibold">
            {t('addBrew.dilutionInstruction').replace('{tds}', selectedProfile.targetTdsMax)}
          </p>
          <p className="text-blue-700 text-3xl font-black mt-1">
            {t('addBrew.dilutionResult').replace('{amount}', (dilutionWaterMl / 1000).toFixed(2))}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            {t('addBrew.dilutionBasis')
              .replace('{yield}', form.yieldVolumeMl)
              .replace('{actual}', form.tds)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div>
        <label className={LABEL}><Target size={12} className="inline mr-1" />{t('addBrew.tasteTest')}</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => updateForm('tastePassed', true)}
            className={`py-8 rounded-2xl font-bold text-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              form.tastePassed === true
                ? 'bg-green-500 text-white border-green-500 shadow-lg scale-[1.02]'
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            }`}
          >
            <span className="text-4xl">🟢</span>
            {t('addBrew.tastePassed')}
          </button>
          <button
            onClick={() => updateForm('tastePassed', false)}
            className={`py-8 rounded-2xl font-bold text-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              form.tastePassed === false
                ? 'bg-red-500 text-white border-red-500 shadow-lg scale-[1.02]'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <span className="text-4xl">🔴</span>
            {t('addBrew.tasteFailed')}
          </button>
        </div>
      </div>

      <div>
        <label className={LABEL}>{t('addBrew.sensoryNotes')}</label>
        <textarea
          className={BIG_INPUT}
          rows={3}
          placeholder={t('addBrew.sensoryPlaceholder')}
          value={form.sensoryNotes}
          onChange={e => updateForm('sensoryNotes', e.target.value)}
        />
      </div>

      <div className="text-center space-y-4 bg-muted/30 rounded-2xl p-5">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">{t('addBrew.overallRating')} *</h3>
          <StarRating value={form.rating} onChange={val => updateForm('rating', val)} size={32} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">{t('addBrew.flavorProfile')}</h3>
            <StarRating value={form.flavor} onChange={val => updateForm('flavor', val)} size={20} />
          </div>
          <div>
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">{t('addBrew.easeOfPrep')}</h3>
            <StarRating value={form.ease} onChange={val => updateForm('ease', val)} size={20} />
          </div>
        </div>
      </div>

      <div>
        <label className={LABEL}>{t('addBrew.generalNotes')}</label>
        <textarea
          className={BIG_INPUT}
          rows={3}
          placeholder={t('addBrew.generalNotesPlaceholder')}
          value={form.notes}
          onChange={e => updateForm('notes', e.target.value)}
        />
      </div>
    </motion.div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-page-light flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 mx-auto">
            <Check size={56} />
          </div>
          <h2 className="font-playfair text-3xl font-bold mb-2">{t('addBrew.batchLogged')}</h2>
          {form.lotId && <p className="text-muted-foreground text-sm mt-1">{t('addBrew.inventoryDeducted')}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-main flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="flex items-center mb-6 relative">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="p-3 -ml-2 rounded-full hover:bg-muted absolute left-0 touch-manipulation"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center">
            <p className="font-playfair text-xl font-bold">{t('addBrew.title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('addBrew.stepOf').replace('{step}', step).replace('{total}', 4)} — {STEPS[step - 1].label}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {STEPS.map(s => (
            <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${s.num <= step ? 'bg-brew-green' : 'bg-muted'}`} />
              <span className={`text-[10px] font-semibold ${s.num <= step ? 'text-brew-green' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 pb-4">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex justify-between gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-5 border-2 rounded-2xl flex items-center font-semibold text-lg touch-manipulation"
            >
              <ChevronLeft size={20} /> {t('addBrew.previous')}
            </button>
          )}
          <RippleButton
            className="flex-1 flex items-center justify-center py-5 text-lg font-bold"
            onClick={handleNext}
            disabled={saving || uploadingImage}
          >
            {step < 4
              ? <><span>{t('addBrew.next')}</span> <ChevronRight size={20} /></>
              : saving ? t('addBrew.saving') : <><Coffee size={20} /> {t('addBrew.saveBrew')}</>}
          </RippleButton>
        </div>
      </main>
    </div>
  );
}