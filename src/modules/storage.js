const LS_KEY = 'equipos_registro_v1';

export function cargarLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('No se pudo leer localStorage:', e);
    return [];
  }
}

export function guardarLocal(equipos) {
  localStorage.setItem(LS_KEY, JSON.stringify(equipos));
}
