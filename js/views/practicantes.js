/* Vista: Practicantes */
import { db } from "../firebase.js";
import {
  collection, doc, setDoc, updateDoc, query, orderBy, limit, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, norm, toast } from "../utils.js";
import { cache, listen } from "../state.js";
import { openModal, closeModal } from "../modal.js";
import { logCambio, historialHTML } from "../historial.js";

function filtrosHTML(f) {
  return `<select data-f="estado"><option value="">Estado: Todos</option><option value="1" ${f.estado === "1" ? "selected" : ""}>Activo</option><option value="0" ${f.estado === "0" ? "selected" : ""}>Inactivo</option></select>`;
}

function filtrarPracticantes(f) {
  const q = norm(f.q);
  return cache.practicantes.filter((p) => {
    const act = p.activo !== false;
    return (!q || norm(p.nombre).includes(q) || norm(p.folio).includes(q)) && (!f.estado || (f.estado === "1") === act);
  });
}

function filaPracticanteHTML(p) {
  const act = p.activo !== false;
  return `<tr><td class="mono">${esc(p.folio)}</td><td class="name">${esc(p.nombre)}</td><td>${esc(p.ingreso || "")}</td>
    <td><span class="switch-wrap"><label class="switch"><input type="checkbox" data-id="${esc(p.id)}" ${act ? "checked" : ""} /><span class="slider"></span></label>
    <span class="${act ? "txt-on" : "txt-off"}">${act ? "Activo" : "Inactivo"}</span></span></td></tr>`;
}

async function cambiarActivo(id, activo) {
  const p = cache.practicantes.find((x) => x.id === id);
  await updateDoc(doc(db, "practicantes", p.id), { activo });
  await logCambio("practicante", `${p.nombre} ${activo ? "volvió a activo" : "terminó y pasó a inactivo"}`, activo);
}

export function vistaPracticantes() {
  const f = { q: "", estado: "" };

  const render = () => {
    $("#filters").innerHTML = filtrosHTML(f);
    $("#filters select").onchange = (e) => { f.estado = e.target.value; render(); };

    const rows = filtrarPracticantes(f);
    $("#tbody").innerHTML = rows.length
      ? rows.map(filaPracticanteHTML).join("")
      : `<tr><td colspan="4" class="empty">Sin practicantes</td></tr>`;

    document.querySelectorAll("#tbody input[type=checkbox]").forEach((cb) => {
      cb.onchange = () => cambiarActivo(cb.dataset.id, cb.checked);
    });
    $("#hist").innerHTML = historialHTML("practicante");
  };

  $("#q").oninput = (e) => { f.q = e.target.value; render(); };
  $("#btn-add").onclick = modalPracticante;
  listen("practicantes", query(collection(db, "practicantes"), orderBy("folio")), render);
  listen("cambios", query(collection(db, "cambios"), orderBy("fecha", "desc"), limit(40)), () => ($("#hist").innerHTML = historialHTML("practicante")));
}

export function modalPracticante() {
  const siguiente = "P-" + String(cache.practicantes.length + 1).padStart(4, "0");
  openModal(`
    <h3>Agregar practicante</h3>
    <p class="sub">Se crea activo. Desactívalo al terminar sus prácticas.</p>
    <form id="f-prac">
      <div class="form-grid">
        <div class="field"><label>Folio *</label><input name="folio" required value="${siguiente}" /></div>
        <div class="field"><label>Correo</label><input name="correo" type="email" /></div>
        <div class="field full"><label>Nombre completo *</label><input name="nombre" required /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Cancelar</button>
        <button class="btn btn-primary">Guardar</button>
      </div>
    </form>`);

  $("#f-prac").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const ingreso = new Date().toLocaleDateString("es-MX", { month: "short", year: "numeric" }).replace(".", "");
    await setDoc(doc(db, "practicantes", d.folio.trim()), { ...d, nombre: d.nombre.trim(), folio: d.folio.trim(), ingreso, activo: true, creado: serverTimestamp() });
    await logCambio("practicante", `${d.nombre.trim()}: perfil creado y activo`, true);
    closeModal();
    toast("Practicante agregado");
  };
}
