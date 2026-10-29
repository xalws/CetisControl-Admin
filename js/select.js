/* Select personalizado.
   Reemplaza visualmente cada <select> nativo por un dropdown propio (el menú se posiciona
   junto al botón y no se corta dentro de modales). El <select> original queda oculto y
   sincronizado, así que .value, FormData y los eventos "change" siguen funcionando igual. */

let abierto = null; // { wrap, btn, menu }

function cerrar() {
  if (!abierto) return;
  abierto.menu.remove();
  abierto.wrap.classList.remove("open");
  abierto.btn.setAttribute("aria-expanded", "false");
  abierto = null;
}

function mejorar(sel) {
  if (sel.dataset.dd) return;
  sel.dataset.dd = "1";
  sel.style.display = "none";

  const wrap = document.createElement("div");
  wrap.className = "dd";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dd-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `<span class="dd-label"></span>
    <svg class="dd-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l5 5 5-5"/></svg>`;
  const label = btn.querySelector(".dd-label");
  wrap.append(btn);
  sel.after(wrap);

  const pintar = () => {
    const o = sel.options[sel.selectedIndex];
    label.textContent = o ? o.textContent : "";
    btn.classList.toggle("vacio", !sel.value);
  };
  pintar();
  sel.addEventListener("change", pintar);

  const elegir = (i) => {
    cerrar();
    if (i === sel.selectedIndex) return;
    sel.selectedIndex = i;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const abrir = () => {
    cerrar();
    const menu = document.createElement("ul");
    menu.className = "dd-menu";
    menu.setAttribute("role", "listbox");
    [...sel.options].forEach((o, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.textContent = o.textContent;
      if (i === sel.selectedIndex) li.classList.add("sel");
      li.onclick = () => elegir(i);
      menu.append(li);
    });
    document.body.append(menu);

    // posición: debajo del botón; si no cabe, arriba
    const r = btn.getBoundingClientRect();
    menu.style.minWidth = r.width + "px";
    const h = menu.offsetHeight;
    const abajo = window.innerHeight - r.bottom;
    const arriba = abajo < h + 12 && r.top > abajo;
    menu.style.top = (arriba ? Math.max(8, r.top - h - 6) : r.bottom + 6) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + "px";

    wrap.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    abierto = { wrap, btn, menu };
    menu.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
  };

  btn.addEventListener("click", () => (abierto?.btn === btn ? cerrar() : abrir()));

  btn.addEventListener("keydown", (e) => {
    const items = abierto?.btn === btn ? [...abierto.menu.children] : null;
    if (e.key === "Escape" || e.key === "Tab") return cerrar();
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) e.preventDefault(); else return;
    if (!items) return abrir();
    let i = items.findIndex((li) => li.classList.contains("hl"));
    if (i < 0) i = items.findIndex((li) => li.classList.contains("sel"));
    if (e.key === "Enter" || e.key === " ") return elegir(i < 0 ? 0 : i);
    i = e.key === "ArrowDown" ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
    items.forEach((li) => li.classList.remove("hl"));
    items[i].classList.add("hl");
    items[i].scrollIntoView({ block: "nearest" });
  });
}

function mejorarEn(nodo) {
  if (nodo.nodeType !== 1) return;
  if (nodo.matches("select")) mejorar(nodo);
  nodo.querySelectorAll("select").forEach(mejorar);
}

export function initSelects() {
  mejorarEn(document.body);

  // Mejora automáticamente cualquier <select> que se agregue al DOM (vistas, modales, filas nuevas)
  new MutationObserver((muts) => {
    if (abierto && !abierto.btn.isConnected) cerrar();
    muts.forEach((m) => m.addedNodes.forEach(mejorarEn));
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener("mousedown", (e) => { if (!e.target.closest(".dd-menu, .dd-btn")) cerrar(); });
  window.addEventListener("scroll", (e) => { if (!e.target.closest?.(".dd-menu")) cerrar(); }, true);
  window.addEventListener("resize", cerrar);
}
