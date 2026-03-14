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

  try {
    if (typeof API_BASE === "string" && API_BASE.trim()) {
      return API_BASE.replace(/\/+$/, "");
    }
  } catch {
  }

  if (origin && origin !== "null") return origin.replace(/\/+$/, "");
  return "http://localhost:4020";
}

async function crearProfesor(payload) {
  const base = getApiBaseForAdmin();
  const baseTrimmed = base.replace(/\/+$/, "");

  const candidates = [
    "/teachers",
    "/api/teachers",
    `${baseTrimmed}/teachers`,
    `${baseTrimmed}/api/teachers`,
  ];

  if (/\/api$/.test(baseTrimmed)) {
    candidates.push(`${baseTrimmed.replace(/\/api$/, "")}/teachers`);
  }

  const errors = [];

  for (const url of candidates) {
    try {
      console.log("[crearProfesor] POST", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      let data = null;
      if (isJson) {
        try {
          data = await res.json();
        } catch {
        }
      }

      if (!res.ok) {
        const msg = data?.message || `Error HTTP ${res.status}`;
        throw new Error(msg);
      }

      if (!isJson || !data) {
        throw new Error("El servidor respondió, pero no devolvió JSON (posible redirect/URL incorrecta).");
      }

      return data;
    } catch (err) {
      errors.push(`${url}: ${err?.message || err}`);
    }
  }

  const last = errors[errors.length - 1] || "Error desconocido";
  const hint =
    last.includes("Failed to fetch") || last.includes("NetworkError")
      ? " (Revisa CORS/URL/servidor encendido)"
      : "";
  throw new Error(`${last}${hint}`);
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
