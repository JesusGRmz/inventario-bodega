import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const LS_FIREBASE_KEY = 'equipos_firebase_config_v1';

// Config por defecto: así la app conecta sola en cualquier dispositivo,
// sin necesitar pegar nada en el modal ⚙️. El apiKey de Firebase no es
// secreto (está pensado para vivir en el navegador); lo que protege los
// datos son las reglas de Firestore + Authentication, no ocultar esto.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDBBBepZ3Y6_VLnUOvy1UJUA57u8PDfBFs',
  authDomain: 'inventario-bodega-4f147.firebaseapp.com',
  projectId: 'inventario-bodega-4f147',
  storageBucket: 'inventario-bodega-4f147.firebasestorage.app',
  messagingSenderId: '955556171433',
  appId: '1:955556171433:web:9bd48411483161144323b8'
};
const DEFAULT_COLLECTION = 'equipos';

let app = null;
let db = null;
let auth = null;

/**
 * Config "de fábrica" opcional vía variables de entorno (.env).
 * Útil si siempre usas el mismo proyecto de Firebase en este equipo/deploy.
 * Si no defines las variables, simplemente no se usa.
 */
function configDesdeEnv() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  return cfg.apiKey && cfg.projectId ? cfg : null;
}

export function cargarConfigGuardada() {
  try {
    const raw = localStorage.getItem(LS_FIREBASE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignora JSON corrupto */
  }
  const envCfg = configDesdeEnv();
  if (envCfg) return { config: envCfg, collectionName: DEFAULT_COLLECTION };
  // nadie configuró nada manualmente: usa la config por defecto del proyecto
  return { config: DEFAULT_FIREBASE_CONFIG, collectionName: DEFAULT_COLLECTION };
}

export function guardarConfig(config, collectionName) {
  localStorage.setItem(
    LS_FIREBASE_KEY,
    JSON.stringify({ config, collectionName: collectionName || 'equipos' })
  );
}

export function borrarConfigGuardada() {
  localStorage.removeItem(LS_FIREBASE_KEY);
}

export function initFirebase(config) {
  try {
    // si ya había una app inicializada (p. ej. al reconectar), la limpiamos primero
    for (const existing of getApps()) {
      deleteApp(existing);
    }
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    return { db, auth };
  } catch (e) {
    console.error('Error al inicializar Firebase:', e);
    app = null;
    db = null;
    auth = null;
    return null;
  }
}

export function getDb() {
  return db;
}

export function getAuthInstance() {
  return auth;
}
