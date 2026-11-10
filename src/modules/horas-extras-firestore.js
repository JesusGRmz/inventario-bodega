import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from 'firebase/firestore';

function referenciaRegistros(db, userId) {
  return collection(db, 'usuarios', userId, 'horasExtras');
}

function referenciaRegistro(db, userId, id) {
  return doc(db, 'usuarios', userId, 'horasExtras', id);
}

export function escucharHorasExtras(db, userId, onCambio, onError) {
  const q = query(referenciaRegistros(db, userId), orderBy('fecha', 'desc'));
  return onSnapshot(
    q,
    (snap) => onCambio(snap.docs.map((documento) => ({ id: documento.id, ...documento.data() }))),
    onError
  );
}

export async function guardarRegistroHoras(db, userId, registro) {
  await setDoc(referenciaRegistro(db, userId, registro.id), registro);
}

export async function actualizarRegistroHoras(db, userId, id, cambios) {
  await updateDoc(referenciaRegistro(db, userId, id), cambios);
}

export async function eliminarRegistroHoras(db, userId, id) {
  await deleteDoc(referenciaRegistro(db, userId, id));
}
