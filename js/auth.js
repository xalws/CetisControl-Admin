/* Login, sesión y control de acceso por rol */
import { auth, db, DOMINIO_USUARIOS } from "./firebase.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, toast } from "./utils.js";
import { ROLES_PERMITIDOS } from "./constants.js";
import { state, clearListeners } from "./state.js";
import { openModal, closeModal } from "./modal.js";
import { router } from "./router.js";

function usuarioACorreo(u) {
  u = u.trim();
  return u.includes("@") ? u : `${u}@${DOMINIO_USUARIOS}`;
}

function initTogglePassword() {
  $("#toggle-pass").addEventListener("click", () => {
    const i = $("#login-pass");
    i.type = i.type === "password" ? "text" : "password";
  });
}

function initLoginForm() {
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#login-error");
    err.hidden = true;
    try {
      await signInWithEmailAndPassword(auth, usuarioACorreo($("#login-user").value), $("#login-pass").value);
    } catch (ex) {
      err.textContent = "Usuario o contraseña incorrectos";
      err.hidden = false;
    }
  });
}

function initForgotPassword() {
  $("#forgot").addEventListener("click", async (e) => {
    e.preventDefault();
    const u = $("#login-user").value;
    if (!u) return toast("Escribe tu usuario primero");
    try {
      await sendPasswordResetEmail(auth, usuarioACorreo(u));
      toast("Te enviamos un correo para restablecer la contraseña");
    } catch { toast("No se pudo enviar el correo"); }
  });
}

function initLogout() {
  $("#btn-logout").addEventListener("click", () => {
    openModal(`
      <div class="modal-ico">⇦</div>
      <h3>¿Cerrar sesión?</h3>
      <p class="sub">Tendrás que volver a iniciar sesión para usar CetisAsiste.</p>
      <div class="modal-actions">
        <button class="btn" data-close>Cancelar</button>
        <button class="btn btn-primary" id="confirm-logout">Cerrar sesión</button>
      </div>`, "small");
    $("#confirm-logout").onclick = async () => { closeModal(); await signOut(auth); };
  });
}

function mostrarLogin() {
  state.currentUser = null;
  state.currentProfile = null;
  clearListeners();
  $("#app-view").hidden = true;
  $("#login-view").hidden = false;
}

async function mostrarApp(user) {
  // Solo pasan quienes tengan perfil con rol permitido en /usuarios/{uid}
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  const rol = snap.data()?.rol;
  if (!snap.exists() || !ROLES_PERMITIDOS.includes(rol)) {
    await signOut(auth);
    $("#login-error").textContent = "Tu cuenta no tiene acceso al panel administrativo";
    $("#login-error").hidden = false;
    return;
  }
  state.currentUser = user;
  state.currentProfile = snap.data();
  $("#user-name").textContent = state.currentProfile.nombre || user.email;
  $("#login-view").hidden = true;
  $("#app-view").hidden = false;
  router();
}

export function initAuth() {
  initTogglePassword();
  initLoginForm();
  initForgotPassword();
  initLogout();
  onAuthStateChanged(auth, (user) => (user ? mostrarApp(user) : mostrarLogin()));
}
