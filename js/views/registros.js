/* Vista: Entradas y salidas (tiempo real) */
import { db } from "../firebase.js";
import { collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, fmtFecha } from "../utils.js";
import { cache, listen } from "../state.js";

function filaRegistroHTML(r) {
  return `<tr>
    <td>${esc(fmtFecha(r.fecha))}</td><td class="mono">${esc(r.matricula)}</td><td class="name">${esc(r.nombre)}</td>
    <td><span class="pill ${r.tipo === "entrada" ? "green" : "amber"}">${r.tipo === "entrada" ? "Entrada" : "Salida"}</span></td></tr>`;
}

export function vistaRegistros() {
  listen("registros", query(collection(db, "registros"), orderBy("fecha", "desc"), limit(100)), () => {
    $("#tbody").innerHTML = cache.registros.length
      ? cache.registros.map(filaRegistroHTML).join("")
      : `<tr><td colspan="4" class="empty">Sin registros</td></tr>`;
  });
}
