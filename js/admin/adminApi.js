/**
 * `adminApi.js`
 * Helpers compartidos para páginas del panel de administración.
 *
 * Incluye:
 * - `setAdminMensaje()`: mostrar mensajes de estado en la UI (cargando, ok, error).
 * - `apiBase()` / `apiUrl()`: construir URLs del backend.
 * - `fetchJson()`: consumir endpoints que responden JSON.
 *
 * Nota: este archivo se carga antes que los scripts de cada pantalla (ej. `consultas.js`)
 * para que las funciones queden disponibles de forma global.
 */

/**
 * Muestra un mensaje en el elemento del admin.
 */
function setAdminMensaje(texto, tipo = "info") {
  const el = document.getElementById("adminMensaje");
  if (!el) return;
  el.textContent = texto;
  el.dataset.tipo = tipo;
  el.classList.toggle("is-error", tipo === "error");

  const msg = String(texto || "").trim();
  if (!msg) return;

  const state = (window.__adminToastState ||= { lastKey: "", lastAt: 0 });
  const key = `${tipo}:${msg}`;
  const now = Date.now();
  if (state.lastKey === key && now - state.lastAt < 800) return;
  state.lastKey = key;
  state.lastAt = now;

  // Si hay SweetAlert2 disponible (vía `login.js`), úsalo para mejorar la UI
  if (tipo === "error" && typeof window.showAlert === "function") {
    window.showAlert("Error", msg, "error");
    return;
  }

  if (typeof window.notifyToast === "function") {
    const icon = tipo === "ok" ? "success" : tipo === "error" ? "error" : "info";
    window.notifyToast(msg, icon);
  }
}

/**
 * Retorna la base de API a usar para las pantallas admin.
 */
function apiBase() {
  try {
    if (typeof resolveApiBase === "function") return resolveApiBase();
  } catch {
    // ignore
  }
  return "/api";
}

/**
 * Construye una URL completa para un endpoint a partir de un pathname.
 */
function apiUrl(pathname) {
  const base = String(apiBase() || "/api").replace(/\/+$/, "");
  const path = String(pathname || "").replace(/^\/+/, "");
  return `${base}/${path}`;
}

/**
 * Hace una petición HTTP con `fetch` y devuelve el cuerpo parseado como JSON.
 */
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.message || `Error HTTP ${res.status}`);
  }

  if (!data) {
    throw new Error("El servidor respondió, pero no devolvió JSON.");
  }

  return data;
}
