/* Historial de cambios */
import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { esc, fmtFecha } from "./utils.js";
import { state, cache } from "./state.js";

export async function logCambio(tipo, texto, activo) {
  await addDoc(collection(db, "cambios"), {
    tipo, texto, activo,
    por: state.currentProfile?.nombre || state.currentUser?.email || "",
    fecha: serverTimestamp(),
  });
}

export function historialHTML(tipo) {
  const items = cache.cambios.filter((c) => c.tipo === tipo).slice(0, 6);
  if (!items.length) return `<p class="sub">Aún no hay cambios.</p>`;
  return items.map((c) => `
    <div class="hist-item">
      <div class="hist-ico ${c.activo ? "on" : "off"}">▣</div>
      <div><b>${esc(c.texto)}</b><small>${esc(fmtFecha(c.fecha))} · ${esc(c.por)}</small></div>
    </div>`).join("");
}
