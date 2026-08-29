import './style.css';
import { equiposStore } from './modules/equipos.js';
import { exportarJSON, exportarExcel } from './modules/export.js';
import {
  cargarConfigGuardada,
  guardarConfig,
  borrarConfigGuardada,
  initFirebase
} from './firebase/config.js';
import { login, logout, escucharSesion, mensajeErrorLogin } from './firebase/auth.js';
import { crearVigilanteInactividad } from './utils/inactivity.js';
import * as ui from './modules/ui.js';

const MINUTOS_INACTIVIDAD = 15;
const vigilanteInactividad = crearVigilanteInactividad(MINUTOS_INACTIVIDAD, () => {
  if (authInstance) logout(authInstance);
});

let terminoBusqueda = '';

// --- cada vez que cambian los equipos (local o Firestore), repintar tabla ---
equiposStore.onChange((equipos) => {
  const filtrados = equiposStore.buscar(terminoBusqueda);
  ui.render(filtrados, equipos.length);
});

// --- formulario: alta y edición ---
ui.onSubmitForm(async (datos, idEnEdicion) => {
  if (equiposStore.existeNoSerie(datos.noSerie, idEnEdicion)) {
    throw new Error(`Ya existe un equipo registrado con el No. de serie "${datos.noSerie}".`);
  }
  if (idEnEdicion) {
    await equiposStore.editar(idEnEdicion, datos);
  } else {
    await equiposStore.agregar(datos);
  }
  // si no hay Firestore conectado, onChange no se dispara solo desde afuera:
  // forzamos refresco por si el store cambió de forma síncrona (modo local)
  refrescar();
});

ui.onCancelEdit(() => {});

// --- búsqueda ---
ui.onBuscar((termino) => {
  terminoBusqueda = termino;
  refrescar();
});

// --- escaneo de código de barras: alimenta el mismo buscador de siempre ---
// el módulo se carga dinámicamente (import lazy) para no cargar la librería
// de escaneo en el arranque normal de la app, solo cuando alguien la usa
let detenerEscanerActivo = () => {};

ui.onAbrirEscaner(async () => {
  ui.abrirEscaner();
  try {
    const { iniciarEscaner, detenerEscaner } = await import('./modules/scanner.js');
    detenerEscanerActivo = detenerEscaner;
    await iniciarEscaner(ui.getVideoElement(), (textoDecodificado) => {
      terminoBusqueda = textoDecodificado;
      ui.setBuscadorValor(textoDecodificado);
      refrescar();
      ui.cerrarEscaner(); // dispara el evento 'close' -> detenerEscaner()

      // si el código coincide con un solo equipo, entra directo a editarlo
      const resultados = equiposStore.buscar(textoDecodificado);
      if (resultados.length === 1) ui.entrarModoEdicion(resultados[0]);
    });
  } catch (e) {
    ui.mostrarErrorEscaner('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
  }
});

ui.onEscanerCerrado(() => detenerEscanerActivo());

// --- acciones de tabla: editar / eliminar ---
ui.onAccionTabla(async (accion, id) => {
  if (accion === 'editar') {
    const equipo = equiposStore.obtenerPorId(id);
    if (equipo) ui.entrarModoEdicion(equipo);
  } else if (accion === 'eliminar') {
    const equipo = equiposStore.obtenerPorId(id);
    const confirmado = confirm(`¿Eliminar el equipo "${equipo?.noSerie}" del registro?`);
    if (!confirmado) return;
    await equiposStore.eliminar(id);
    refrescar();
  }
});

// --- exportación ---
ui.onExportJSON(() => exportarJSON(equiposStore.equipos));
ui.onExportExcel(() => exportarExcel(equiposStore.equipos));

// --- configuración de Firestore (modal) ---
ui.onOpenSettings(() => ui.abrirModalSettings(cargarConfigGuardada()));
ui.onCloseSettings(() => ui.cerrarModalSettings());

ui.onSaveSettings((config, collectionName) => {
  const resultado = initFirebase(config);
  if (!resultado) {
    ui.mostrarErrorSettings('No se pudo conectar. Revisa la configuración.');
    return;
  }
  guardarConfig(config, collectionName);
  ui.cerrarModalSettings();
  conectarConAuth(resultado, collectionName);
});

ui.onDisconnect(() => {
  borrarConfigGuardada();
  equiposStore.desconectarFirestore();
  ui.setStatus(false, 'Solo local');
  ui.cerrarModalSettings();
  ui.mostrarApp(false); // sin Firestore no se exige login
  refrescar();
});

// --- login / logout ---
ui.onSubmitLogin(async (email, password) => {
  try {
    await login(authInstance, email, password);
    // escucharSesion() se encarga de mostrar la app al detectar el login
  } catch (e) {
    ui.mostrarErrorLogin(mensajeErrorLogin(e.code));
  }
});

ui.onLogout(async () => {
  await logout(authInstance);
});

let authInstance = null;

function conectarConAuth({ db, auth }, collectionName) {
  authInstance = auth;
  escucharSesion(auth, (usuario) => {
    if (usuario) {
      ui.mostrarApp(true);
      equiposStore.conectarFirestore(db, collectionName);
      ui.setStatus(true, 'Sincronizado con Firestore');
      vigilanteInactividad.iniciar();
    } else {
      equiposStore.desconectarFirestore();
      ui.mostrarLogin();
      vigilanteInactividad.detener();
    }
  });
}

function refrescar() {
  const filtrados = equiposStore.buscar(terminoBusqueda);
  ui.render(filtrados, equiposStore.equipos.length);
}

// --- arranque ---
(function init() {
  refrescar();
  const cfg = cargarConfigGuardada();
  if (cfg && cfg.config) {
    const resultado = initFirebase(cfg.config);
    if (resultado) {
      conectarConAuth(resultado, cfg.collectionName);
      return;
    }
  }
  ui.mostrarApp(false); // sin Firestore configurado: modo local directo, sin login
  ui.setStatus(false, 'Solo local');
})();
