import { uid } from '../utils/helpers.js';
import { cargarLocal, guardarLocal } from './storage.js';
import {
  escucharEquipos,
  detenerEscucha,
  guardarEquipo as guardarEnFirestore,
  actualizarEquipo as actualizarEnFirestore,
  eliminarEquipo as eliminarDeFirestore
} from './firestore.js';

/** Campos que se guardan tal cual vienen del formulario (mismo nombre en ambos lados). */
const CAMPOS_EQUIPO = [
  'noSerie',
  'marca',
  'ram',
  'procesador',
  'ingenieroAsignado',
  'estatus',
  'comentario'
];

function construirEquipo(datos) {
  const equipo = { id: uid(), fecha: new Date().toISOString() };
  for (const campo of CAMPOS_EQUIPO) {
    equipo[campo] = datos[campo] || '';
  }
  return equipo;
}

/**
 * Store simple en memoria con patrón observador.
 * - Si hay Firestore conectado, es la fuente de verdad (tiempo real) y
 *   cada cambio se espeja también a localStorage como respaldo.
 * - Si no hay Firestore, localStorage es la fuente de verdad.
 */
class EquiposStore {
  constructor() {
    this.equipos = cargarLocal();
    this.db = null;
    this.collectionName = 'equipos';
    this.listeners = [];
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  _emit() {
    this.listeners.forEach((cb) => cb(this.equipos));
  }

  conectarFirestore(db, collectionName) {
    this.db = db;
    this.collectionName = collectionName || 'equipos';
    escucharEquipos(
      this.db,
      this.collectionName,
      (equipos) => {
        this.equipos = equipos;
        guardarLocal(this.equipos);
        this._emit();
      },
      () => {
        // si falla el listener (permisos, red), seguimos con lo último en local
        this.db = null;
      }
    );
  }

  desconectarFirestore() {
    detenerEscucha();
    this.db = null;
    this.equipos = cargarLocal();
    this._emit();
  }

  async agregar(datos) {
    const equipo = construirEquipo(datos);
    if (this.db) {
      await guardarEnFirestore(this.db, this.collectionName, equipo);
      // el listener onSnapshot actualiza el estado y notifica
    } else {
      this.equipos.unshift(equipo);
      guardarLocal(this.equipos);
      this._emit();
    }
  }

  async editar(id, cambios) {
    if (this.db) {
      await actualizarEnFirestore(this.db, this.collectionName, id, cambios);
    } else {
      this.equipos = this.equipos.map((eq) => (eq.id === id ? { ...eq, ...cambios } : eq));
      guardarLocal(this.equipos);
      this._emit();
    }
  }

  async eliminar(id) {
    if (this.db) {
      await eliminarDeFirestore(this.db, this.collectionName, id);
    } else {
      this.equipos = this.equipos.filter((eq) => eq.id !== id);
      guardarLocal(this.equipos);
      this._emit();
    }
  }

  buscar(termino) {
    const t = (termino || '').toLowerCase().trim();
    if (!t) return this.equipos;
    // busca en todos los campos de texto del equipo, sin importar cuáles se agreguen a futuro
    return this.equipos.filter((eq) =>
      CAMPOS_EQUIPO.some((campo) => (eq[campo] || '').toLowerCase().includes(t))
    );
  }

  obtenerPorId(id) {
    return this.equipos.find((eq) => eq.id === id) || null;
  }
}

export const equiposStore = new EquiposStore();
