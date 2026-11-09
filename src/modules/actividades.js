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

function claveLocal(uid) {
  return uid ? `${LS_KEY}_${uid}` : LS_KEY;
}

function cargarLocal(uid) {
  try {
    const raw = localStorage.getItem(claveLocal(uid));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('No se pudieron leer las actividades locales:', error);
    return [];
  }
}

function guardarLocal(actividades, uid) {
  localStorage.setItem(claveLocal(uid), JSON.stringify(actividades));
}

class ActividadesStore {
  constructor() {
    this.userId = null;
    this.modoLocal = true;
    this.actividades = cargarLocal(null);
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

  conectarFirestore(db, userId) {
    if (!userId) throw new Error('No se puede cargar actividades sin una sesión autenticada.');
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.db = db;
    this.userId = userId;
    this.modoLocal = false;
    this.actividades = cargarLocal(userId);
    this._emit();
    this.unsubscribe = escucharActividades(
      db,
      userId,
      (actividades) => {
        if (this.userId !== userId) return;
        this.actividades = actividades;
        guardarLocal(this.actividades, userId);
        this._emit();
      },
      () => {}
    );
  }

  desconectarFirestore({ modoLocal = true } = {}) {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.db = null;
    this.userId = null;
    this.modoLocal = modoLocal;
    this.actividades = modoLocal ? cargarLocal(null) : [];
    this._emit();
  }

  _validarModoEscritura() {
    if (!this.db && !this.modoLocal) {
      throw new Error('Inicia sesión para consultar o modificar tus actividades.');
    }
  }

  async agregar(datos) {
    this._validarModoEscritura();
    if (!ESTADOS_VALIDOS.includes(datos.estado)) {
      throw new Error('Selecciona un estado de seguimiento válido.');
    }
    const actividad = {
      ...datos,
      id: uid().replace(/^eq_/, 'act_'),
      fecha: new Date().toISOString()
    };

    if (this.db) {
      await guardarActividad(this.db, this.userId, actividad);
      return;
    }

    this.actividades = [actividad, ...this.actividades];
    guardarLocal(this.actividades, this.userId);
    this._emit();
  }

  async actualizarEstado(id, estado) {
    this._validarModoEscritura();
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new Error('Selecciona un estado de seguimiento válido.');
    }
    if (this.db) {
      await actualizarEstadoEnFirestore(this.db, this.userId, id, estado);
      return;
    }
    this.actividades = this.actividades.map((actividad) =>
      actividad.id === id ? { ...actividad, estado } : actividad
    );
    guardarLocal(this.actividades, this.userId);
    this._emit();
  }

  async editar(id, cambios) {
    this._validarModoEscritura();
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
      await actualizarEnFirestore(this.db, this.userId, id, actividad);
      return;
    }
    this.actividades = this.actividades.map((registro) =>
      registro.id === id ? { ...registro, ...actividad } : registro
    );
    guardarLocal(this.actividades, this.userId);
    this._emit();
  }

  async eliminar(id) {
    this._validarModoEscritura();
    if (this.db) {
      await eliminarEnFirestore(this.db, this.userId, id);
      return;
    }
    this.actividades = this.actividades.filter((registro) => registro.id !== id);
    guardarLocal(this.actividades, this.userId);
    this._emit();
  }

  obtenerPorId(id) {
    return this.actividades.find((registro) => registro.id === id) || null;
  }
}

export const actividadesStore = new ActividadesStore();