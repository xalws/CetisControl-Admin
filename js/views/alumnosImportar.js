/* Importar alumnos desde Excel/CSV (usa SheetJS cargado globalmente como XLSX en index.html) */
import { db } from "../firebase.js";
import { doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, esc, norm, toast } from "../utils.js";
import { TURNOS } from "../constants.js";
import { openModal, closeModal } from "../modal.js";

const COLUMNAS = ["matricula", "nombre", "grupo", "turno", "correo"];

function descargarPlantilla() {
  const ws = XLSX.utils.aoa_to_sheet([
    COLUMNAS,
    ["00000000000001", "Ana Torres Vega", "102", "Matutino", "ana@correo.com"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
  XLSX.writeFile(wb, "plantilla_alumnos.xlsx");
}

/* Convierte las filas crudas del Excel en filas validadas */
function validarFilas(raw) {
  const vistos = new Set();
  return raw.map((r, i) => {
    // normaliza encabezados
    const o = {};
    Object.keys(r).forEach((k) => (o[norm(k).trim()] = String(r[k]).trim()));
    const fila = { n: i + 2, matricula: o.matricula, nombre: o.nombre, grupo: o.grupo, turno: o.turno, correo: o.correo || "" };
    const t = TURNOS.find((x) => norm(x) === norm(fila.turno));
    if (t) fila.turno = t;
    const errs = [];
    if (!fila.matricula) errs.push("falta matrícula");
    if (!fila.nombre) errs.push("falta nombre");
    if (!fila.grupo) errs.push("falta grupo");
    if (!t) errs.push("turno inválido");
    if (fila.matricula && vistos.has(fila.matricula)) errs.push("matrícula repetida");
    if (fila.matricula.includes("/")) errs.push("matrícula con '/'");
    vistos.add(fila.matricula);
    fila.errs = errs;
    return fila;
  });
}

function previewHTML(filas, nValidos, nMalos) {
  return `
    <p class="summary"><span class="ok">${nValidos} válidos</span> · <span class="ko">${nMalos} con error</span></p>
    <div class="preview"><table>
      <thead><tr><th>Fila</th><th>Matrícula</th><th>Nombre</th><th>Grupo</th><th>Turno</th><th></th></tr></thead>
      <tbody>${filas.slice(0, 200).map((f) => `<tr class="${f.errs.length ? "bad" : ""}">
        <td>${f.n}</td><td>${esc(f.matricula)}</td><td>${esc(f.nombre)}</td><td>${esc(f.grupo)}</td><td>${esc(f.turno)}</td>
        <td>${esc(f.errs.join(", "))}</td></tr>`).join("")}</tbody></table></div>`;
}

async function guardarAlumnos(validos) {
  for (let i = 0; i < validos.length; i += 400) {
    const batch = writeBatch(db);
    validos.slice(i, i + 400).forEach((a) => {
      const { n, errs, ...datos } = a;
      // merge: no pisa pagado/estatus/ubicación de alumnos que ya existían
      batch.set(doc(db, "alumnos", a.matricula), datos, { merge: true });
    });
    await batch.commit();
  }
}

export function modalImportarAlumnos() {
  let validos = [];
  openModal(`
    <h3>Importar alumnos desde Excel</h3>
    <p class="sub">Columnas: <b>${COLUMNAS.join(", ")}</b>. Obligatorias: matricula, nombre, grupo, turno.
      <button type="button" class="linkish" id="plantilla">Descargar plantilla</button></p>
    <div class="drop">Selecciona un archivo .xlsx o .csv<br /><input type="file" id="file" accept=".xlsx,.xls,.csv" /></div>
    <div id="preview"></div>
    <div class="modal-actions">
      <button class="btn" data-close>Cancelar</button>
      <button class="btn btn-primary" id="do-import" disabled>Importar</button>
    </div>`);
  $("#plantilla").onclick = descargarPlantilla;

  $("#file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer());
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });

    const filas = validarFilas(raw);
    validos = filas.filter((f) => !f.errs.length);
    const malos = filas.filter((f) => f.errs.length);
    $("#preview").innerHTML = previewHTML(filas, validos.length, malos.length);
    $("#do-import").disabled = !validos.length;
  };

  $("#do-import").onclick = async () => {
    const btn = $("#do-import");
    btn.disabled = true; btn.textContent = "Importando…";
    try {
      await guardarAlumnos(validos);
      closeModal();
      toast(`${validos.length} alumnos importados`);
    } catch (ex) {
      console.error(ex);
      btn.disabled = false; btn.textContent = "Importar";
      toast("Error al importar (revisa permisos)");
    }
  };
}
