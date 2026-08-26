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
  comentario: document.getElementById('comentario'),
  formError: document.getElementById('formError'),
  btnSubmit: document.getElementById('btnSubmit'),
  btnCancelEdit: document.getElementById('btnCancelEdit'),

  buscador: document.getElementById('buscador'),
  totalCount: document.getElementById('totalCount'),
  tablaBody: document.getElementById('tablaBody'),
  emptyState: document.getElementById('emptyState'),

  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),

  btnExportJSON: document.getElementById('btnExportJSON'),
  btnExportExcel: document.getElementById('btnExportExcel'),

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
  btnLogout: document.getElementById('btnLogout')
};

let idEnEdicion = null;

// --- estado de conexión ---
export function setStatus(conectado, texto) {
  el.statusDot.classList.toggle('bg-accent', conectado);
  el.statusDot.classList.toggle('bg-ink-dim', !conectado);
  el.statusText.textContent = texto;
}

// --- selects "otra" ---
el.marca.addEventListener('change', (e) => {
  el.marcaOtra.classList.toggle('hidden', e.target.value !== '__otra__');
});
el.ram.addEventListener('change', (e) => {
  el.ramOtra.classList.toggle('hidden', e.target.value !== '__otra__');
});

// --- lectura y validación del formulario ---
function leerFormulario() {
  const noSerie = el.noSerie.value.trim();
  let marca = el.marca.value;
  const marcaOtra = el.marcaOtra.value.trim();
  let ram = el.ram.value;
  const ramOtra = el.ramOtra.value.trim();
  const comentario = el.comentario.value.trim();

  if (!noSerie) return { error: 'El número de serie es obligatorio.' };
  if (marca === '__otra__') {
    if (!marcaOtra) return { error: 'Especifica la marca/modelo.' };
    marca = marcaOtra;
  }
  if (ram === '__otra__') {
    if (!ramOtra) return { error: 'Especifica la RAM.' };
    ram = ramOtra;
  }
  if (!marca || !ram) return { error: 'Completa los campos obligatorios.' };

  return { datos: { noSerie, marca, ram, comentario } };
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
    await handler(datos, idEnEdicion);
    resetFormulario();
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
  el.comentario.value = equipo.comentario || '';

  const marcasFijas = ['HP', 'Lenovo', 'Dell', 'ThinkSmart'];
  if (marcasFijas.includes(equipo.marca)) {
    el.marca.value = equipo.marca;
    el.marcaOtra.classList.add('hidden');
  } else {
    el.marca.value = '__otra__';
    el.marcaOtra.value = equipo.marca;
    el.marcaOtra.classList.remove('hidden');
  }

  const ramsFijas = ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'];
  if (ramsFijas.includes(equipo.ram)) {
    el.ram.value = equipo.ram;
    el.ramOtra.classList.add('hidden');
  } else {
    el.ram.value = '__otra__';
    el.ramOtra.value = equipo.ram;
    el.ramOtra.classList.remove('hidden');
  }

  el.btnSubmit.textContent = 'Guardar cambios';
  el.btnCancelEdit.classList.remove('hidden');
  el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  render(window.__ultimaListaRenderizada || []);
}

export function resetFormulario() {
  idEnEdicion = null;
  el.form.reset();
  el.marcaOtra.classList.add('hidden');
  el.ramOtra.classList.add('hidden');
  el.formTitle.textContent = 'Nuevo equipo';
  el.btnSubmit.textContent = 'Agregar equipo';
  el.btnCancelEdit.classList.add('hidden');
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
      <td class="px-4 py-3 text-ink-dim">${escapeHtml(eq.comentario) || '—'}</td>
      <td class="px-4 py-3 font-mono text-xs text-ink-dim">${fmtFecha(eq.fecha)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <button data-action="editar" data-id="${eq.id}" class="text-xs text-accent hover:underline mr-3">Editar</button>
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