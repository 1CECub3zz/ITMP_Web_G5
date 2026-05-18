import { LANGUAGES } from '@/lib/i18n';
import { useI18n } from '@/lib/I18nContext';

export default function LanguageSwitcher({ compact = false, className = '' }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      {!compact && <span className="text-muted-foreground">{t('common.language')}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="border border-input bg-card rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brew-green"
        aria-label={t('common.language')}
      >
        {Object.entries(LANGUAGES).map(([value, meta]) => (
          <option key={value} value={value}>
            {compact ? meta.nativeLabel : `${meta.nativeLabel} (${meta.label})`}
          </option>
        ))}
      </select>
    </label>
  );
}
