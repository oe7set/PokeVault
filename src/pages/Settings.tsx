import { useState, useEffect } from 'react';
import { Key, Trash2, Download, Info, ChevronRight, CheckCircle } from 'lucide-react';
import { db, getSetting, setSetting } from '@/db/database';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';

export function Settings() {
  const { addToast } = useUIStore();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [tcgApiKey, setTcgApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      getSetting('anthropic_api_key'),
      getSetting('tcg_api_key'),
    ]).then(([ak, tk]) => {
      if (ak) setAnthropicKey(ak);
      if (tk) setTcgApiKey(tk);
    });
  }, []);

  const handleSaveKeys = async () => {
    setSaving(true);
    try {
      await setSetting('anthropic_api_key', anthropicKey.trim());
      await setSetting('tcg_api_key', tcgApiKey.trim());
      addToast('Settings saved', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Clear ALL data? This cannot be undone. Your collection and decks will be deleted.')) return;
    await db.collection.clear();
    await db.decks.clear();
    await db.cards_cache.clear();
    await db.sets_cache.clear();
    await db.recent_searches.clear();
    addToast('All data cleared', 'info');
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
    addToast('Data exported', 'success');
  };

  return (
    <div className="p-4 space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Settings</h1>
        <p className="text-gray-400 text-sm">Configure PokeVault</p>
      </div>

      {/* API Keys */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Key size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-gray-200">API Keys</h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Anthropic API Key (for AI Deck Advisor)
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
              Get a free key at console.anthropic.com • Required for AI deck tips
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Pokémon TCG API Key (optional — increases rate limits)
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
              Free at pokemontcg.io • Works without key, but with lower rate limits
            </p>
          </div>

          <Button onClick={() => void handleSaveKeys()} loading={saving}>
            Save API Keys
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Download size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-200">Data Management</h2>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              All data is stored locally in your browser (IndexedDB). Nothing is sent to servers except API calls.
            </p>
          </div>

          <button
            onClick={() => void handleExportData()}
            className="w-full flex items-center justify-between px-4 py-3 bg-card-border/30 rounded-lg hover:bg-card-hover transition-colors text-sm"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <Download size={16} />
              Export Backup (JSON)
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>

          <button
            onClick={() => void handleClearData()}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-900/20 border border-red-700/20 rounded-lg hover:bg-red-900/40 transition-colors text-sm"
          >
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 size={16} />
              Clear All Data
            </div>
            <ChevronRight size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
          <Info size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">About</h2>
        </div>
        <div className="p-4 text-xs text-gray-500 space-y-1">
          <p><span className="text-gray-400">App:</span> PokeVault v1.0</p>
          <p><span className="text-gray-400">Card Data:</span> Pokémon TCG API (pokemontcg.io)</p>
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
