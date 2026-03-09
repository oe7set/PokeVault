import { useState, useEffect } from 'react';
import { Key, Trash2, Download, Info, ChevronRight, CheckCircle, Database, Globe } from 'lucide-react';
import { db, getSetting, setSetting } from '@/db/database';
import { clearProviderCache, clearCardCache } from '@/api/cardApi';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n/LanguageContext';
import { LOCALES, type Locale } from '@/i18n/translations';

type ApiProvider = 'tcgdex' | 'pokemontcg';

const PROVIDERS: { id: ApiProvider; name: string; description: string }[] = [
  { id: 'tcgdex', name: 'TCGdex', description: 'Free, no API key needed' },
  { id: 'pokemontcg', name: 'pokemontcg.io', description: 'Optional API key for higher rate limits' },
];

export function Settings() {
  const { addToast } = useUIStore();
  const { t, locale, setLocale } = useTranslation();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [tcgApiKey, setTcgApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState<ApiProvider>('tcgdex');
  const [cardLanguage, setCardLanguage] = useState<Locale>('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      getSetting('anthropic_api_key'),
      getSetting('tcg_api_key'),
      getSetting('api_provider'),
      getSetting('card_language'),
    ]).then(([ak, tk, ap, cl]) => {
      if (ak) setAnthropicKey(ak);
      if (tk) setTcgApiKey(tk);
      if (ap === 'pokemontcg' || ap === 'tcgdex') setApiProvider(ap);
      if (cl) setCardLanguage(cl as Locale);
    });
  }, []);

  const handleSaveKeys = async () => {
    setSaving(true);
    try {
      await setSetting('anthropic_api_key', anthropicKey.trim());
      await setSetting('tcg_api_key', tcgApiKey.trim());
      await setSetting('api_provider', apiProvider);
      clearProviderCache();
      addToast(t('settings.settingsSaved'), 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = async (id: ApiProvider) => {
    setApiProvider(id);
    await setSetting('api_provider', id);
    clearProviderCache();
    addToast(t('settings.switchedTo', { name: PROVIDERS.find((p) => p.id === id)?.name ?? id }), 'info');
  };

  const handleCardLanguageChange = async (lang: Locale) => {
    setCardLanguage(lang);
    await setSetting('card_language', lang);
    await clearCardCache();
    addToast(t('settings.cardLanguageChanged'), 'info');
  };

  const handleClearData = async () => {
    if (!confirm(t('settings.clearConfirm'))) return;
    await db.collection.clear();
    await db.decks.clear();
    await db.cards_cache.clear();
    await db.sets_cache.clear();
    await db.recent_searches.clear();
    addToast(t('settings.dataCleared'), 'info');
  };

  const handleExportData = async () => {
    const [collection, decks] = await Promise.all([
      db.collection.toArray(),
      db.decks.toArray(),
    ]);
    const data = { collection, decks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokevault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(t('settings.dataExported'), 'success');
  };

  const activeProviderName = PROVIDERS.find((p) => p.id === apiProvider)?.name ?? 'TCGdex';

  return (
    <div className="p-4 space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">{t('settings.title')}</h1>
        <p className="text-gray-400 text-sm">{t('settings.subtitle')}</p>
      </div>

      {/* Language */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Globe size={16} className="text-green-400" />
          <h2 className="text-sm font-semibold text-gray-200">{t('settings.language')}</h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('settings.uiLanguage')}</p>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => setLocale(loc.code)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    locale === loc.code
                      ? 'border-accent bg-accent/10 text-white'
                      : 'border-card-border bg-card-border/30 text-gray-400 hover:text-white',
                  )}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {apiProvider === 'tcgdex' && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{t('settings.cardLanguage')}</p>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((loc) => (
                  <button
                    key={loc.code}
                    onClick={() => void handleCardLanguageChange(loc.code)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                      cardLanguage === loc.code
                        ? 'border-accent bg-accent/10 text-white'
                        : 'border-card-border bg-card-border/30 text-gray-400 hover:text-white',
                    )}
                  >
                    <span>{loc.flag}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {apiProvider !== 'tcgdex' && (
            <p className="text-xs text-gray-500 italic">{t('settings.cardLanguageNote')}</p>
          )}
        </div>
      </div>

      {/* Card Data Provider */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-200">{t('settings.cardDataProvider')}</h2>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500">
            {t('settings.providerHint')}
          </p>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => void handleProviderChange(p.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                apiProvider === p.id
                  ? 'border-accent bg-accent/10'
                  : 'border-card-border bg-card-border/30 hover:bg-card-hover',
              )}
            >
              <div className={clsx(
                'w-3 h-3 rounded-full border-2 shrink-0',
                apiProvider === p.id ? 'border-accent bg-accent' : 'border-gray-500',
              )} />
              <div>
                <p className={clsx('text-sm font-medium', apiProvider === p.id ? 'text-white' : 'text-gray-300')}>
                  {p.name}
                </p>
                <p className="text-xs text-gray-500">{p.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Key size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-gray-200">{t('settings.apiKeys')}</h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              {t('settings.anthropicKey')}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent font-mono"
              />
              {anthropicKey && (
                <div className="flex items-center text-green-400">
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {t('settings.anthropicKeyHint')}
            </p>
          </div>

          {apiProvider === 'pokemontcg' && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                {t('settings.tcgKey')}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tcgApiKey}
                  onChange={(e) => setTcgApiKey(e.target.value)}
                  placeholder="Enter your key..."
                  className="flex-1 bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent font-mono"
                />
                {tcgApiKey && (
                  <div className="flex items-center text-green-400">
                    <CheckCircle size={16} />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {t('settings.tcgKeyHint')}
              </p>
            </div>
          )}

          <Button onClick={() => void handleSaveKeys()} loading={saving}>
            {t('settings.saveApiKeys')}
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Download size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-200">{t('settings.dataManagement')}</h2>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {t('settings.dataHint')}
            </p>
          </div>

          <button
            onClick={() => void handleExportData()}
            className="w-full flex items-center justify-between px-4 py-3 bg-card-border/30 rounded-lg hover:bg-card-hover transition-colors text-sm"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <Download size={16} />
              {t('settings.exportBackup')}
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>

          <button
            onClick={() => void handleClearData()}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-900/20 border border-red-700/20 rounded-lg hover:bg-red-900/40 transition-colors text-sm"
          >
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 size={16} />
              {t('settings.clearAllData')}
            </div>
            <ChevronRight size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Info size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">{t('settings.about')}</h2>
        </div>
        <div className="p-4 text-xs text-gray-500 space-y-1">
          <p><span className="text-gray-400">App:</span> PokeVault v1.0</p>
          <p><span className="text-gray-400">Card Data:</span> {activeProviderName}</p>
          <p><span className="text-gray-400">AI:</span> Claude claude-sonnet-4-6 by Anthropic</p>
          <p><span className="text-gray-400">Storage:</span> IndexedDB (local only)</p>
          <p className="mt-3 text-gray-600">
            Pokémon and all related names are trademarks of Nintendo/Creatures Inc./GAME FREAK inc.
            This app is fan-made and not affiliated with The Pokémon Company.
          </p>
        </div>
      </div>
    </div>
  );
}
