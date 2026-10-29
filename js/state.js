/* Estado global, caché de datos y listeners de Firestore */
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { toast } from "./utils.js";

// Objeto para poder reasignar desde otros módulos
export const state = { currentUser: null, currentProfile: null };

export const cache = { alumnos: [], practicantes: [], cambios: [], horarios: [], registros: [] };

let unsubs = [];

export function clearListeners() {
  unsubs.forEach((u) => u());
  unsubs = [];
}

export function listen(name, q, onData) {
  const un = onSnapshot(q, (snap) => {
    cache[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData();
  }, (err) => { console.error(err); toast("Error de permisos o conexión"); });
  unsubs.push(un);
}

export function gruposUnicos() {
  return [...new Set(cache.alumnos.map((a) => a.grupo).filter(Boolean))].sort();
}
