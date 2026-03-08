import { useState, useCallback } from 'react';
import { Search, Camera } from 'lucide-react';
import { CameraView } from '@/components/scanner/CameraView';
import { ScanResultList } from '@/components/scanner/ScanResultList';
import { searchCards } from '@/api/pokemonTcg';
import type { PokemonCard, SearchFilters } from '@/types/pokemon';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

type ScanMode = 'camera' | 'manual';

// Dynamic import for Tesseract to avoid bundling issues
async function runOCR(imageDataUrl: string): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    // Crop to top ~20% for card name
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = imageDataUrl;
    await new Promise((resolve) => { img.onload = resolve; });

    canvas.width = img.width;
    canvas.height = Math.floor(img.height * 0.20);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, img.width, canvas.height, 0, 0, canvas.width, canvas.height);

    const croppedData = canvas.toDataURL('image/jpeg', 0.95);
    const result = await Tesseract.recognize(croppedData, 'eng', {
      logger: () => {},
    });
    return result.data.text.trim();
  } catch {
    return '';
  }
}

export function Scanner() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [results, setResults] = useState<PokemonCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchByName = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setError(null);
    const filters: SearchFilters = {
      query: query.trim(),
      types: [],
      supertypes: [],
      subtypes: [],
      setId: '',
      rarity: '',
      format: 'all',
    };
    const result = await searchCards(filters, 1, 6);
    setResults(result.data);
  }, []);

  const handleCapture = useCallback(async (imageSrc: string) => {
    setProcessing(true);
    setResults(null);
    setError(null);
    try {
      const text = await runOCR(imageSrc);
      setOcrText(text);

      if (text) {
        // Clean OCR text - take first line that looks like a name
        const cleanText = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 2 && /[a-zA-Z]/.test(l))[0] ?? text;

        await searchByName(cleanText.slice(0, 30));
      } else {
        setError('Could not read card name. Try manual search.');
      }
    } catch {
      setError('Scan failed. Try manual search.');
    } finally {
      setProcessing(false);
    }
  }, [searchByName]);

  const handleReset = () => {
    setResults(null);
    setOcrText('');
    setError(null);
    setManualQuery('');
  };

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) return;
    setProcessing(true);
    setResults(null);
    try {
      await searchByName(manualQuery);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Card Scanner</h1>
        <p className="text-gray-400 text-sm">Scan physical cards to add them to your collection</p>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <button
          onClick={() => { setMode('camera'); handleReset(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === 'camera' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Camera size={16} />
          Camera Scan
        </button>
        <button
          onClick={() => { setMode('manual'); handleReset(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search size={16} />
          Manual Search
        </button>
      </div>

      {/* Results */}
      {results !== null ? (
        <ScanResultList cards={results} ocrText={ocrText} onReset={handleReset} />
      ) : (
        <>
          {mode === 'camera' && (
            <div className="space-y-4">
              <CameraView onCapture={handleCapture} processing={processing} />

              {/* Manual fallback */}
              <div className="border-t border-card-border pt-4">
                <p className="text-xs text-gray-500 mb-2 text-center">Or search manually if scan fails</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleManualSearch()}
                    placeholder="Card name..."
                    className="flex-1 bg-card-bg border border-card-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                  <Button size="sm" onClick={() => void handleManualSearch()} loading={processing}>
                    <Search size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleManualSearch()}
                  placeholder="Search card by name..."
                  autoFocus
                  className="flex-1 bg-card-bg border border-card-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                />
                <Button onClick={() => void handleManualSearch()} loading={processing}>
                  <Search size={16} />
                  Search
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Type the card name and press Enter or Search
              </p>
            </div>
          )}

          {processing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner />
              <p className="text-sm text-gray-400">
                {mode === 'camera' ? 'Reading card...' : 'Searching...'}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}
        </>
      )}

      {/* Tips */}
      <div className="bg-card-bg border border-card-border rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">📸 Tips for best results</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Place card on a flat, contrasting surface</li>
          <li>• Ensure good lighting without glare</li>
          <li>• Hold camera steady and close to the card</li>
          <li>• Card name should be clearly visible</li>
          <li>• Use manual search if scan doesn't work</li>
        </ul>
      </div>
    </div>
  );
}
