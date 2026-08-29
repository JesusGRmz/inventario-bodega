import * as XLSX from 'xlsx';
import { fmtFecha } from '../utils/helpers.js';

const LS_EXPORT_KEY = 'equipos_export_config_v1';

/** Todas las columnas exportables disponibles, con su etiqueta y ancho para Excel. */
export const CAMPOS_EXPORTABLES = [
  { campo: 'noSerie', etiqueta: 'No. Serie', ancho: 20 },
  { campo: 'marca', etiqueta: 'Marca / Modelo', ancho: 18 },
  { campo: 'ram', etiqueta: 'RAM', ancho: 10 },
  { campo: 'procesador', etiqueta: 'Procesador', ancho: 20 },
  { campo: 'ingenieroAsignado', etiqueta: 'Ingeniero Asignado', ancho: 30 },
  { campo: 'estatus', etiqueta: 'Estatus', ancho: 15 },
  { campo: 'comentario', etiqueta: 'Comentario', ancho: 35 }  
];

const CAMPOS_POR_DEFECTO = CAMPOS_EXPORTABLES.filter((c) => c.campo !== 'fecha').map((c) => c.campo);

/** Qué columnas eligió el usuario la última vez (o todas menos fecha, si nunca ha elegido). */
export function cargarConfigExport() {
  try {
    const raw = localStorage.getItem(LS_EXPORT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignora JSON corrupto, cae al valor por defecto */
  }
  return CAMPOS_POR_DEFECTO;
}

export function guardarConfigExport(camposSeleccionados) {
  localStorage.setItem(LS_EXPORT_KEY, JSON.stringify(camposSeleccionados));
}

function camposActivos() {
  const seleccionados = cargarConfigExport();
  const activos = CAMPOS_EXPORTABLES.filter((c) => seleccionados.includes(c.campo));
  // si por alguna razón queda vacío (todo desmarcado y guardado así), exporta igual algo útil
  return activos.length > 0 ? activos : CAMPOS_EXPORTABLES.filter((c) => c.campo === 'noSerie');
}

function equipoAFilaExportable(eq, campos) {
  const fila = {};
  for (const { campo, etiqueta, esFecha } of campos) {
    fila[etiqueta] = esFecha ? fmtFecha(eq[campo]) : eq[campo] || '';
  }
  return fila;
}

export function exportarJSON(equipos) {
  const campos = camposActivos();
  const datos = equipos.map((eq) => equipoAFilaExportable(eq, campos));
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  descargar(blob, `equipos_${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportarExcel(equipos) {
  const campos = camposActivos();
  const datos = equipos.map((eq) => equipoAFilaExportable(eq, campos));
  const ws = XLSX.utils.json_to_sheet(datos);
  ws['!cols'] = campos.map(({ ancho }) => ({ wch: ancho }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
  XLSX.writeFile(wb, `equipos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function descargar(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
