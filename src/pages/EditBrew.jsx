import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/localClient';
import Navbar from '@/components/layout/Navbar';
import RippleButton from '@/components/ui/RippleButton';
import StarRating from '@/components/ui/StarRating';
import { Upload, CheckCircle, Video } from 'lucide-react';
import { BREW_METHODS, BREW_TYPES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';
import { useToast } from '@/components/ui/use-toast';

export default function EditBrew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    apiClient.entities.Brew.get(id).then((b) => {
      if (b) {
        setForm({
          ...b,
          temperature: b.temperature || '',
          ingredients: b.ingredients || '',
          notes: b.notes || '',
          image_ref: b.image_ref || '',
          tutorial_video_ref: b.tutorial_video_ref || '',
          tutorial_video_url: b.tutorial_video_url || '',
        });
      }
    });
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const { file_ref, file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setForm((current) => ({ ...current, image_ref: file_ref, image_url: file_url }));
      toast({ description: t('status.photoUploaded') });
    } catch {
      toast({ variant: 'destructive', description: t('addBrew.uploadFailed') });
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

  const handleSave = async () => {
    setSaving(true);
    await apiClient.entities.Brew.update(id, {
      name: form.name, type: form.type, method: form.method,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      ingredients: form.ingredients, notes: form.notes,
      rating: form.rating, image_url: form.image_url, image_ref: form.image_ref,
      tutorial_video_url: form.tutorial_video_url, tutorial_video_ref: form.tutorial_video_ref,
      brew_date: form.brew_date,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/records'), 1200);
  };

  if (!form) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-brew-green/30 border-t-brew-green rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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
                <label className="block text-sm font-semibold mb-1.5">{t('addBrew.temperature')}</label>
                <input type="number" value={form.temperature} onChange={(e) => set('temperature', e.target.value)} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('addBrew.ingredients')}</label>
              <textarea value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} rows={2} className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green resize-none" />
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
            <div>
              <label className="block text-sm font-semibold mb-2">{t('common.tutorialVideo')}</label>
              <div className="space-y-3">
                {form.tutorial_video_url ? (
                  <video src={form.tutorial_video_url} controls className="w-full rounded-2xl max-h-72 bg-black" />
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground flex items-center gap-2">
                    <Video size={16} /> {t('addBrew.uploadVideoHelp')}
                  </div>
                )}
                <RippleButton type="button" variant="secondary" className="flex items-center gap-2" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>
                  <Video size={14} /> {uploadingVideo ? t('common.uploading') : t('editBrew.changeVideo')}
                </RippleButton>
                <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
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
