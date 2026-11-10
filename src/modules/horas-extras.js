import { uid } from '../utils/helpers.js';
import {
  actualizarRegistroHoras,
  eliminarRegistroHoras,
  escucharHorasExtras,
  guardarRegistroHoras
} from './horas-extras-firestore.js';

const LS_KEY = 'registro_horas_extras_v1';
const MINUTOS_JORNADA = 8 * 60;
const MINUTOS_COMIDA = 60;
const DURACIONES_GUARDIA = [180, 300, 330, 360];

function claveLocal(userId) {
  return userId ? `${LS_KEY}_${userId}` : LS_KEY;
}

function cargarLocal(userId) {
  try {
    const raw = localStorage.getItem(claveLocal(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('No se pudieron leer los registros locales de horas extra:', error);
    return [];
  }
}

function guardarLocal(registros, userId) {
  localStorage.setItem(claveLocal(userId), JSON.stringify(registros));
}

function minutosDesdeHora(hora) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora || '')) {
    throw new Error('Captura una hora válida de entrada y salida.');
  }
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function calcularRegistro(datos) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
    throw new Error('Selecciona una fecha válida.');
  }
  const [anio, mes, dia] = datos.fecha.split('-').map(Number);
  const fechaLocal = new Date(anio, mes - 1, dia);
  if (
    fechaLocal.getFullYear() !== anio ||
    fechaLocal.getMonth() !== mes - 1 ||
    fechaLocal.getDate() !== dia
  ) {
    throw new Error('Selecciona una fecha válida.');
  }

  const diaSemana = fechaLocal.getDay();
  const esSabado = diaSemana === 6;
  if (diaSemana === 0 || (esSabado && datos.tipo !== 'sabado') || (!esSabado && datos.tipo !== 'laboral')) {
    throw new Error('El tipo de jornada debe coincidir con el día seleccionado.');
  }

  const entradaMinutos = minutosDesdeHora(datos.entrada);
  const salidaMinutos = minutosDesdeHora(datos.salida);
  if (salidaMinutos <= entradaMinutos) {
    throw new Error('La hora de salida debe ser posterior a la hora de entrada.');
  }
  const tiempoTranscurrido = salidaMinutos - entradaMinutos;
  let horasExtraMinutos;
  let jornadaMinutos;
  let tipo;

  if (esSabado) {
    const guardiaMinutos = Number(datos.guardiaMinutos);
    if (!DURACIONES_GUARDIA.includes(guardiaMinutos)) {
      throw new Error('Selecciona una duración de guardia válida.');
    }
    tipo = 'sabado';
    jornadaMinutos = guardiaMinutos;
    horasExtraMinutos = Math.max(0, tiempoTranscurrido - guardiaMinutos);
  } else {
    tipo = 'laboral';
    jornadaMinutos = MINUTOS_JORNADA;
    const tiempoNeto = Math.max(0, tiempoTranscurrido - MINUTOS_COMIDA);
    horasExtraMinutos = Math.max(0, tiempoNeto - MINUTOS_JORNADA);
  }

  return {
    fecha: datos.fecha,
    entrada: datos.entrada,
    salida: datos.salida,
    tipo,
    jornadaMinutos,
    tiempoTranscurridoMinutos: tiempoTranscurrido,
    horasExtraMinutos
  };
}

class HorasExtrasStore {
  constructor() {
    this.registros = cargarLocal(null);
    this.userId = null;
    this.db = null;
    this.unsubscribe = null;
    this.modoLocal = true;
    this.error = '';
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    callback(this.registros, this.error);
  }

  _emit() {
    this.listeners.forEach((callback) => callback(this.registros, this.error));
  }

  conectarFirestore(db, userId) {
    if (!userId) throw new Error('No se pueden cargar horas extra sin una sesión autenticada.');
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.db = db;
    this.userId = userId;
    this.modoLocal = false;
    this.error = '';
    this.registros = cargarLocal(userId);
    this._emit();
    this.unsubscribe = escucharHorasExtras(
      db,
      userId,
      (registros) => {
        if (this.userId !== userId) return;
        this.registros = registros;
        this.error = '';
        guardarLocal(registros, userId);
        this._emit();
      },
      (error) => {
        console.error('Error de Firestore en horas extra:', error);
        if (this.userId !== userId) return;
        this.error = 'No se pudieron sincronizar las horas extra. Revisa las reglas y la conexión.';
        this._emit();
      }
    );
  }

  desconectarFirestore({ modoLocal = true } = {}) {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.db = null;
    this.userId = null;
    this.modoLocal = modoLocal;
    this.error = '';
    this.registros = modoLocal ? cargarLocal(null) : [];
    this._emit();
  }

  _validarAcceso() {
    if (!this.db && !this.modoLocal) {
      throw new Error('Inicia sesión para consultar o modificar tus horas extra.');
    }
  }

  _validarFechaUnica(fecha, idActual) {
    if (this.registros.some((registro) => registro.fecha === fecha && registro.id !== idActual)) {
      throw new Error('Ya existe un registro para esa fecha. Edita el registro existente.');
    }
  }

  async agregar(datos) {
    this._validarAcceso();
    const registro = { ...calcularRegistro(datos), id: uid().replace(/^eq_/, 'hora_') };
    this._validarFechaUnica(registro.fecha);
    if (this.db) {
      await guardarRegistroHoras(this.db, this.userId, registro);
      return;
    }
    this.registros = [registro, ...this.registros];
    guardarLocal(this.registros, this.userId);
    this._emit();
  }

  async editar(id, datos) {
    this._validarAcceso();
    const cambios = calcularRegistro(datos);
    this._validarFechaUnica(cambios.fecha, id);
    if (this.db) {
      await actualizarRegistroHoras(this.db, this.userId, id, cambios);
      return;
    }
    this.registros = this.registros.map((registro) =>
      registro.id === id ? { ...registro, ...cambios } : registro
    );
    guardarLocal(this.registros, this.userId);
    this._emit();
  }

  async eliminar(id) {
    this._validarAcceso();
    if (this.db) {
      await eliminarRegistroHoras(this.db, this.userId, id);
      return;
    }
    this.registros = this.registros.filter((registro) => registro.id !== id);
    guardarLocal(this.registros, this.userId);
    this._emit();
  }

  obtenerPorId(id) {
    return this.registros.find((registro) => registro.id === id) || null;
  }
}

export const horasExtrasStore = new HorasExtrasStore();
