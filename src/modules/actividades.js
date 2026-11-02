import { uid } from '../utils/helpers.js';
import {
  escucharActividades,
  guardarActividad,
  actualizarEstadoActividad as actualizarEstadoEnFirestore
} from './actividades-firestore.js';

const LS_KEY = 'actividades_registro_v1';
const ESTADOS_VALIDOS = ['Pendiente', 'Atendido, etiquetado', 'Atendido sin etiquetar'];

function cargarLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('No se pudieron leer las actividades locales:', error);
    return [];
  }
}

function guardarLocal(actividades) {
  localStorage.setItem(LS_KEY, JSON.stringify(actividades));
}

class ActividadesStore {
  constructor() {
    this.actividades = cargarLocal();
    this.db = null;
    this.unsubscribe = null;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    callback(this.actividades);
  }

  _emit() {
    this.listeners.forEach((callback) => callback(this.actividades));
  }

  conectarFirestore(db) {
    this.desconectarFirestore();
    this.db = db;
    this.unsubscribe = escucharActividades(
      db,
      (actividades) => {
        this.actividades = actividades;
        guardarLocal(this.actividades);
        this._emit();
      },
      () => this.desconectarFirestore()
    );
  }

  desconectarFirestore() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.db = null;
    this.actividades = cargarLocal();
    this._emit();
  }

  async agregar(datos) {
    if (!ESTADOS_VALIDOS.includes(datos.estado)) {
      throw new Error('Selecciona un estado de seguimiento válido.');
    }
    const actividad = {
      ...datos,
      id: uid().replace(/^eq_/, 'act_'),
      fecha: new Date().toISOString()
    };

    if (this.db) {
      await guardarActividad(this.db, actividad);
      return;
    }

    this.actividades = [actividad, ...this.actividades];
    guardarLocal(this.actividades);
    this._emit();
  }

  async actualizarEstado(id, estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new Error('Selecciona un estado de seguimiento válido.');
    }
    if (this.db) {
      await actualizarEstadoEnFirestore(this.db, id, estado);
      return;
    }
    this.actividades = this.actividades.map((actividad) =>
      actividad.id === id ? { ...actividad, estado } : actividad
    );
    guardarLocal(this.actividades);
    this._emit();
  }
}

export const actividadesStore = new ActividadesStore();