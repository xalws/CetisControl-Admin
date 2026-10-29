/* Vista: Estado de pago */
import { db } from "../firebase.js";
import {
  collection, doc, updateDoc, query, orderBy, limit,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, norm } from "../utils.js";
import { cache, listen, gruposUnicos } from "../state.js";
import { logCambio, historialHTML } from "../historial.js";

function filtrosHTML(f) {
  const grupos = gruposUnicos();
  return `
    <select data-f="grupo"><option value="">Grupo: Todos</option>${grupos.map((g) => `<option ${f.grupo === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>
    <select data-f="estado"><option value="">Estado: Todos</option><option value="1" ${f.estado === "1" ? "selected" : ""}>Activo</option><option value="0" ${f.estado === "0" ? "selected" : ""}>Inactivo</option></select>`;
}

function filtrarAlumnos(f) {
  const q = norm(f.q);
  return cache.alumnos.filter((a) => {
    const pagado = a.pagado !== false;
    return (!q || norm(a.nombre).includes(q) || norm(a.matricula).includes(q))
      && (!f.grupo || a.grupo === f.grupo)
      && (!f.estado || (f.estado === "1") === pagado);
  });
}

function filaPagoHTML(a) {
  const pagado = a.pagado !== false;
  return `<tr>
    <td class="mono">${esc(a.matricula)}</td><td class="name">${esc(a.nombre)}</td><td>${esc(a.grupo)}</td>
    <td><span class="switch-wrap"><label class="switch"><input type="checkbox" data-id="${esc(a.id)}" ${pagado ? "checked" : ""} /><span class="slider"></span></label>
    <span class="${pagado ? "txt-on" : "txt-off"}">${pagado ? "Activo" : "Inactivo"}</span></span></td></tr>`;
}

async function cambiarPago(id, pagado) {
  const a = cache.alumnos.find((x) => x.id === id);
  await updateDoc(doc(db, "alumnos", a.id), { pagado });
  await logCambio("pago", `${a.nombre} ${pagado ? "volvió a activo" : "pasó a inactivo"}`, pagado);
}

export function vistaPagos() {
  const f = { q: "", grupo: "", estado: "" };

  const render = () => {
    $("#filters").innerHTML = filtrosHTML(f);
    document.querySelectorAll("#filters select").forEach((s) => (s.onchange = () => { f[s.dataset.f] = s.value; render(); }));

    const rows = filtrarAlumnos(f);
    $("#tbody").innerHTML = rows.length
      ? rows.map(filaPagoHTML).join("")
      : `<tr><td colspan="4" class="empty">Sin resultados</td></tr>`;

    document.querySelectorAll("#tbody input[type=checkbox]").forEach((cb) => {
      cb.onchange = () => cambiarPago(cb.dataset.id, cb.checked);
    });
    $("#hist").innerHTML = historialHTML("pago");
  };

  $("#q").oninput = (e) => { f.q = e.target.value; render(); };
  listen("alumnos", query(collection(db, "alumnos"), orderBy("nombre")), render);
  listen("cambios", query(collection(db, "cambios"), orderBy("fecha", "desc"), limit(40)), () => ($("#hist").innerHTML = historialHTML("pago")));
}
