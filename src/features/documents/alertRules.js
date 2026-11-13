export function extractMeasuresAndDates(text = '') {
  const lower = (text || '').toLowerCase();
  const results = [];

  const rules = [
    {
      key: 'Medida de protección',
      patterns: ['medida de protección', 'medida de cautela', 'protección']
    },
    {
      key: 'Restricción de contacto',
      patterns: ['restricción de contacto', 'prohibición de contacto', 'no acercamiento']
    },
    {
      key: 'Régimen de visita',
      patterns: ['régimen de visita', 'regimen de visita', 'visitas']
    },
    {
      key: 'Citación',
      patterns: ['citación', 'citación judicial', 'comparecencia']
    }
  ];

  const matches = rules.filter(rule =>
    rule.patterns.some(pattern => lower.includes(pattern))
  );

  matches.forEach(rule => {
    results.push({
      medida: rule.key,
      resumen: `Se detectó referencia a ${rule.key.toLowerCase()}.`,
      fechaVencimiento: null
    });
  });

  const dateMatches = [...text.matchAll(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/g)].map(match => match[0]);

  if (results.length === 0 && (lower.includes('vencimiento') || lower.includes('vence') || lower.includes('fecha límite'))) {
    results.push({
      medida: 'Control de vencimiento',
      resumen: 'El documento menciona una fecha límite o vencimiento.',
      fechaVencimiento: dateMatches[0] || 'Revisar fecha exacta del documento'
    });
  }

  if (dateMatches.length && results.length) {
    const firstDate = dateMatches[0];
    const normalized = firstDate.includes('/') ? firstDate : firstDate;
    results[0].fechaVencimiento = normalized;
  }

  if (results.length === 0) {
    results.push({
      medida: 'Sin coincidencias claras',
      resumen: 'El texto no coincidió con medidas frecuentes o vencimientos.',
      fechaVencimiento: null
    });
  }

  return results;
}
