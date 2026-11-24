import Dexie from 'dexie';

export const db = new Dexie('area-mujer-db');

db.version(1).stores({
  situaciones: 'id, titular, denunciado, fecha, categoria, estado, descripcion, observaciones, medidas, alertas, tareas',
  intervenciones: 'id, situacionId, texto, fecha',
  alertas: 'id, situacionId, texto, fecha',
  tareas: 'id, situacionId, texto, fecha'
});

export const seedData = async () => {
  const count = await db.situaciones.count();
  if (count > 0) return;

  const now = new Date().toISOString().slice(0, 10);

  const defaultSituacion = {
    id: crypto.randomUUID(),
    titular: 'María López',
    denunciado: 'Juan Pérez',
    fecha: now,
    categoria: 'Denuncia',
    estado: 'En trámite',
    descripcion: 'Consulta por situación de violencia y medidas solicitadas.',
    observaciones: 'Se solicita revisión de documentación y seguimiento de medidas.',
    medidas: ['Medida de protección', 'Restricción de contacto'],
    alertas: ['Revisión de vencimiento próximo'],
    tareas: ['Contactar a testigo', 'Solicitar documentación']
  };

  await db.situaciones.add(defaultSituacion);
};

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
  await db.situaciones.delete(id);
};

export const addIntervention = async (situacionId, texto) => {
  const item = {
    id: crypto.randomUUID(),
    situacionId,
    texto,
    fecha: new Date().toISOString()
  };
  await db.intervenciones.add(item);

  const situacion = await db.situaciones.get(situacionId);
  if (!situacion) return item;

  const list = Array.isArray(situacion.intervenciones) ? situacion.intervenciones : [];
  await db.situaciones.put({
    ...situacion,
    intervenciones: [...list, texto]
  });

  return item;
};

export const addAlert = async (situacionId, texto) => {
  const item = {
    id: crypto.randomUUID(),
    situacionId,
    texto,
    fecha: new Date().toISOString()
  };
  await db.alertas.add(item);

  const situacion = await db.situaciones.get(situacionId);
  if (!situacion) return item;

  const list = Array.isArray(situacion.alertas) ? situacion.alertas : [];
  await db.situaciones.put({
    ...situacion,
    alertas: [...list, texto]
  });

  return item;
};

export const addTask = async (situacionId, texto) => {
  const item = {
    id: crypto.randomUUID(),
    situacionId,
    texto,
    fecha: new Date().toISOString()
  };
  await db.tareas.add(item);

  const situacion = await db.situaciones.get(situacionId);
  if (!situacion) return item;

  const list = Array.isArray(situacion.tareas) ? situacion.tareas : [];
  await db.situaciones.put({
    ...situacion,
    tareas: [...list, texto]
  });

  return item;
};

export const saveDocumentReview = async (situacionId, review) => {\n  const records = (review.pages || []).map(page => ({\n    id: crypto.randomUUID(), situacionId, fileName: page.fileName, pageNumber: page.pageNumber,\n    tipo: page.kind, textoReconocido: page.text, dniDetectado: page.dni, nombreDetectado: page.nombreCompleto || '', rolPersona: page.rolPersona || 'Sin determinar', fechasDetectadas: page.dates,\n    nombresCandidatos: page.names, medidasCandidatas: page.measures, estadoRevision: page.status,\n    original: page.originalFile ? { name: page.originalFile.name, type: page.originalFile.type, size: page.originalFile.size, blob: page.originalFile } : null,\n    revisadoPor: review.reviewedBy, revisadoEn: review.reviewedAt, fechaCarga: new Date().toISOString()\n  }));\n  const people = (review.pages || []).filter(p => (p.nombreCompleto || p.dni) && p.rolPersona && p.rolPersona !== 'Sin determinar').map(p => ({ id: crypto.randomUUID(), situacionId, nombreCompleto: p.nombreCompleto || '', dni: p.dni || '', rol: p.rolPersona, origen: 'OCR revisado; identidad pendiente de validación', documentoNombre: p.fileName, creadoEn: new Date().toISOString() }));\n  await db.transaction('rw', db.documentos, db.personas, async () => { await db.documentos.bulkAdd(records); if (people.length) await db.personas.bulkAdd(people); });\n  return { documents: records, people };\n};\n\nexport const exportJSON = async () => {
  const situaciones = await db.situaciones.toArray();
  const payload = {
    exportado: new Date().toISOString(),
    tipo: 'AreaMujer',
    version: '0.1.0',
    situaciones
  };

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
};
