import { useState, useCallback } from 'react';
import { Search, Camera } from 'lucide-react';
import { CameraView } from '@/components/scanner/CameraView';
import { ScanResultList } from '@/components/scanner/ScanResultList';
import { scanCard, searchWithText, type ScanStep, type ScanResult } from '@/utils/scannerEngine';
import { searchCards } from '@/api/cardApi';
import type { PokemonCard, SearchFilters } from '@/types/pokemon';
import type { ScoredCard } from '@/utils/scannerEngine';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/LanguageContext';

type ScanMode = 'camera' | 'manual';

const STEP_ORDER: ScanStep[] = ['preprocessing', 'ocr', 'analyzing', 'searching', 'ranking', 'done'];

function StepProgress({ currentStep, t }: { currentStep: ScanStep; t: (k: string) => string }) {
  const stepLabels: Record<ScanStep, string> = {
    preprocessing: t('scanner.preprocessing'),
    ocr: t('scanner.ocrRunning'),
    analyzing: t('scanner.analyzing'),
    searching: t('scanner.searchingCards'),
    ranking: t('scanner.ranking'),
    done: '',
  };

  const currentIdx = STEP_ORDER.indexOf(currentStep);
  const progress = Math.round((currentIdx / (STEP_ORDER.length - 1)) * 100);

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Step label */}
      <div className="flex items-center justify-center gap-2">
        <Spinner size="sm" />
        <p className="text-sm text-gray-300">{stepLabels[currentStep]}</p>
      </div>
      {/* Step dots */}
      <div className="flex justify-center gap-1.5">
        {STEP_ORDER.slice(0, -1).map((step, i) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentIdx ? 'bg-accent' : i === currentIdx ? 'bg-accent animate-pulse' : 'bg-card-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function Scanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [processing, setProcessing] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>('preprocessing');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualResults, setManualResults] = useState<PokemonCard[] | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (imageSrc: string) => {
    setProcessing(true);
    setScanResult(null);
    setManualResults(null);
    setError(null);
    setCapturedImage(imageSrc);

    try {
      const result = await scanCard(imageSrc, (step) => setScanStep(step));
      setScanResult(result);

      if (result.cards.length === 0 && result.ocrCandidates.length === 0) {
        setError(t('scanner.cannotRead'));
      }
    } catch {
      setError(t('scanner.scanFailed'));
    } finally {
      setProcessing(false);
    }
  }, [t]);

  const handleReSearch = useCallback(async (query: string) => {
    setProcessing(true);
    setError(null);
    try {
      const result = await searchWithText(query, (step) => setScanStep(step));
      setScanResult(result);
    } catch {
      setError(t('scanner.scanFailed'));
    } finally {
      setProcessing(false);
    }
  }, [t]);

  const handleReset = () => {
    setScanResult(null);
    setManualResults(null);
    setCapturedImage(null);
    setError(null);
    setManualQuery('');
  };

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) return;
    setProcessing(true);
    setManualResults(null);
    try {
      const filters: SearchFilters = {
        query: manualQuery.trim(),
        types: [],
        supertypes: [],
        subtypes: [],
        setId: '',
        rarity: '',
        format: 'all',
      };
      const result = await searchCards(filters, 1, 8);
      setManualResults(result.data);
    } finally {
      setProcessing(false);
    }
  };

  // Convert manual results to ScoredCard format for the result list
  const manualScoredCards: ScoredCard[] | null = manualResults
    ? manualResults.map((card) => ({ card, confidence: 1, matchMethod: 'exact' as const }))
    : null;

  const hasResults = scanResult !== null || manualScoredCards !== null;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">{t('scanner.title')}</h1>
        <p className="text-gray-400 text-sm">{t('scanner.subtitle')}</p>
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
          {t('scanner.cameraScan')}
        </button>
        <button
          onClick={() => { setMode('manual'); handleReset(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search size={16} />
          {t('scanner.manualSearch')}
        </button>
      </div>

      {/* Results */}
      {hasResults && !processing ? (
        <ScanResultList
          cards={scanResult?.cards ?? manualScoredCards ?? []}
          ocrText={scanResult?.bestQuery ?? manualQuery}
          onReset={handleReset}
          onReSearch={handleReSearch}
        />
      ) : (
        <>
          {mode === 'camera' && !processing && (
            <div className="space-y-4">
              <CameraView onCapture={handleCapture} processing={processing} />

              {/* Manual fallback */}
              <div className="border-t border-card-border pt-4">
                <p className="text-xs text-gray-500 mb-2 text-center">{t('scanner.manualFallback')}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleManualSearch()}
                    placeholder={t('scanner.cardName')}
                    className="flex-1 bg-card-bg border border-card-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                  <Button size="sm" onClick={() => void handleManualSearch()} loading={processing}>
                    <Search size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {mode === 'camera' && processing && (
            <div className="space-y-4">
              {/* Captured image preview */}
              {capturedImage && (
                <div className="flex justify-center">
                  <div className="relative w-32 rounded-xl overflow-hidden border border-card-border opacity-80">
                    <img src={capturedImage} alt={t('scanner.capturedImage')} className="w-full" />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                </div>
              )}

              {/* Step progress */}
              <StepProgress currentStep={scanStep} t={t} />
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
                  placeholder={t('scanner.searchByName')}
                  autoFocus
                  className="flex-1 bg-card-bg border border-card-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                />
                <Button onClick={() => void handleManualSearch()} loading={processing}>
                  <Search size={16} />
                  {t('scanner.search')}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {t('scanner.searchHint')}
              </p>
            </div>
          )}

          {mode === 'manual' && processing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner />
              <p className="text-sm text-gray-400">{t('scanner.searching')}</p>
            </div>
          )}

          {error && !processing && (
            <div className="space-y-3">
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-red-300 text-sm text-center">
                {error}
              </div>
              {/* Show re-search input on error */}
              {scanResult && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleReSearch(manualQuery)}
                    placeholder={t('scanner.editOcrText')}
                    className="flex-1 bg-card-bg border border-card-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                  <Button size="sm" onClick={() => void handleReSearch(manualQuery)}>
                    <Search size={14} />
                  </Button>
                </div>
              )}
              <Button variant="secondary" size="sm" className="w-full" onClick={handleReset}>
                {t('scanner.tryAgain')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Tips */}
      {!hasResults && !processing && (
        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">📸 {t('scanner.tips')}</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• {t('scanner.tip1')}</li>
            <li>• {t('scanner.tip2')}</li>
            <li>• {t('scanner.tip3')}</li>
            <li>• {t('scanner.tip4')}</li>
            <li>• {t('scanner.tip5')}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
