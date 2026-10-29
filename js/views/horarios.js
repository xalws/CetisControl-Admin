/* Vista: Horarios por grupo (materias y horas, mostrado como calendario semanal) */
import { db } from "../firebase.js";
import { collection, doc, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, norm, toast } from "../utils.js";
import { TURNOS, MATERIAS } from "../constants.js";
import { cache, listen } from "../state.js";
import { openModal, closeModal } from "../modal.js";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const FILAS_NUEVAS = 7;

let grupoActual = "";

const buscarHorario = (grupo) => cache.horarios.find((h) => norm(h.id) === norm(grupo.trim()));

/* ---------- Calendario (solo lectura) ---------- */
function franjas(bloques) {
  const mapa = new Map();
  bloques.forEach((b) => mapa.set(`${b.inicio}-${b.fin}`, { inicio: b.inicio, fin: b.fin }));
  return [...mapa.values()].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin));
}

function tablaHorarioHTML(bloques) {
  const filas = franjas(bloques).map((fr) => {
    const celdas = DIAS.map((_, i) => {
      const b = bloques.find((x) => x.dia === i + 1 && x.inicio === fr.inicio && x.fin === fr.fin);
      return b ? `<td class="celda">${esc(b.materia)}</td>` : `<td class="celda vacia"></td>`;
    }).join("");
    return `<tr><th class="hora">${esc(fr.inicio)} – ${esc(fr.fin)}</th>${celdas}</tr>`;
  }).join("");

  return `<div class="table-card"><table class="hor-table">
    <thead><tr><th>Hora</th>${DIAS.map((d) => `<th>${d}</th>`).join("")}</tr></thead>
    <tbody>${filas}</tbody></table></div>`;
}

function renderResultado() {
  const cont = $("#horario-result");
  const grupos = $("#grupos-list");
  if (grupos) grupos.innerHTML = cache.horarios.filter((h) => h.bloques?.length).map((h) => `<option value="${esc(h.id)}"></option>`).join("");

  if (!grupoActual) {
    cont.innerHTML = `<div class="table-card"><p class="empty">Ingresa un grupo para ver su horario</p></div>`;
    return;
  }

  const h = buscarHorario(grupoActual);
  if (!h?.bloques?.length) {
    cont.innerHTML = `<div class="table-card"><p class="empty">No hay horario registrado para el grupo <b>${esc(grupoActual)}</b>.<br />
      <button class="btn btn-primary" id="btn-crear" style="margin-top:14px">Crear horario del grupo ${esc(grupoActual)}</button></p></div>`;
    $("#btn-crear").onclick = () => modalHorario({ grupo: grupoActual });
    return;
  }

  cont.innerHTML = `
    <div class="horario-head">
      <div><h2>Grupo ${esc(h.grupo)}</h2><span class="muted">${esc(h.turno || "")}</span></div>
      <button class="btn" id="btn-editar">Editar horario</button>
    </div>
    ${tablaHorarioHTML(h.bloques)}`;
  $("#btn-editar").onclick = () => modalHorario(h);
}

export function vistaHorarios() {
  grupoActual = "";

  $("#form-buscar").onsubmit = (e) => {
    e.preventDefault();
    grupoActual = $("#grupo-q").value.trim();
    renderResultado();
  };
  $("#btn-add").onclick = () => modalHorario();

  renderResultado();
  listen("horarios", query(collection(db, "horarios"), orderBy("grupo")), renderResultado);
}

/* ---------- Editor del horario ---------- */
function selectMateriaHTML(dia, actual = "") {
  // si el horario tenía una materia que ya no está en el catálogo, se conserva como opción
  const opciones = actual && !MATERIAS.includes(actual) ? [...MATERIAS, actual] : MATERIAS;
  return `<select data-dia="${dia}">
    <option value="">— Libre —</option>
    ${opciones.map((m) => `<option ${m === actual ? "selected" : ""}>${esc(m)}</option>`).join("")}
  </select>`;
}

function filaEditHTML(fr = { inicio: "", fin: "", materias: [] }) {
  return `<tr>
    <td><div class="tiempo"><input type="time" name="inicio" value="${esc(fr.inicio)}" /><span>–</span><input type="time" name="fin" value="${esc(fr.fin)}" /></div></td>
    ${DIAS.map((_, i) => `<td>${selectMateriaHTML(i, fr.materias[i])}</td>`).join("")}
    <td><button type="button" class="linkish" data-del title="Quitar fila">✕</button></td>
  </tr>`;
}

/* Convierte los bloques guardados en filas (una por franja horaria) */
function bloquesAFilas(bloques = []) {
  return franjas(bloques).map((fr) => {
    const materias = DIAS.map((_, i) => bloques.find((b) => b.dia === i + 1 && b.inicio === fr.inicio && b.fin === fr.fin)?.materia || "");
    return { ...fr, materias };
  });
}

function leerBloques() {
  const bloques = [];
  for (const tr of document.querySelectorAll("#hor-body tr")) {
    const inicio = tr.querySelector("[name=inicio]").value;
    const fin = tr.querySelector("[name=fin]").value;
    const materias = [...tr.querySelectorAll("[data-dia]")].map((s) => s.value);
    if (!materias.some(Boolean)) continue; // fila sin materias
    if (!inicio || !fin || inicio >= fin) throw new Error("Revisa las horas: cada fila con materias necesita inicio y fin válidos");
    materias.forEach((materia, i) => materia && bloques.push({ dia: i + 1, inicio, fin, materia }));
  }
  if (!bloques.length) throw new Error("Agrega al menos una materia");
  return bloques;
}

export function modalHorario(h = {}) {
  // Si el grupo ya existe en la base (p. ej. con el formato anterior de entrada/salida), se reutiliza
  if (h.grupo && !h.bloques) {
    const previo = buscarHorario(h.grupo);
    if (previo) h = { ...previo, ...h };
  }
  const esEdicion = !!h.bloques?.length;
  const filas = esEdicion ? bloquesAFilas(h.bloques) : Array.from({ length: FILAS_NUEVAS }, () => undefined);

  openModal(`
    <h3>${esEdicion ? "Editar" : "Agregar"} horario</h3>
    <p class="sub">Una fila por hora de clase; elige la materia en el día que corresponda.</p>
    <form id="f-hor">
      <div class="form-grid">
        <div class="field"><label>Grupo *</label><input name="grupo" required value="${esc(h.grupo)}" ${h.grupo ? "readonly" : ""} /></div>
        <div class="field"><label>Turno *</label><select name="turno">${TURNOS.map((t) => `<option ${h.turno === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      </div>
      <div class="preview hor-edit-wrap">
        <table class="hor-edit">
          <thead><tr><th>Hora (inicio – fin)</th>${DIAS.map((d) => `<th>${d}</th>`).join("")}<th></th></tr></thead>
          <tbody id="hor-body">${filas.map(filaEditHTML).join("")}</tbody>
        </table>
      </div>
      <button type="button" class="linkish" id="add-fila" style="margin-top:10px">+ Agregar hora</button>
      <p class="error" id="f-err" hidden></p>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Cancelar</button>
        <button class="btn btn-primary">Guardar</button>
      </div>
    </form>`, "wide");

  const body = $("#hor-body");
  $("#add-fila").onclick = () => body.insertAdjacentHTML("beforeend", filaEditHTML());
  body.addEventListener("click", (e) => { if (e.target.closest("[data-del]")) e.target.closest("tr").remove(); });

  const mostrarError = (msg) => { $("#f-err").textContent = msg; $("#f-err").hidden = false; };

  $("#f-hor").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const grupo = d.grupo.trim();
    if (grupo.includes("/")) return mostrarError("El grupo no puede contener '/'");
    // Solo se bloquea si se escribió a mano un grupo que ya tiene horario armado
    if (!h.grupo && buscarHorario(grupo)?.bloques?.length) {
      return mostrarError(`El grupo ${grupo} ya tiene horario. Búscalo y usa "Editar horario".`);
    }

    let bloques;
    try { bloques = leerBloques(); } catch (ex) { return mostrarError(ex.message); }

    // entrada/salida se calculan solas para que el escáner siga funcionando
    const entrada = bloques.reduce((m, b) => (b.inicio < m ? b.inicio : m), bloques[0].inicio);
    const salida = bloques.reduce((m, b) => (b.fin > m ? b.fin : m), bloques[0].fin);

    await setDoc(doc(db, "horarios", grupo), { grupo, turno: d.turno, bloques, entrada, salida }, { merge: true });
    closeModal();
    grupoActual = grupo;
    $("#grupo-q").value = grupo;
    renderResultado();
    toast("Horario guardado");
  };
}
