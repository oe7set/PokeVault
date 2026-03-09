import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { DeckValidationResult } from '@/types/deck';
import { useTranslation } from '@/i18n/LanguageContext';

interface DeckValidatorProps {
  validation: DeckValidationResult;
}

export function DeckValidator({ validation }: DeckValidatorProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {/* Total count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{t('validator.totalCards')}</span>
        <span className={validation.totalCards === 60 ? 'text-green-400 font-bold' : 'text-accent font-bold'}>
          {validation.totalCards}/60
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-card-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            validation.totalCards === 60 ? 'bg-green-500' : validation.totalCards > 60 ? 'bg-red-500' : 'bg-accent'
          }`}
          style={{ width: `${Math.min(100, (validation.totalCards / 60) * 100)}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mt-2">
        {validation.valid ? (
          <>
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 text-sm font-medium">{t('validator.deckValid')}</span>
          </>
        ) : (
          <>
            <XCircle size={16} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">{t('validator.deckHasIssues')}</span>
          </>
        )}
      </div>

      {/* Errors */}
      {validation.errors.map((error, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-red-300 bg-red-900/20 rounded-lg p-2">
          <XCircle size={12} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ))}

      {/* Warnings */}
      {validation.warnings.map((warning, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-2">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}
