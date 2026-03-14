function setAdminMensaje(texto, tipo = "info") {
  const el = document.getElementById("adminMensaje");
  if (!el) return;
  el.textContent = texto;
  el.dataset.tipo = tipo;
}

function getApiBaseForAdmin() {
  const { origin, hostname, port } = window.location;

  // Si el frontend está servido por el mismo backend (recomendado)
  if (origin && origin !== "null" && port === "4020") return origin.replace(/\/+$/, "");

  // Si estás usando Live Server u otro puerto local, apunta al backend local
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (origin && origin !== "null" && isLocalHost && port && port !== "4020") {
    const host = hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    return `http://${host}:4020`;
  }

  // Si existe un API_BASE global (definido en ../login/java.js), úsalo
  // Nota: puede incluir /api, y el backend soporta ambas rutas.
  try {
    // eslint-disable-next-line no-undef
    if (typeof API_BASE === "string" && API_BASE.trim()) {
      // eslint-disable-next-line no-undef
      return API_BASE.replace(/\/+$/, "");
    }
  } catch {
    // ignore
  }

  // Último fallback: mismo origen si existe, si no localhost
  if (origin && origin !== "null") return origin.replace(/\/+$/, "");
  return "http://localhost:4020";
}

async function crearProfesor(payload) {
  const base = getApiBaseForAdmin();
  const url = `${base}/teachers`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.message || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCrearProfesor");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAdminMensaje("Creando profesor...", "info");

    const payload = {
      identification: document.getElementById("profesorIdentification")?.value?.trim(),
      typeIdentification: document.getElementById("profesorTypeIdentification")?.value?.trim(),
      name: document.getElementById("profesorName")?.value?.trim(),
      lastname: document.getElementById("profesorLastname")?.value?.trim(),
      professorship: document.getElementById("profesorProfessorship")?.value?.trim(),
      user: document.getElementById("profesorUser")?.value?.trim(),
      password: document.getElementById("profesorPassword")?.value,
      status: true,
    };

    try {
      const created = await crearProfesor(payload);
      setAdminMensaje(
        `Profesor creado: ${created?.name || ""} ${created?.lastname || ""}`.trim(),
        "ok"
      );
      form.reset();
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo crear el profesor.", "error");
      console.error(err);
    }
  });
});

