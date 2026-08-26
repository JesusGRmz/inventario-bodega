import * as XLSX from 'xlsx';
import { fmtFecha } from '../utils/helpers.js';

export function exportarJSON(equipos) {
  const blob = new Blob([JSON.stringify(equipos, null, 2)], { type: 'application/json' });
  descargar(blob, `equipos_${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportarExcel(equipos) {
  const datos = equipos.map((eq) => ({
    'No. Serie': eq.noSerie,
    'Marca / Modelo': eq.marca,
    RAM: eq.ram,
    Comentario: eq.comentario || '',
    // 'Fecha de registro': fmtFecha(eq.fecha)
  }));
  const ws = XLSX.utils.json_to_sheet(datos);
  ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 35 }]; // { wch: 20 } // ancho de 'Fecha de registro'
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