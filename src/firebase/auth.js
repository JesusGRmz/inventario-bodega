import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export async function login(auth, email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout(auth) {
  return signOut(auth);
}

export function escucharSesion(auth, callback) {
  return onAuthStateChanged(auth, callback);
}

export function mensajeErrorLogin(codigoError) {
  const mensajes = {
    'auth/invalid-email': 'Correo inválido.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
    'auth/network-request-failed': 'Sin conexión a internet.'
  };
  return mensajes[codigoError] || 'No se pudo iniciar sesión.';
}
