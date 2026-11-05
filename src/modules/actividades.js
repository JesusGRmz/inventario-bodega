import { uid } from '../utils/helpers.js';
import {
  escucharActividades,
  guardarActividad,
  actualizarEstadoActividad as actualizarEstadoEnFirestore,
  actualizarActividad as actualizarEnFirestore,
  eliminarActividad as eliminarEnFirestore
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

  async editar(id, cambios) {
    if (!ESTADOS_VALIDOS.includes(cambios.estado)) {
      throw new Error('Selecciona un estado de seguimiento válido.');
    }
    if (!cambios.usuario?.trim() || !cambios.actividad?.trim()) {
      throw new Error('Completa el nombre o usuario y la actividad.');
    }
    const actividad = {
      usuario: cambios.usuario.trim(),
      actividad: cambios.actividad.trim(),
      estado: cambios.estado,
      comentario: (cambios.comentario || '').trim()
    };

    if (this.db) {
      await actualizarEnFirestore(this.db, id, actividad);
      return;
    }
    this.actividades = this.actividades.map((registro) =>
      registro.id === id ? { ...registro, ...actividad } : registro
    );
    guardarLocal(this.actividades);
    this._emit();
  }

  async eliminar(id) {
    if (this.db) {
      await eliminarEnFirestore(this.db, id);
      return;
    }
    this.actividades = this.actividades.filter((registro) => registro.id !== id);
    guardarLocal(this.actividades);
    this._emit();
  }

  obtenerPorId(id) {
    return this.actividades.find((registro) => registro.id === id) || null;
  }
}

export const actividadesStore = new ActividadesStore();