function setAdminMensaje(texto, tipo = "info") {
  const el = document.getElementById("adminMensaje");
  if (!el) return;
  el.textContent = texto;
  el.dataset.tipo = tipo;
  el.classList.toggle("is-error", tipo === "error");
}

function apiBase() {
  try {
    if (typeof resolveApiBase === "function") return resolveApiBase();
  } catch {
    // ignore
  }
  return "/api";
}

function apiUrl(pathname) {
  const base = String(apiBase() || "/api").replace(/\/+$/, "");
  const path = String(pathname || "").replace(/^\/+/, "");
  return `${base}/${path}`;
}

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
