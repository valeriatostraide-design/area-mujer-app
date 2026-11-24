import Dexie from 'dexie';
import JSZip from 'jszip';

export const db = new Dexie('area-mujer-db');

db.version(1).stores({
  situaciones: 'id, titular, denunciado, fecha, categoria, estado, descripcion, observaciones, medidas, alertas, tareas',
  intervenciones: 'id, situacionId, texto, fecha',
  alertas: 'id, situacionId, texto, fecha',
  tareas: 'id, situacionId, texto, fecha'
});

export const seedData = async () => {};
