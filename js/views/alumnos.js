/* Vista: Alumnos */
import { db } from "../firebase.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, norm, toast } from "../utils.js";
import { ESTATUS, ESTATUS_COLOR, TURNOS } from "../constants.js";
import { cache, listen, gruposUnicos } from "../state.js";
import { openModal, closeModal } from "../modal.js";
import { modalImportarAlumnos } from "./alumnosImportar.js";

function filtrosHTML(f) {
  const grupos = gruposUnicos();
  return `
    <select data-f="grupo"><option value="">Grupo: Todos</option>${grupos.map((g) => `<option ${f.grupo === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>
    <select data-f="turno"><option value="">Turno: Todos</option>${TURNOS.map((t) => `<option ${f.turno === t ? "selected" : ""}>${t}</option>`).join("")}</select>
    <select data-f="estado"><option value="">Estado: Todos</option><option value="Activo" ${f.estado === "Activo" ? "selected" : ""}>Activo</option><option value="Inactivo" ${f.estado === "Inactivo" ? "selected" : ""}>Inactivo por pago</option></select>
    <select data-f="estatus"><option value="">Estatus: Todos</option>${ESTATUS.map((s) => `<option ${f.estatus === s ? "selected" : ""}>${s}</option>`).join("")}</select>`;
}

function filtrarAlumnos(f) {
  const q = norm(f.q);
  return cache.alumnos.filter((a) => {
    const pagado = a.pagado !== false;
    return (
      (!q || norm(a.nombre).includes(q) || norm(a.matricula).includes(q)) &&
      (!f.grupo || a.grupo === f.grupo) &&
      (!f.turno || a.turno === f.turno) &&
      (!f.estado || (f.estado === "Activo") === pagado) &&
      (!f.estatus || (a.estatus || "Sin incidencias") === f.estatus)
    );
  });
}

function filaAlumnoHTML(a) {
  const pagado = a.pagado !== false;
  const est = a.estatus || "Sin incidencias";
  const dentro = (a.ubicacion || "Fuera") === "Dentro";
  return `<tr>
    <td class="mono">${esc(a.matricula)}</td>
    <td class="name">${esc(a.nombre)}</td>
    <td>${esc(a.grupo)}</td><td>${esc(a.turno)}</td>
    <td><span class="pill ${pagado ? "green" : "red"}">${pagado ? "Activo" : "Inactivo por pago"}</span></td>
    <td><span class="pill ${ESTATUS_COLOR[est] || "green"}">${esc(est)}</span></td>
    <td class="${dentro ? "loc-dentro" : "loc-fuera"}">${dentro ? "Dentro" : "Fuera"}</td>
  </tr>`;
}

export function vistaAlumnos() {
  const f = { q: "", grupo: "", turno: "", estado: "", estatus: "" };

  const render = () => {
    $("#filters").innerHTML = filtrosHTML(f);
    document.querySelectorAll("#filters select").forEach(
      (s) =>
        (s.onchange = () => {
          f[s.dataset.f] = s.value;
          render();
        }),
    );

    const rows = filtrarAlumnos(f);
    $("#tbody").innerHTML = rows.length
      ? rows.map(filaAlumnoHTML).join("")
      : `<tr><td colspan="7" class="empty">Sin resultados</td></tr>`;
    $("#count").textContent = `Mostrando ${rows.length} alumnos`;
  };

  $("#q").oninput = (e) => {
    f.q = e.target.value;
    render();
  };
  $("#btn-add").onclick = () => modalAlumno();
  $("#btn-import").onclick = () => modalImportarAlumnos();
  listen(
    "alumnos",
    query(collection(db, "alumnos"), orderBy("nombre")),
    render,
  );
}

/* ---------- Agregar alumno ---------- */
export function modalAlumno() {
  openModal(`
    <h3>Agregar alumno</h3>
    <p class="sub">Se guarda en la base de datos de CetisAsiste.</p>
    <form id="f-alumno">
      <div class="form-grid">
        <div class="field"><label>Matrícula *</label><input name="matricula" required /></div>
        <div class="field"><label>Grupo *</label><input name="grupo" required placeholder="102" /></div>
        <div class="field full"><label>Nombre completo *</label><input name="nombre" required /></div>
        <div class="field"><label>Turno *</label><select name="turno">${TURNOS.map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label>Correo institucional</label><input name="correo" type="email" /></div>
      </div>
      <p class="error" id="f-err" hidden></p>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Cancelar</button>
        <button class="btn btn-primary">Guardar</button>
      </div>
    </form>`);

  $("#f-alumno").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.matricula = d.matricula.trim();
    const ref = doc(db, "alumnos", d.matricula);
    if ((await getDoc(ref)).exists()) {
      $("#f-err").textContent = "Ya existe un alumno con esa matrícula";
      $("#f-err").hidden = false;
      return;
    }
    await setDoc(ref, {
      ...d,
      nombre: d.nombre.trim(),
      pagado: true,
      estatus: "Sin incidencias",
      ubicacion: "Fuera",
      creado: serverTimestamp(),
    });
    closeModal();
    toast("Alumno agregado");
  };
}
