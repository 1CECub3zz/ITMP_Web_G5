import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import RippleButton from '@/components/ui/RippleButton';
import StarRating from '@/components/ui/StarRating';
import WheelPicker from '@/components/ui/WheelPicker';
import { Upload, CheckCircle } from 'lucide-react';
import { BREW_METHODS, BREW_TYPES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';
import { useToast } from '@/components/ui/use-toast';

// 💥 Import real API
import { getBrewById, updateBrewLog, uploadBrewImage } from '@/api/db-services';

export default function EditBrew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const imageInputRef = useRef(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    // 💥 Fetch real cloud data and reverse map to form using BFF pattern
    getBrewById(id).then((b) => {
      if (b) {
        setForm({
          name: b.basics?.beanName || '',
          type: b.basics?.roaster || 'pourover',
          method: b.parameters?.method || 'V60',
          temperature: b.parameters?.temperature || '',
          ingredients: b.parameters?.dose_grams || '',
          notes: b.review?.comment || '',
          rating: b.review?.rating || 0,
          image_url: b.imageUrl || '',
        });
      } else {
        toast({ variant: 'destructive', description: 'Brew not found.' });
        navigate('/records');
      }
    });
  }, [id, navigate, toast]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const result = await uploadBrewImage(file);
      if (result.success) {
        setForm((current) => ({ ...current, image_url: result.url }));
        toast({ description: t('status.photoUploaded') });
      } else throw new Error(result.errorMessage);
    } catch {
      toast({ variant: 'destructive', description: t('addBrew.uploadFailed') });
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // 💥 Map back to Firebase structure
    const updatePayload = {
      "basics.beanName": form.name,
      "basics.roaster": form.type,
      "parameters.method": form.method,
      "parameters.dose_grams": Number(form.ingredients) || 0,
      "review.rating": form.rating,
      "review.comment": form.notes,
      "imageUrl": form.image_url
    };

    const result = await updateBrewLog(id, updatePayload);

    if (result.success) {
      setSaved(true);
      setTimeout(() => navigate('/records'), 1200);
    } else {
      toast({ variant: 'destructive', description: "Update failed." });
    }
    setSaving(false);
  };

  if (!form) return (
      <div className="min-h-screen bg-page-main"><Navbar />
        <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-4 border-brew-green/30 border-t-brew-green rounded-full animate-spin" /></div>
      </div>
  );

  return (
      <div className="min-h-screen bg-page-main">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-playfair text-3xl font-bold mb-6">{t('editBrew.title')}</h1>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('addBrew.beverageName')}</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('records.type')}</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green">
                    {BREW_TYPES.map(type => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('records.method')}</label>
                  <select value={form.method || ''} onChange={(e) => set('method', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green">
                    <option value="">{t('addBrew.selectMethod')}</option>
                    {BREW_METHODS.map(method => <option key={method} value={method}>{t(`methods.${method}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Dose (grams)</label>
                  <WheelPicker height={100} min={1} max={100} step={0.5} unit="g" value={Number(form.ingredients) || 20} onChange={val => set('ingredients', val)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('addBrew.notes')}</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('addBrew.yourRating')}</label>
                <StarRating value={form.rating || 0} onChange={(v) => set('rating', v)} size={24} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('common.photo')}</label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                  <RippleButton type="button" variant="secondary" className="flex items-center gap-2" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                    <Upload size={14} /> {uploadingImage ? t('common.uploading') : t('editBrew.changePhoto')}
                  </RippleButton>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
              {saved && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-brew-green font-semibold text-sm">
                    <CheckCircle size={18} /> {t('editBrew.saved')}
                  </motion.div>
              )}
              <div className="flex gap-3 pt-2">
                <RippleButton variant="secondary" onClick={() => navigate('/records')}>{t('common.cancel')}</RippleButton>
                <RippleButton onClick={handleSave} disabled={saving || saved}>{saving ? t('addBrew.saving') : t('editBrew.saveChanges')}</RippleButton>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
  );
}