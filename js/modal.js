/* Modal genérico */
import { $ } from "./utils.js";

export function openModal(html, size = "") {
  const m = $("#modal");
  m.className = "modal " + size;
  m.innerHTML = html;
  $("#modal-backdrop").hidden = false;
  m.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeModal));
}

export function closeModal() {
  $("#modal-backdrop").hidden = true;
  $("#modal").innerHTML = "";
}

$("#modal-backdrop").addEventListener("mousedown", (e) => {
  if (e.target.id === "modal-backdrop") closeModal();
});
