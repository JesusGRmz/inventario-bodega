import { collection, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export function escucharActividades(db, onCambio, onError) {
  const q = query(collection(db, 'actividades'), orderBy('fecha', 'desc'));
  return onSnapshot(
    q,
    (snap) => onCambio(snap.docs.map((documento) => ({ id: documento.id, ...documento.data() }))),
    (error) => {
      console.error('Error de Firestore en actividades:', error);
      if (onError) onError(error);
    }
  );
}

export async function guardarActividad(db, actividad) {
  await setDoc(doc(db, 'actividades', actividad.id), actividad);
}

export async function actualizarEstadoActividad(db, id, estado) {
  await updateDoc(doc(db, 'actividades', id), { estado });
}

export async function actualizarActividad(db, id, cambios) {
  await updateDoc(doc(db, 'actividades', id), cambios);
}

export async function eliminarActividad(db, id) {
  await deleteDoc(doc(db, 'actividades', id));
}