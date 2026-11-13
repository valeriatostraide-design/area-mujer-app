import { useMemo } from 'react';
import { extractMeasuresAndDates } from './alertRules';

export function useDocumentAnalysis(text) {
  return useMemo(() => {
    if (!text || !text.trim()) {
      return { measures: [], expiry: null, summary: 'Sin contenido para analizar.' };
    }

    const findings = extractMeasuresAndDates(text);
    const firstExpiry = findings.find(item => item.fechaVencimiento)?.fechaVencimiento || null;

    return {
      measures: findings.map(item => item.medida),
      expiry: firstExpiry,
      summary: findings[0]?.resumen || 'Sin coincidencias relevantes.'
    };
  }, [text]);
}
