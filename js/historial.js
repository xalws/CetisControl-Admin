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
      <div class="hist-ico ${c.activo ? "on" : "off"}"><svg class="icono-menu2" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48">
	<path d="M0 0h48v48H0z" fill="none" />
	<g fill="none" stroke="#f0f0f0" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
		<path d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4S4 12.954 4 24s8.954 20 20 20" />
		<path d="M33.542 27c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7v6m19.084-18v6c-1.274-4.057-5.064-7-9.542-7s-8.268 2.943-9.542 7" />
	</g>
</svg>
</div>
      <div><b>${esc(c.texto)}</b><small>${esc(fmtFecha(c.fecha))} · ${esc(c.por)}</small></div>
    </div>`).join("");
}
