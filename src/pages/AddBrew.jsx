import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ChevronRight, ChevronLeft, Coffee, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import RippleButton from '@/components/ui/RippleButton';
import { useToast } from '@/components/ui/use-toast';
import { BREW_METHODS, BREW_TYPES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';
import { uploadBrewImage, submitBrewLog } from '@/api/db-services';

export default function AddBrew() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', type: 'pourover', method: 'V60', ingredients: '', notes: '', rating: 0, image_url: null,
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      toast({ description: "☁️ Uploading image to cloud..." });
      const result = await uploadBrewImage(file);
      if (result.success) {
        updateForm('image_url', result.url);
        toast({ description: "📸 Image uploaded successfully!" });
      } else throw new Error(result.errorMessage);
    } catch (error) {
      toast({ variant: 'destructive', description: `Upload failed: ${error.message}` });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.name || form.rating === 0) return toast({ variant: 'destructive', description: "Name and rating required." });
    try {
      setSaving(true);
      const result = await submitBrewLog({
        beanName: form.name, roaster: form.type, method: form.method, dose_grams: form.ingredients, rating: form.rating, comment: form.notes, imageUrl: form.image_url
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/records'), 2000);
      } else throw new Error(result.errorMessage);
    } catch (error) {
      toast({ variant: 'destructive', description: `Failed to save: ${error.message}` });
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('addBrew.brewName')}</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full border border-input bg-card rounded-xl px-4 py-3 focus:ring-2 focus:ring-brew-green" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('addBrew.beverageType')}</label>
                    <select value={form.type} onChange={(e) => updateForm('type', e.target.value)} className="w-full border bg-card rounded-xl px-4 py-3 focus:ring-2 focus:ring-brew-green">
                      {BREW_TYPES.map(tOption => <option key={tOption} value={tOption}>{t(`types.${tOption}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('addBrew.method')}</label>
                    <select value={form.method} onChange={(e) => updateForm('method', e.target.value)} className="w-full border bg-card rounded-xl px-4 py-3 focus:ring-2 focus:ring-brew-green">
                      {BREW_METHODS.map(mOption => <option key={mOption} value={mOption}>{t(`methods.${mOption}`)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('addBrew.addPhoto')}</label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <div onClick={() => !uploadingImage && fileInputRef.current?.click()} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer ${form.image_url ? 'border-brew-green' : 'border-border'}`}>
                  {form.image_url ? <img src={form.image_url} className="w-full h-full object-cover rounded-xl" /> :
                      uploadingImage ? <span>⏳ Uploading...</span> : <span><Camera className="inline" /> Tap to Upload</span>}
                </div>
              </div>
            </motion.div>
        );
      case 2:
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Coffee size={16} /> Dose (Grams)</label>
                <input type="number" value={form.ingredients} onChange={(e) => updateForm('ingredients', e.target.value)} className="w-full border border-input bg-card rounded-xl px-4 py-3 focus:ring-2 focus:ring-brew-green" />
              </div>
            </motion.div>
        );
      case 3:
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold mb-2">Rating</h3>
                <StarRating value={form.rating} onChange={(val) => updateForm('rating', val)} size={24} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={4} className="w-full border border-input bg-card rounded-xl px-4 py-3 focus:ring-2 focus:ring-brew-green resize-none" />
              </div>
            </motion.div>
        );
      default: return null;
    }
  };

  if (success) {
    return (
        <div className="min-h-screen bg-brew-cream flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600"><Check size={48} /></div>
          <h2 className="font-playfair text-3xl font-bold mb-2">Success!</h2>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col">
          <div className="flex items-center mb-8 relative">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted absolute left-0"><ArrowLeft size={24} /></button>
            <div className="flex-1 text-center font-playfair text-xl font-bold">Log New Brew</div>
          </div>
          <div className="flex gap-2 mb-8">{[1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brew-green' : 'bg-muted'}`} />)}</div>
          <div className="flex-1"><AnimatePresence mode="wait">{renderStep()}</AnimatePresence></div>
          <div className="mt-8 pt-6 border-t border-border flex justify-between gap-4">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-3 border-2 rounded-xl flex items-center"><ChevronLeft size={18} /> Back</button>}
            <RippleButton className="flex-1 flex items-center justify-center" onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={saving || uploadingImage}>
              {step < 3 ? <>Next <ChevronRight size={18} /></> : (saving ? 'Saving...' : 'Save Brew')}
            </RippleButton>
          </div>
        </main>
      </div>
  );
}