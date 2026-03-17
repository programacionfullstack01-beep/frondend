
/**
 * Normaliza texto para insertarlo en HTML mediante `innerHTML`.
 * Convierte caracteres especiales (`<`, `>`, `&`, comillas) a entidades HTML.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Escribe HTML de filas dentro de un `<tbody>` por id.
 */
function setTbodyHtml(tbodyId, rowsHtml) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = rowsHtml || "";
}

/**
 * Ids de secciones disponibles en la página (también usados como hash).
 */
const CONSULTA_SECTIONS = ["cursos", "grupos", "estudiantes", "profesores"];

/**
 * Lee el hash de la URL y retorna un modo válido.
 */
function getConsultaModeFromHash() {
  const hash = (window.location.hash || "").replace("#", "").trim().toLowerCase();
  return CONSULTA_SECTIONS.includes(hash) ? hash : "";
}

/**
 * Muestra/oculta secciones dependiendo del modo.
 */
function applyConsultaVisibility(mode) {
  for (const sectionId of CONSULTA_SECTIONS) {
    const section = document.getElementById(sectionId);
    if (!section) continue;
    section.style.display = mode && sectionId !== mode ? "none" : "block";
  }
}

/**
 * Carga datos desde el backend y pinta las tablas.
 */
async function cargarConsultas(mode = "") {
  const title =
    mode === "cursos" ? "cursos" :
      mode === "grupos" ? "grupos" :
        mode === "estudiantes" ? "estudiantes" :
          mode === "profesores" ? "profesores" :
            "consultas";

  setAdminMensaje(`Cargando ${title}...`, "info");

  try {
    const loadAll = !mode;

    const [courses, groups, students, teachers] = await Promise.all([
      loadAll || mode === "cursos" ? fetchJson(apiUrl("courses")) : Promise.resolve([]),
      loadAll || mode === "grupos" ? fetchJson(apiUrl("groups")) : Promise.resolve([]),
      loadAll || mode === "estudiantes" ? fetchJson(apiUrl("students")) : Promise.resolve([]),
      loadAll || mode === "profesores" ? fetchJson(apiUrl("teachers")) : Promise.resolve([]),
    ]);

    setTbodyHtml(
      "tablaCursos",
      (courses || [])
        .map(
          (c) => `
          <tr>
            <td>${escapeHtml(c?.name || "")}</td>
            <td>${escapeHtml(c?.description || "")}</td>
          </tr>`
        )
        .join("")
    );

    setTbodyHtml(
      "tablaGrupos",
      (groups || [])
        .map((g) => `
          <tr>
            <td>${escapeHtml(g?.name || "")}</td>
            <td>${escapeHtml(g?.description || "")}</td>
          </tr>`)
        .join("")
    );

    setTbodyHtml(
      "tablaEstudiantes",
      (students || [])
        .map((s) => {
          const fullName = `${s?.name || ""} ${s?.lastname || ""}`.trim();
          const groupsCount = Array.isArray(s?.groups) ? s.groups.length : 0;
          return `
          <tr>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(s?.user || "")}</td>
            <td>${escapeHtml(s?.identification || "")}</td>
            <td>${escapeHtml(String(s?.status ?? ""))}</td>
            <td>${escapeHtml(String(s?.password ?? ""))}</td>
            <td>${escapeHtml(String(groupsCount))}</td>
          </tr>`;
        })
        .join("")
    );

    setTbodyHtml(
      "tablaProfesores",
      (teachers || [])
        .map((t) => {
          const fullName = `${t?.name || ""} ${t?.lastname || ""}`.trim();
          return `
          <tr>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(t?.user || "")}</td>
            <td>${escapeHtml(t?.identification || "")}</td>
            <td>${escapeHtml(t?.professorship || "")}</td>
            <td>${escapeHtml(String(t?.status ?? ""))}</td>
            <td>${escapeHtml(String(t?.password ?? ""))}</td>
          </tr>`;
        })
        .join("")
    );

    setAdminMensaje("", "info");
  } catch (err) {
    console.error(err);
    setAdminMensaje(err?.message || "No se pudieron cargar las consultas.", "error");
  }
}

/**
 * Maneja recarga manual 
 */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnRecargarConsultas");
  const applyModeAndLoad = () => {
    const mode = getConsultaModeFromHash();
    applyConsultaVisibility(mode);
    cargarConsultas(mode);

    if (mode) {
      const section = document.getElementById(mode);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (btn) btn.addEventListener("click", applyModeAndLoad);
  window.addEventListener("hashchange", applyModeAndLoad);

  applyModeAndLoad();
});
