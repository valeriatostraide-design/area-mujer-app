import { useRef, useState } from 'react';
import { extractMeasuresAndDates } from './alertRules';

export function DocumentReader({ onInsight }) {
  const inputRef = useRef(null);
  const [previewText, setPreviewText] = useState('');
  const [fileName, setFileName] = useState('');

  const handleTextFile = async (file) => {
    const text = await file.text();
    const cleaned = text.replace(/\s+/g, ' ').trim();
    setPreviewText(cleaned.slice(0, 600));
    const findings = extractMeasuresAndDates(cleaned || 'No se pudo extraer texto.');
    findings.forEach(item => onInsight(item));
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.json')) {
      await handleTextFile(file);
      return;
    }

    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      const preview = `Archivo de imagen cargado: ${file.name}. Se puede visualizar como soporte documental y luego validar manualmente la medida y la fecha.`;
      setPreviewText(preview);
      onInsight({
        medida: 'Documento gráfico adjunto',
        resumen: 'Se cargó un archivo de imagen para revisión manual de la resolución o medida.',
        fechaVencimiento: null
      });
      return;
    }

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setPreviewText(`Archivo PDF cargado: ${file.name}. Para análisis técnico de fechas y medidas, será necesario integrar OCR/PDF parser real en una segunda etapa.`);
      onInsight({
        medida: 'PDF detectado',
        resumen: 'Se cargó un PDF; la extracción automatizada de fechas requiere OCR o parser especializado.',
        fechaVencimiento: null
      });
      return;
    }

    setPreviewText(`Archivo cargado: ${file.name}. El análisis de fechas y medidas queda habilitado para archivos de texto e imágenes.`);
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

      {fileName && <p className="file-name">Archivo: {fileName}</p>}

      {previewText && (
        <div className="preview-box">
          <strong>Vista previa del contenido:</strong>
          <p>{previewText}</p>
        </div>
      )}
    </section>
  );
}
