import { fmtFecha, escapeHtml } from '../utils/helpers.js';

// --- referencias a elementos del DOM ---
const el = {
  form: document.getElementById('equipoForm'),
  formTitle: document.getElementById('formTitle'),
  noSerie: document.getElementById('noSerie'),
  marca: document.getElementById('marca'),
  marcaOtra: document.getElementById('marcaOtra'),
  ram: document.getElementById('ram'),
  ramOtra: document.getElementById('ramOtra'),
  procesador: document.getElementById('procesador'),
  ingenieroAsignado: document.getElementById('ingenieroAsignado'),
  estatus: document.getElementById('estatus'),
  comentario: document.getElementById('comentario'),
  formError: document.getElementById('formError'),
  btnSubmit: document.getElementById('btnSubmit'),
  btnCancelEdit: document.getElementById('btnCancelEdit'),

  btnSectionEquipos: document.getElementById('btnSectionEquipos'),
  btnSectionActividades: document.getElementById('btnSectionActividades'),
  equiposView: document.getElementById('equiposView'),
  actividadesView: document.getElementById('actividadesView'),
  actividadForm: document.getElementById('actividadForm'),
  actividadFormTitle: document.getElementById('actividadFormTitle'),
  actividadUsuario: document.getElementById('actividadUsuario'),
  actividadNombre: document.getElementById('actividadNombre'),
  actividadEstado: document.getElementById('actividadEstado'),
  actividadComentario: document.getElementById('actividadComentario'),
  actividadError: document.getElementById('actividadError'),
  btnGuardarActividad: document.getElementById('btnGuardarActividad'),
  btnCancelarActividad: document.getElementById('btnCancelarActividad'),
  actividadTotal: document.getElementById('actividadTotal'),
  actividadesTablaBody: document.getElementById('actividadesTablaBody'),
  actividadesEmptyState: document.getElementById('actividadesEmptyState'),

  buscador: document.getElementById('buscador'),
  totalCount: document.getElementById('totalCount'),
  tablaBody: document.getElementById('tablaBody'),
  emptyState: document.getElementById('emptyState'),

  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),

  btnExportJSON: document.getElementById('btnExportJSON'),
  btnExportExcel: document.getElementById('btnExportExcel'),
  btnGenerarCodigos: document.getElementById('btnGenerarCodigos'),

  btnSettings: document.getElementById('btnSettings'),
  settingsModal: document.getElementById('settingsModal'),
  firebaseConfigInput: document.getElementById('firebaseConfigInput'),
  collectionNameInput: document.getElementById('collectionNameInput'),
  settingsError: document.getElementById('settingsError'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  btnCloseSettings: document.getElementById('btnCloseSettings'),
  btnDisconnect: document.getElementById('btnDisconnect'),

  loginScreen: document.getElementById('loginScreen'),
  appContent: document.getElementById('appContent'),
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginError: document.getElementById('loginError'),
  btnLogin: document.getElementById('btnLogin'),
  btnLogout: document.getElementById('btnLogout'),

  btnScan: document.getElementById('btnScan'),
  scannerModal: document.getElementById('scannerModal'),
  scannerVideo: document.getElementById('scannerVideo'),
  scannerError: document.getElementById('scannerError')
};

let idEnEdicion = null;
let actividadEnEdicionId = null;

/**
 * Config de campos "select con opción Otra": evita duplicar la lógica de
 * mostrar/ocultar el input libre y de resolver el valor final. Agregar un
 * campo nuevo de este tipo en el futuro es solo una entrada más aquí,
 * no código repetido.
 */
const CAMPOS_CON_OTRA = [
  { campo: 'marca', selectId: 'marca', otraId: 'marcaOtra', fijas: ['HP', 'Lenovo', 'Dell'], label: 'la marca/modelo' },
  { campo: 'ram', selectId: 'ram', otraId: 'ramOtra', fijas: ['4 GB', '8 GB', '16 GB', '32 GB'], label: 'la RAM' }
];

/** Selects "simples" (obligatorios, sin opción Otra). */
const CAMPOS_SELECT_SIMPLE = ['ingenieroAsignado', 'estatus'];

const ESTILOS_ESTATUS = {
  Renovado: 'text-accent border-accent',
  Entregado: 'text-ink-dim border-line',
  'En resguardo': 'text-warn border-warn',
  'Por borrar': 'text-danger border-danger'
};

function claseEstatus(estatus) {
  return ESTILOS_ESTATUS[estatus] || 'text-ink-dim border-line';
}

// --- estado de conexión ---
export function setStatus(conectado, texto) {
  el.statusDot.classList.toggle('bg-accent', conectado);
  el.statusDot.classList.toggle('bg-ink-dim', !conectado);
  el.statusText.textContent = texto;
}

// --- selects "con Otra": mostrar/ocultar el input libre ---
CAMPOS_CON_OTRA.forEach(({ selectId, otraId }) => {
  el[selectId].addEventListener('change', (e) => {
    el[otraId].classList.toggle('hidden', e.target.value !== '__otra__');
  });
});

/** Resuelve los valores finales de los campos "con Otra" y valida cada uno. */
function resolverCamposConOtra() {
  const valores = {};
  for (const { campo, selectId, otraId, label } of CAMPOS_CON_OTRA) {
    const valorSelect = el[selectId].value;
    if (valorSelect === '__otra__') {
      const valorOtra = el[otraId].value.trim();
      if (!valorOtra) return { error: `Especifica ${label}.` };
      valores[campo] = valorOtra;
    } else {
      valores[campo] = valorSelect;
    }
  }
  return { valores };
}

/** Aplica el valor guardado de un campo "con Otra" al formulario (modo edición). */
function setCampoConOtra({ selectId, otraId, fijas }, valorGuardado) {
  if (fijas.includes(valorGuardado)) {
    el[selectId].value = valorGuardado;
    el[otraId].classList.add('hidden');
  } else {
    el[selectId].value = '__otra__';
    el[otraId].value = valorGuardado || '';
    el[otraId].classList.remove('hidden');
  }
}

// --- lectura y validación del formulario ---
function leerFormulario() {
  const noSerie = el.noSerie.value.trim();
  const procesador = el.procesador.value.trim();
  const comentario = el.comentario.value.trim();
  const ingenieroAsignado = el.ingenieroAsignado.value;
  const estatus = el.estatus.value;

  if (!noSerie) return { error: 'El número de serie es obligatorio.' };

  const { valores, error } = resolverCamposConOtra();
  if (error) return { error };
  if (!valores.marca || !valores.ram) return { error: 'Completa los campos obligatorios.' };
  if (!procesador) return { error: 'El procesador es obligatorio.' };
  if (!ingenieroAsignado) return { error: 'Selecciona un ingeniero asignado.' };
  if (!estatus) return { error: 'Selecciona un estatus.' };

  return { datos: { noSerie, ...valores, procesador, ingenieroAsignado, estatus, comentario } };
}

export function onSubmitForm(handler) {
  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.formError.textContent = '';
    const { datos, error } = leerFormulario();
    if (error) {
      el.formError.textContent = error;
      return;
    }
    try {
      await handler(datos, idEnEdicion);
      resetFormulario();
    } catch (err) {
      el.formError.textContent = err.message || 'No se pudo guardar el equipo.';
    }
  });
}

export function onCancelEdit(handler) {
  el.btnCancelEdit.addEventListener('click', () => {
    resetFormulario();
    handler();
  });
}

export function entrarModoEdicion(equipo) {
  idEnEdicion = equipo.id;
  el.formTitle.textContent = `Editando equipo · ${equipo.noSerie}`;
  el.noSerie.value = equipo.noSerie;
  el.procesador.value = equipo.procesador || '';
  el.comentario.value = equipo.comentario || '';
  el.ingenieroAsignado.value = equipo.ingenieroAsignado || '';
  el.estatus.value = equipo.estatus || '';

  CAMPOS_CON_OTRA.forEach((cfg) => setCampoConOtra(cfg, equipo[cfg.campo]));

  el.btnSubmit.textContent = 'Guardar cambios';
  el.btnCancelEdit.classList.remove('hidden');
  el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  render(window.__ultimaListaRenderizada || []);
}

export function resetFormulario() {
  idEnEdicion = null;
  el.form.reset();
  CAMPOS_CON_OTRA.forEach(({ otraId }) => el[otraId].classList.add('hidden'));
  el.formTitle.textContent = 'Nuevo equipo';
  el.btnSubmit.textContent = 'Agregar equipo';
  el.btnCancelEdit.classList.add('hidden');
}

export function onCambiarSeccion() {
  const mostrarActividades = (verActividades) => {
    el.equiposView.classList.toggle('hidden', verActividades);
    el.actividadesView.classList.toggle('hidden', !verActividades);
    el.btnSectionEquipos.classList.toggle('section-tab-active', !verActividades);
    el.btnSectionActividades.classList.toggle('section-tab-active', verActividades);
  };

  el.btnSectionEquipos.addEventListener('click', () => mostrarActividades(false));
  el.btnSectionActividades.addEventListener('click', () => mostrarActividades(true));
}

export function onSubmitActividad(handler) {
  el.actividadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.actividadError.textContent = '';

    const datos = {
      usuario: el.actividadUsuario.value.trim(),
      actividad: el.actividadNombre.value.trim(),
      estado: el.actividadEstado.value,
      comentario: el.actividadComentario.value.trim()
    };
    if (!datos.usuario || !datos.actividad) {
      el.actividadError.textContent = 'Completa el nombre o usuario y la actividad.';
      return;
    }

    el.btnGuardarActividad.disabled = true;
    el.btnGuardarActividad.textContent = 'Guardando...';
    try {
      await handler(datos, actividadEnEdicionId);
      resetActividadForm();
    } catch (error) {
      el.actividadError.textContent = error.message || 'No se pudo guardar la actividad.';
    } finally {
      el.btnGuardarActividad.disabled = false;
      el.btnGuardarActividad.textContent = actividadEnEdicionId ? 'Guardar cambios' : 'Registrar actividad';
    }
  });

  el.btnCancelarActividad.addEventListener('click', resetActividadForm);
}

export function renderActividades(actividades) {
  el.actividadTotal.textContent = actividades.length;
  el.actividadesEmptyState.classList.toggle('hidden', actividades.length > 0);
  el.actividadesTablaBody.innerHTML = actividades
    .map((registro) => `
      <tr class="fade-in border-b border-line hover:bg-panel-2">
        <td class="px-4 py-3 text-ink-dim font-mono text-xs whitespace-nowrap">${escapeHtml(fmtFecha(registro.fecha))}</td>
        <td class="px-4 py-3">${escapeHtml(registro.usuario)}</td>
        <td class="px-4 py-3">${escapeHtml(registro.actividad)}</td>
        <td class="px-4 py-3">
          <select data-actividad-estado data-id="${escapeHtml(registro.id)}" aria-label="Estado de ${escapeHtml(registro.actividad)}"
            class="actividad-status-select estado-${(registro.estado || 'Pendiente').toLowerCase().replace(/[^a-z]+/g, '-')}">
            <option value="Pendiente" ${(registro.estado || 'Pendiente') === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Atendido, etiquetado" ${registro.estado === 'Atendido, etiquetado' ? 'selected' : ''}>Atendido, etiquetado</option>
            <option value="Atendido sin etiquetar" ${registro.estado === 'Atendido sin etiquetar' ? 'selected' : ''}>Atendido sin etiquetar</option>
          </select>
        </td>
        <td class="px-4 py-3 text-ink-dim">${escapeHtml(registro.comentario) || '—'}</td>
        <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
          <button type="button" data-actividad-action="editar" data-id="${escapeHtml(registro.id)}"
            class="text-xs text-accent hover:underline">Editar</button>
          <button type="button" data-actividad-action="eliminar" data-id="${escapeHtml(registro.id)}"
            class="text-xs text-danger hover:underline">Eliminar</button>
        </td>
      </tr>`)
    .join('');
}

export function onCambiarEstadoActividad(handler) {
  el.actividadesTablaBody.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-actividad-estado]');
    if (select) {
      Promise.resolve(handler(select.dataset.id, select.value)).catch((error) => {
        mostrarErrorActividad(error.message || 'No se pudo actualizar el estado.');
      });
    }
  });
}

export function entrarModoEdicionActividad(actividad) {
  actividadEnEdicionId = actividad.id;
  el.actividadFormTitle.textContent = `Editando actividad · ${actividad.actividad}`;
  el.actividadUsuario.value = actividad.usuario || '';
  el.actividadNombre.value = actividad.actividad || '';
  el.actividadEstado.value = actividad.estado || 'Pendiente';
  el.actividadComentario.value = actividad.comentario || '';
  el.actividadError.textContent = '';
  el.btnGuardarActividad.textContent = 'Guardar cambios';
  el.btnCancelarActividad.classList.remove('hidden');
  el.actividadForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function salirModoEdicionActividad(id) {
  if (actividadEnEdicionId === id) resetActividadForm();
}

function resetActividadForm() {
  actividadEnEdicionId = null;
  el.actividadForm.reset();
  el.actividadError.textContent = '';
  el.actividadFormTitle.textContent = 'Registrar actividad';
  el.btnGuardarActividad.textContent = 'Registrar actividad';
  el.btnCancelarActividad.classList.add('hidden');
}

export function onAccionActividad(handler) {
  el.actividadesTablaBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-actividad-action]');
    if (button) handler(button.dataset.actividadAction, button.dataset.id);
  });
}

export function mostrarErrorActividad(mensaje) {
  el.actividadError.textContent = mensaje;
}

// --- búsqueda ---
export function onBuscar(handler) {
  el.buscador.addEventListener('input', () => handler(el.buscador.value));
}

// --- exportación ---
export function onExportJSON(handler) {
  el.btnExportJSON.addEventListener('click', handler);
}
export function onExportExcel(handler) {
  el.btnExportExcel.addEventListener('click', handler);
}

// --- tabla ---
export function render(equipos, totalGeneral) {
  window.__ultimaListaRenderizada = equipos;
  el.totalCount.textContent = totalGeneral ?? equipos.length;

  if (equipos.length === 0) {
    el.tablaBody.innerHTML = '';
    el.emptyState.classList.remove('hidden');
    return;
  }
  el.emptyState.classList.add('hidden');

  el.tablaBody.innerHTML = equipos
    .map(
      (eq) => `
    <tr class="fade-in border-b border-line hover:bg-panel-2 ${eq.id === idEnEdicion ? 'row-editing' : ''}">
      <td class="px-4 py-3 font-mono">${escapeHtml(eq.noSerie)}</td>
      <td class="px-4 py-3"><span class="badge-marca">${escapeHtml(eq.marca)}</span></td>
      <td class="px-4 py-3 font-mono">${escapeHtml(eq.ram)}</td>
      <td class="px-4 py-3 font-mono">${escapeHtml(eq.procesador || '—')}</td>
      <td class="px-4 py-3">${escapeHtml(eq.ingenieroAsignado || '—')}</td>
      <td class="px-4 py-3"><span class="badge-estatus ${claseEstatus(eq.estatus)}">${escapeHtml(eq.estatus || '—')}</span></td>
      <td class="px-4 py-3 text-ink-dim">${escapeHtml(eq.comentario) || '—'}</td>
      <td class="px-4 py-3 text-ink-dim font-mono text-xs">${fmtFecha(eq.fecha)}</td>
      <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
        <button data-action="editar" data-id="${eq.id}" class="text-xs text-accent hover:underline">Editar</button>
        <button data-action="eliminar" data-id="${eq.id}" class="text-xs text-danger hover:underline">Eliminar</button>
      </td>
    </tr>`
    )
    .join('');
}

export function onAccionTabla(handler) {
  el.tablaBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    handler(btn.dataset.action, btn.dataset.id);
  });
}

// --- modal de configuración ---
export function abrirModalSettings(configActual) {
  el.firebaseConfigInput.value = configActual ? JSON.stringify(configActual.config, null, 2) : '';
  el.collectionNameInput.value = configActual ? configActual.collectionName || 'equipos' : 'equipos';
  el.settingsError.textContent = '';
  el.settingsModal.showModal();
}
export function cerrarModalSettings() {
  el.settingsModal.close();
}
export function onOpenSettings(handler) {
  el.btnSettings.addEventListener('click', handler);
}
export function onCloseSettings(handler) {
  el.btnCloseSettings.addEventListener('click', handler);
}
export function onSaveSettings(handler) {
  el.btnSaveSettings.addEventListener('click', () => {
    const raw = el.firebaseConfigInput.value.trim();
    const collectionName = el.collectionNameInput.value.trim() || 'equipos';
    if (!raw) {
      el.settingsError.textContent = 'Pega la configuración de Firebase.';
      return;
    }
    let config;
    try {
      config = JSON.parse(raw);
    } catch (e) {
      el.settingsError.textContent = 'JSON inválido.';
      return;
    }
    handler(config, collectionName);
  });
}
export function mostrarErrorSettings(msg) {
  el.settingsError.textContent = msg;
}
export function onDisconnect(handler) {
  el.btnDisconnect.addEventListener('click', handler);
}

// --- login / logout ---
export function mostrarLogin() {
  el.loginScreen.classList.remove('hidden');
  el.appContent.classList.add('hidden');
  el.btnLogout.classList.add('hidden');
}

export function mostrarApp(conLogout) {
  el.loginScreen.classList.add('hidden');
  el.appContent.classList.remove('hidden');
  el.btnLogout.classList.toggle('hidden', !conLogout);
}

export function onSubmitLogin(handler) {
  el.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.loginError.textContent = '';
    el.btnLogin.disabled = true;
    el.btnLogin.textContent = 'Entrando...';
    try {
      await handler(el.loginEmail.value.trim(), el.loginPassword.value);
    } finally {
      el.btnLogin.disabled = false;
      el.btnLogin.textContent = 'Entrar';
    }
  });
}

export function mostrarErrorLogin(msg) {
  el.loginError.textContent = msg;
}

export function onLogout(handler) {
  el.btnLogout.addEventListener('click', handler);
}

// --- escaneo de código de barras ---
export function abrirEscaner() {
  el.scannerError.textContent = '';
  el.scannerModal.showModal();
}

export function cerrarEscaner() {
  el.scannerModal.close();
}

export function getVideoElement() {
  return el.scannerVideo;
}

export function setBuscadorValor(valor) {
  el.buscador.value = valor;
}

export function mostrarErrorEscaner(msg) {
  el.scannerError.textContent = msg;
}

export function onAbrirEscaner(handler) {
  el.btnScan.addEventListener('click', handler);
}

/** El evento nativo 'close' del <dialog> cubre: botón Cancelar, tecla Esc y clic en el fondo. */
export function onEscanerCerrado(handler) {
  el.scannerModal.addEventListener('close', handler);
}

// --- generar códigos de barras ---
export function onGenerarCodigos(handler) {
  el.btnGenerarCodigos.addEventListener('click', handler);
}

export function getUltimaListaRenderizada() {
  return window.__ultimaListaRenderizada || [];
}
