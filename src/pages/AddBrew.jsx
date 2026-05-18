import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/localClient';
import Navbar from '@/components/layout/Navbar';
import RippleButton from '@/components/ui/RippleButton';
import StarRating from '@/components/ui/StarRating';
import { Upload, CheckCircle, Coffee, Timer, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BrewingTimer from '@/components/brew/BrewingTimer';
import BadgeUnlockToast from '@/components/badges/BadgeUnlockToast';
import { getEarnedBadges } from '@/lib/badges';
import { useI18n } from '@/lib/I18nContext';
import { BREW_METHODS, BREW_TYPES } from '@/lib/brewMeta';

export default function AddBrew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const steps = [t('addBrew.basics'), t('addBrew.parameters'), t('addBrew.review')];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [form, setForm] = useState({
    name: '', type: '', method: '', temperature: '', ingredients: '', notes: '', rating: 0,
    image_url: '', image_ref: '', tutorial_video_url: '', tutorial_video_ref: '',
    brew_date: new Date().toISOString().split('T')[0],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const { file_ref, file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setForm((current) => ({ ...current, image_ref: file_ref, image_url: file_url }));
      toast({ description: t('status.photoUploaded') });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error.code === 'video_too_large' ? t('errors.videoTooLarge') : t('addBrew.uploadFailed'),
      });
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadingVideo(true);
      const { file_ref, file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setForm((current) => ({ ...current, tutorial_video_ref: file_ref, tutorial_video_url: file_url }));
      toast({ description: t('status.videoUploaded') });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error.code === 'video_too_large' ? t('errors.videoTooLarge') : t('addBrew.videoUploadFailed'),
      });
    } finally {
      setUploadingVideo(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const prevBrews = await apiClient.entities.Brew.list('-created_date', 200);
      const prevEarned = new Set(getEarnedBadges(prevBrews).map(b => b.id));
      await apiClient.entities.Brew.create({
        ...form,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        rating: form.rating || undefined,
      });
      const newBrews = await apiClient.entities.Brew.list('-created_date', 200);
      const newEarned = getEarnedBadges(newBrews);
      const unlocked = newEarned.find(b => !prevEarned.has(b.id));
      setSuccess(true);
      if (unlocked) { setNewBadge(unlocked); setTimeout(() => navigate('/records'), 3800); }
      else setTimeout(() => navigate('/records'), 1500);
    } catch {
      toast({ variant: 'destructive', description: t('addBrew.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.type;
    if (step === 1) return form.method;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold mb-6">{t('addBrew.title')}</h1>

          {/* Timer toggle */}
          <div className="flex justify-end mb-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTimer(!showTimer)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${showTimer ? 'bg-brew-green text-white border-brew-green' : 'border-border hover:bg-muted'}`}
            >
              <Timer size={15} /> {showTimer ? t('addBrew.hideTimer') : t('addBrew.showTimer')}
            </motion.button>
          </div>

          <AnimatePresence>
            {showTimer && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                <BrewingTimer selectedMethod={form.method} onClose={() => setShowTimer(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div className="flex items-center mb-8 gap-0">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-0 flex-1 last:flex-none">
                <motion.div
                  animate={{ scale: step === i ? 1.1 : 1 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i <= step ? 'bg-brew-green text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <CheckCircle size={18} /> : i + 1}
                </motion.div>
                <span className={`ml-2 text-sm font-medium ${i === step ? 'text-brew-green' : 'text-muted-foreground'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-brew-green' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              {step === 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">{t('addBrew.beverageName')} *</label>
                          <input
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder={t('addBrew.namePlaceholder')}
                            className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">{t('addBrew.beverageType')} *</label>
                          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green">
                            <option value="">{t('addBrew.selectType')}</option>
                            {BREW_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">{t('addBrew.brewDate')}</label>
                          <input type="date" value={form.brew_date} onChange={(e) => set('brew_date', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5">{t('addBrew.photoOptional')}</label>
                        <div className="border-2 border-dashed border-border rounded-2xl h-48 flex items-center justify-center bg-muted/30 mb-3 overflow-hidden">
                          {form.image_url ? (
                            <img src={form.image_url} alt="brew" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <Coffee size={48} className="text-muted-foreground/30" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{t('addBrew.uploadImageHelp')}</p>
                        <RippleButton
                          type="button"
                          variant="secondary"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload size={16} /> {uploadingImage ? t('common.uploading') : t('common.uploadPhoto')}
                        </RippleButton>
                        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">{t('addBrew.videoOptional')}</label>
                      <div className="border border-border rounded-2xl bg-muted/20 p-4">
                        <div className="rounded-2xl overflow-hidden bg-muted/40 mb-3 min-h-40 flex items-center justify-center">
                          {form.tutorial_video_url ? (
                            <video src={form.tutorial_video_url} controls className="w-full max-h-72 bg-black" />
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <Video size={40} className="opacity-40" />
                              <span className="text-sm">{t('addBrew.uploadVideoHelp')}</span>
                            </div>
                          )}
                        </div>
                        <RippleButton
                          type="button"
                          variant="secondary"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadingVideo}
                        >
                          <Video size={16} /> {uploadingVideo ? t('common.uploading') : t('common.uploadVideo')}
                        </RippleButton>
                        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">{t('addBrew.brewingMethod')} *</label>
                    <select value={form.method} onChange={(e) => set('method', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green">
                      <option value="">{t('addBrew.selectMethod')}</option>
                      {BREW_METHODS.map((method) => <option key={method} value={method}>{t(`methods.${method}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">{t('addBrew.temperature')}</label>
                    <input type="number" value={form.temperature} onChange={(e) => set('temperature', e.target.value)} placeholder="e.g. 90" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">{t('addBrew.ingredients')}</label>
                    <textarea value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} placeholder={t('addBrew.ingredientsPlaceholder')} rows={3} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">{t('addBrew.notes')}</label>
                    <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('addBrew.personalNotes')} rows={2} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green resize-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('addBrew.beverageName')}:</span><span className="font-medium text-right">{form.name}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('records.type')}:</span><span className="text-right">{form.type ? t(`types.${form.type}`) : '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('records.method')}:</span><span className="text-right">{form.method ? t(`methods.${form.method}`) : '—'}</span></div>
                    {form.temperature && <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('addBrew.temperature')}:</span><span className="text-right">{form.temperature}°C</span></div>}
                    {form.ingredients && <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('addBrew.ingredients')}:</span><span className="text-right max-w-xs truncate">{form.ingredients}</span></div>}
                    {form.tutorial_video_url && <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t('common.tutorialVideo')}:</span><span className="text-right">✓</span></div>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('addBrew.yourRating')}</label>
                    <StarRating value={form.rating} onChange={(v) => set('rating', v)} size={28} />
                  </div>
                  {success && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-brew-green font-semibold">
                      <CheckCircle size={20} /> {t('addBrew.brewSaved')}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <RippleButton variant="secondary" onClick={() => setStep(step - 1)}>← {t('addBrew.previous')}</RippleButton>
            ) : <div />}
            {step < steps.length - 1 ? (
              <RippleButton onClick={() => setStep(step + 1)} disabled={!canNext()}>{t('addBrew.next')} →</RippleButton>
            ) : (
              <RippleButton onClick={handleSubmit} disabled={saving || success}>
                {saving ? t('addBrew.saving') : `${t('addBrew.saveBrew')} ☕`}
              </RippleButton>
            )}
          </div>
        </motion.div>
      </main>
      <BadgeUnlockToast badge={newBadge} onDone={() => setNewBadge(null)} />
    </div>
  );
}
