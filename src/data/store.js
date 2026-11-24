import Dexie from 'dexie';
import JSZip from 'jszip';

export const db = new Dexie('area-mujer-db');

db.version(1).stores({
  situaciones: 'id, titular, denunciado, fecha, categoria, estado, descripcion, observaciones, medidas, alertas, tareas',
  intervenciones: 'id, situacionId, texto, fecha',
  alertas: 'id, situacionId, texto, fecha',
  tareas: 'id, situacionId, texto, fecha'
});

db.version(2).stores({
  situaciones: 'id, titular, denunciado, fecha, categoria, estado',
  intervenciones: 'id, situacionId, texto, fecha',
  alertas: 'id, situacionId, texto, fecha',
  tareas: 'id, situacionId, texto, fecha',
  documentos: 'id, situacionId, tipo, fechaCarga, revisadoPor',
  personas: 'id, dni, nombreCompleto, situacionId, rol',
  medidasDetalle: 'id, situacionId, tipo, fechaInicio, fechaVencimiento, estado'
});

// No se insertan casos ficticios en instalaciones de trabajo.
export const seedData = async () => {};

export const addSituation = async (payload) => {
  const item = {
    ...payload,
    id: payload.id || crypto.randomUUID(),
    medidas: payload.medidas || [],
    alertas: payload.alertas || [],
    tareas: payload.tareas || []
  };
  await db.situaciones.put(item);
  return item;
};

export const updateSituation = async (payload) => {
  await db.situaciones.put(payload);
};

export const deleteSituation = async (id) => {
  await db.transaction('rw', db.situaciones, db.documentos, db.personas, db.medidasDetalle, db.intervenciones, db.alertas, db.tareas, async () => {
    await Promise.all([
      db.situaciones.delete(id),
      db.documentos.where('situacionId').equals(id).delete(),
      db.personas.where('situacionId').equals(id).delete(),
      db.medidasDetalle.where('situacionId').equals(id).delete(),
      db.intervenciones.where('situacionId').equals(id).delete(),
      db.alertas.where('situacionId').equals(id).delete(),
      db.tareas.where('situacionId').equals(id).delete()
    ]);
  });
};

export const addIntervention = async (situacionId, texto) => {
  const item = { id: crypto.randomUUID(), situacionId, texto, fecha: new Date().toISOString() };
  await db.intervenciones.add(item);
  const situacion = await db.situaciones.get(situacionId);
  if (situacion) await db.situaciones.put({ ...situacion, intervenciones: [...(situacion.intervenciones || []), texto] });
  return item;
};

export const addAlert = async (situacionId, texto) => {
  const item = { id: crypto.randomUUID(), situacionId, texto, fecha: new Date().toISOString() };
  await db.alertas.add(item);
  const situacion = await db.situaciones.get(situacionId);
  if (situacion) await db.situaciones.put({ ...situacion, alertas: [...(situacion.alertas || []), texto] });
  return item;
};

export const addTask = async (situacionId, texto) => {
  const item = { id: crypto.randomUUID(), situacionId, texto, fecha: new Date().toISOString() };
  await db.tareas.add(item);
  const situacion = await db.situaciones.get(situacionId);
  if (situacion) await db.situaciones.put({ ...situacion, tareas: [...(situacion.tareas || []), texto] });
  return item;
};

export const saveDocumentReview = async (situacionId, review) => {
  const records = (review.pages || []).map(page => ({
    id: crypto.randomUUID(),
    situacionId,
    fileName: page.fileName,
    pageNumber: page.pageNumber,
    tipo: page.kind,
    textoReconocido: page.text,
    dniDetectado: page.dni,
    nombreDetectado: page.nombreCompleto || '',
    rolPersona: page.rolPersona || 'Sin determinar',
    fechasDetectadas: page.dates,
    nombresCandidatos: page.names,
    medidasCandidatas: page.measures,
    estadoRevision: page.status,
    original: page.originalFile ? { name: page.originalFile.name, type: page.originalFile.type, size: page.originalFile.size, blob: page.originalFile } : null,
    revisadoPor: review.reviewedBy,
    revisadoEn: review.reviewedAt,
    fechaCarga: new Date().toISOString()
  }));
  const people = (review.pages || [])
    .filter(p => (p.nombreCompleto || p.dni) && p.rolPersona && p.rolPersona !== 'Sin determinar')
    .map(p => ({
      id: crypto.randomUUID(), situacionId, nombreCompleto: p.nombreCompleto || '', dni: p.dni || '',
      rol: p.rolPersona, origen: 'OCR revisado; identidad pendiente de validación',
      documentoNombre: p.fileName, creadoEn: new Date().toISOString()
    }));
  const measureCandidates = (review.pages || []).flatMap(page => (page.measures || []).map(m => ({
    id: crypto.randomUUID(), situacionId, tipo: m.medida, fechaInicio: null, fechaVencimiento: null,
    estado: 'Pendiente de verificación', fuente: page.fileName,
    observacion: 'Referencia detectada por OCR. No constituye una medida confirmada ni acredita vigencia.'
  })));
  await db.transaction('rw', db.documentos, db.personas, db.medidasDetalle, async () => {
    await db.documentos.bulkAdd(records);
    if (people.length) await db.personas.bulkAdd(people);
    if (measureCandidates.length) await db.medidasDetalle.bulkAdd(measureCandidates);
  });
  return { documents: records, people, measureCandidates };
};

export const updateMeasureDetail = async (id, changes) => {\n  await db.medidasDetalle.update(id, changes);\n};\n\nexport const exportFullBackup = async () => {
  const zip = new JSZip();
  const [situaciones, documentos, personas, medidasDetalle, intervenciones, alertas, tareas] = await Promise.all([
    db.situaciones.toArray(), db.documentos.toArray(), db.personas.toArray(), db.medidasDetalle.toArray(),
    db.intervenciones.toArray(), db.alertas.toArray(), db.tareas.toArray()
  ]);
  const metadata = {
    exportado: new Date().toISOString(), tipo: 'AreaMujerBackup', version: '0.2.1',
    situaciones, documentos: documentos.map(({ original, ...doc }) => doc),
    personas, medidasDetalle, intervenciones, alertas, tareas
  };
  zip.file('datos.json', JSON.stringify(metadata, null, 2));
  for (const doc of documentos) {
    if (doc.original?.blob) {
      const safeName = doc.original.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      zip.file('documentos/' + doc.id + '_' + safeName, doc.original.blob);
    }
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
};

export const exportJSON = async () => {
  const situaciones = await db.situaciones.toArray();
  const payload = { exportado: new Date().toISOString(), tipo: 'AreaMujer', version: '0.2.1', situaciones };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
};
