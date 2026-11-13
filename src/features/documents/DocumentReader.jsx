import { useRef, useState } from 'react';

function extractMeasuresFromText(text) {
  const suggestions = [];
  const lower = text.toLowerCase();

  if (lower.includes('medida de protección') || lower.includes('medida de cautela')) {
    suggestions.push({
      medida: 'Medida de protección',
      fechaVencimiento: 'Próximo vencimiento evaluado manualmente',
      resumen: 'Se detectó referencia a una medida de protección o cautela.'
    });
  }

  if (lower.includes('restricción de contacto') || lower.includes('prohibición de contacto')) {
    suggestions.push({
      medida: 'Restricción de contacto',
      fechaVencimiento: 'Verificar fecha de resolución',
      resumen: 'Se detectó referencia a una restricción de contacto.'
    });
  }

  if (lower.includes('vencimiento') || lower.includes('vence')) {
    suggestions.push({
      medida: 'Control de vencimiento',
      fechaVencimiento: 'Revisar fecha exacta del documento',
      resumen: 'El documento menciona vencimiento o fecha límite.'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      medida: 'Sin coincidencias claras',
      fechaVencimiento: null,
      resumen: 'El texto no coincidió con frases típicas de medidas o vencimientos.'
    });
  }

  return suggestions;
}

export function DocumentReader({ onInsight }) {
  const inputRef = useRef(null);
  const [previewText, setPreviewText] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const insights = extractMeasuresFromText(cleaned || 'No se pudo extraer texto.');
    setPreviewText(cleaned.slice(0, 500));

    insights.forEach(item => onInsight(item));
  };

  const triggerInput = () => inputRef.current?.click();

  return (
    <section className="document-insights">
      <h3>Analizador de documentos</h3>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.json,.pdf,image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button onClick={triggerInput}>Leer archivo de medidas</button>

      {previewText && (
        <div className="preview-box">
          <strong>Vista previa del texto:</strong>
          <p>{previewText}</p>
        </div>
      )}
    </section>
  );
}
