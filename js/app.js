/* Punto de entrada */
import { initAuth } from "./auth.js";
import { router } from "./router.js";
import { initSelects } from "./select.js";

initSelects();
window.addEventListener("hashchange", router);
initAuth();
