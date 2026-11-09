import { collection, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

function referenciaActividades(db, uid) {
  return collection(db, 'usuarios', uid, 'actividades');
}

function referenciaActividad(db, uid, id) {
  return doc(db, 'usuarios', uid, 'actividades', id);
}

export function escucharActividades(db, uid, onCambio, onError) {
  const q = query(referenciaActividades(db, uid), orderBy('fecha', 'desc'));
  return onSnapshot(
    q,
    (snap) => onCambio(snap.docs.map((documento) => ({ id: documento.id, ...documento.data() }))),
    (error) => {
      console.error('Error de Firestore en actividades:', error);
      if (onError) onError(error);
    }
  );
}

export async function guardarActividad(db, uid, actividad) {
  await setDoc(referenciaActividad(db, uid, actividad.id), actividad);
}

export async function actualizarEstadoActividad(db, uid, id, estado) {
  await updateDoc(referenciaActividad(db, uid, id), { estado });
}

export async function actualizarActividad(db, uid, id, cambios) {
  await updateDoc(referenciaActividad(db, uid, id), cambios);
}

export async function eliminarActividad(db, uid, id) {
  await deleteDoc(referenciaActividad(db, uid, id));
}