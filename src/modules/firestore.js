import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

let unsubscribe = null;

export function escucharEquipos(db, collectionName, onCambio, onError) {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, collectionName), orderBy('fecha', 'desc'));
  unsubscribe = onSnapshot(
    q,
    (snap) => {
      const equipos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onCambio(equipos);
    },
    (err) => {
      console.error('Error de Firestore:', err);
      if (onError) onError(err);
    }
  );
  return unsubscribe;
}

export function detenerEscucha() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export async function guardarEquipo(db, collectionName, equipo) {
  await setDoc(doc(db, collectionName, equipo.id), equipo);
}

export async function actualizarEquipo(db, collectionName, id, cambios) {
  await updateDoc(doc(db, collectionName, id), cambios);
}

export async function eliminarEquipo(db, collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}
