/* Router por hash: carga el HTML de cada pestaña desde /views y ejecuta su lógica */
import { $ } from "./utils.js";
import { state, clearListeners } from "./state.js";
import { vistaAlumnos } from "./views/alumnos.js";
import { vistaPagos } from "./views/pagos.js";
import { vistaPracticantes } from "./views/practicantes.js";
import { vistaHorarios } from "./views/horarios.js";
import { vistaRegistros } from "./views/registros.js";

const routes = {
  alumnos: vistaAlumnos,
  pagos: vistaPagos,
  practicantes: vistaPracticantes,
  horarios: vistaHorarios,
  registros: vistaRegistros,
};

const htmlCache = {};
let navId = 0;

async function cargarHTML(name) {
  if (!htmlCache[name]) {
    const res = await fetch(`views/${name}.html`);
    if (!res.ok) throw new Error(`No se pudo cargar views/${name}.html`);
    htmlCache[name] = await res.text();
  }
  return htmlCache[name];
}

export async function router() {
  if (!state.currentUser) return;
  const name = (location.hash || "#alumnos").slice(1);
  const view = routes[name] ? name : "alumnos";
  const id = ++navId;

  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === view));
  clearListeners();

  const html = await cargarHTML(view);
  if (id !== navId) return; // el usuario cambió de pestaña mientras cargaba
  $("#main").innerHTML = html;
  routes[view]();
}
