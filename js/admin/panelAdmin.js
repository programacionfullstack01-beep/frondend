
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "../index.html";
}

function actualizarBienvenida() {
  const bienvenida = document.getElementById("bienvenida");
  if (!bienvenida) return;

  const usuarioActivoRaw = localStorage.getItem("usuarioActivo");
  if (!usuarioActivoRaw) {
    bienvenida.textContent = "";
    return;
  }

  try {
    const usuarioActivo = JSON.parse(usuarioActivoRaw);
    const nombre =
      usuarioActivo?.nombreCompleto || usuarioActivo?.usuario || "Usuario";
    bienvenida.textContent = `Bienvenido, ${nombre}`;
  } catch {
    bienvenida.textContent = "";
  }
}

function wireNavegacionCrearEstudiante() {
  const selectors = [
    "#crearEstudianteModal",
    "#btnCrearEstudiante",
    "#crearEstudianteCard",
    "[data-nav='crear-estudiante']",
  ];

  const destino = "./crearEstudiante.html";

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;
    el.addEventListener("click", (e) => {
      if (!(el instanceof HTMLAnchorElement)) e.preventDefault();
      window.location.href = destino;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  actualizarBienvenida();
  wireNavegacionCrearEstudiante();
});
