import { useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { db, seedData, exportJSON, addSituation, updateSituation, deleteSituation, addIntervention, addAlert, addTask } from './data/store';
import { DocumentReader } from './features/documents/DocumentReader';

const tiposMedida = [
  'Medida de protección',
  'Citación',
  'Restricción de contacto',
  'Régimen de visita',
  'Otro'
];

const emptySituation = {
  id: '',
  titular: '',
  denunciado: '',
  fecha: new Date().toISOString().slice(0, 10),
  categoria: 'Situación',
  descripcion: '',
  estado: 'Abierta',
  observaciones: '',
  medidas: [],
  alertas: [],
  tareas: []
};

function App() {
  const [situaciones, setSituaciones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptySituation);
  const [documentInsights, setDocumentInsights] = useState([]);

  useEffect(() => {
    seedData();
    const load = async () => {
      const items = await db.situaciones.toArray();
      setSituaciones(items);
      if (items.length) {
        setSelectedId(items[0].id);
        setForm(items[0]);
      }
    };
    load();
  }, []);

  const selected = useMemo(
    () => situaciones.find(item => item.id === selectedId) || null,
    [situaciones, selectedId]
  );

  useEffect(() => {
    if (selected) {
      setForm(selected);
    }
  }, [selected]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.titular.trim()) {
      alert('Debe completar el nombre o titular de la situación.');
      return;
    }

    if (form.id) {
      await updateSituation(form);
    } else {
      const newItem = await addSituation(form);
      setSituaciones(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
    }

    const items = await db.situaciones.toArray();
    setSituaciones(items);
  };

  const handleNewSituation = () => {
    setSelectedId(null);
    setForm({ ...emptySituation, id: '' });
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('¿Desea eliminar esta situación?')) return;
    await deleteSituation(id);
    const items = await db.situaciones.toArray();
    setSituaciones(items);
    if (items.length) {
      setSelectedId(items[0].id);
    } else {
      setSelectedId(null);
      setForm({ ...emptySituation, id: '' });
    }
  };

  const handleAddIntervention = async () => {
    if (!selected) return;
    const texto = prompt('Ingrese la intervención realizada:');
    if (!texto) return;
    await addIntervention(selected.id, texto);
    await refreshSituations();
  };

  const handleAddAlert = async () => {
    if (!selected) return;
    const texto = prompt('Ingrese una alerta:');
    if (!texto) return;
    await addAlert(selected.id, texto);
    await refreshSituations();
  };

  const handleAddTask = async () => {
    if (!selected) return;
    const texto = prompt('Ingrese la tarea:');
    if (!texto) return;
    await addTask(selected.id, texto);
    await refreshSituations();
  };

  const refreshSituations = async () => {
    const items = await db.situaciones.toArray();
    setSituaciones(items);
  };

  const handleExportJSON = async () => {
    const blob = await exportJSON();
    saveAs(blob, 'area_mujer_export.json');
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Área Mujer - Ficha de situación', 14, 20);

    const current = selected || form;
    doc.setFontSize(12);
    doc.text(`Titular: ${current.titular || ''}`, 14, 35);
    doc.text(`Denunciado: ${current.denunciado || ''}`, 14, 45);
    doc.text(`Fecha: ${current.fecha || ''}`, 14, 55);
    doc.text(`Categoría: ${current.categoria || ''}`, 14, 65);
    doc.text(`Estado: ${current.estado || ''}`, 14, 75);

    const lines = doc.splitTextToSize(`Descripción: ${current.descripcion || ''}`, 180);
    doc.text(lines, 14, 90);

    const obsLines = doc.splitTextToSize(`Observaciones: ${current.observaciones || ''}`, 180);
    doc.text(obsLines, 14, 140);

    doc.save(`ficha_${current.id || 'situacion'}.pdf`);
  };

  const currentMeasures = selected?.medidas || form.medidas || [];
  const currentAlerts = selected?.alertas || form.alertas || [];
  const currentTasks = selected?.tareas || form.tareas || [];

  const addDocumentInsight = (insight) => {
    setDocumentInsights(prev => {
      const next = [insight, ...prev.filter(item => item.medida !== insight.medida)].slice(0, 5);
      return next;
    });

    if (insight.medida) {
      const nextMeasures = [...new Set([...(form.medidas || []), insight.medida])];
      handleChange('medidas', nextMeasures);
    }

    if (insight.fechaVencimiento) {
      const message = `Vencimiento estimado: ${insight.fechaVencimiento}`;
      const nextAlerts = [...new Set([...(form.alertas || []), message])];
      handleChange('alertas', nextAlerts);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Área Mujer</h1>
          <small>Prueba · Datos ficticios</small>
        </div>

        <button className="primary" onClick={handleNewSituation}>+ Nueva situación</button>

        <div className="list">
          {situaciones.map(item => (
            <button
              key={item.id}
              className={`list-item ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.titular || 'Sin titular'}</strong>
              <span>{item.fecha}</span>
            </button>
          ))}
        </div>

        <div className="panel-actions">
          <button onClick={handleExportJSON}>Exportar JSON</button>
        </div>
      </aside>

      <main className="content">
        {selected || form?.titular || form?.denunciado ? (
          <>
            <header className="topbar">
              <h2>Ficha de situación</h2>
              <div className="actions">
                <button onClick={handleAddIntervention}>+ Intervención</button>
                <button onClick={handleAddAlert}>+ Alerta</button>
                <button onClick={handleAddTask}>+ Tarea</button>
                <button onClick={handlePrintPDF}>Imprimir PDF</button>
                <button className="danger" onClick={() => handleDelete(selected?.id || form.id)}>Eliminar</button>
              </div>
            </header>

            <section className="form-grid">
              <label>
                Titular / Consultante
                <input value={form.titular || ''} onChange={e => handleChange('titular', e.target.value)} />
              </label>

              <label>
                Denunciado/a
                <input value={form.denunciado || ''} onChange={e => handleChange('denunciado', e.target.value)} />
              </label>

              <label>
                Fecha
                <input type="date" value={form.fecha || ''} onChange={e => handleChange('fecha', e.target.value)} />
              </label>

              <label>
                Categoría
                <select value={form.categoria || 'Situación'} onChange={e => handleChange('categoria', e.target.value)}>
                  <option>Situación</option>
                  <option>Consulta</option>
                  <option>Denuncia</option>
                  <option>Seguimiento</option>
                </select>
              </label>

              <label>
                Estado
                <select value={form.estado || 'Abierta'} onChange={e => handleChange('estado', e.target.value)}>
                  <option>Abierta</option>
                  <option>En trámite</option>
                  <option>Cerrada</option>
                  <option>Urgente</option>
                </select>
              </label>

              <label className="full">
                Descripción
                <textarea rows={4} value={form.descripcion || ''} onChange={e => handleChange('descripcion', e.target.value)} />
              </label>

              <label className="full">
                Observaciones
                <textarea rows={3} value={form.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} />
              </label>
            </section>

            <section className="subsections">
              <div className="card">
                <h3>Medidas</h3>
                <div className="chips">
                  {currentMeasures.length ? currentMeasures.map((m, i) => (
                    <span key={i} className="chip">{m}</span>
                  )) : <p>No hay medidas cargadas.</p>}
                </div>
                <div className="inline-form">
                  <select
                    onChange={e => {
                      const value = e.target.value;
                      if (!value) return;
                      const next = [...new Set([...(form.medidas || []), value])];
                      handleChange('medidas', next);
                      e.target.value = '';
                    }}
                  >
                    <option value="">Agregar medida</option>
                    {tiposMedida.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card">
                <h3>Alertas</h3>
                <ul>
                  {currentAlerts.length ? currentAlerts.map((a, i) => <li key={i}>{a}</li>) : <li>No hay alertas.</li>}
                </ul>
              </div>

              <div className="card">
                <h3>Tareas</h3>
                <ul>
                  {currentTasks.length ? currentTasks.map((t, i) => <li key={i}>{t}</li>) : <li>No hay tareas.</li>}
                </ul>
              </div>
            </section>

            <DocumentReader onInsight={addDocumentInsight} />

            {documentInsights.length > 0 && (
              <section className="document-insights">
                <h3>Resultado del analizador de documentos</h3>
                <ul>
                  {documentInsights.map((item, index) => (
                    <li key={`${item.medida}-${index}`}>
                      <strong>{item.medida || 'Sugerencia'}</strong>
                      <span>{item.fechaVencimiento ? ` • ${item.fechaVencimiento}` : ''}</span>
                      <small>{item.resumen}</small>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="footer-actions">
              <button className="primary" onClick={handleSave}>Guardar cambios</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No hay situaciones cargadas</h2>
            <p>Comience creando una nueva situación o una ficha de prueba.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
