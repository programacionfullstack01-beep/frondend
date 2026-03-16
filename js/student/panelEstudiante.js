function getUsuarioActivo() {
  try {
    return JSON.parse(localStorage.getItem("usuarioActivo") || "null");
  } catch {
    return null;
  }
}

function ensureEstudianteSession() {
  const usuario = getUsuarioActivo();
  if (!usuario || usuario.rol !== "estudiante") {
    window.location.href = "../index.html";
    return null;
  }
  if (!usuario.id) {
    alert("Tu sesión no trae el id del estudiante. Cierra sesión e inicia de nuevo.");
    return null;
  }
  return usuario;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let cachedAssignments = [];
let cachedNotes = [];

function normalizeText(value) {
  return String(value ?? "").toLowerCase().trim();
}

function getTeacherLabel(teacher) {
  const name = `${teacher?.name || ""} ${teacher?.lastname || ""}`.trim();
  return name || teacher?.user || "";
}

function buildNotesByAssignmentId(notes) {
  const map = new Map();
  for (const n of notes || []) {
    const assignmentId = n?.group?._id || n?.group;
    if (!assignmentId) continue;
    const key = String(assignmentId);
    const arr = map.get(key) || [];
    arr.push(n);
    map.set(key, arr);
  }
  return map;
}

function formatGrade(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "";
}

function renderNotasDetalle(notes) {
  const normalized = Array.isArray(notes) ? notes.slice() : [];
  if (normalized.length === 0) return `<span>Sin notas</span>`;

  normalized.sort((a, b) => {
    const an = normalizeText(a?.activityName);
    const bn = normalizeText(b?.activityName);
    if (an < bn) return -1;
    if (an > bn) return 1;
    const aid = String(a?._id || "");
    const bid = String(b?._id || "");
    return aid.localeCompare(bid);
  });

  const grades = normalized
    .map((n) => Number(n?.grade))
    .filter((x) => Number.isFinite(x));
  const avg = grades.length ? (grades.reduce((x, y) => x + y, 0) / grades.length) : null;

  const promedioHtml =
    avg === null
      ? ""
      : `<div style="margin-bottom:6px;"><strong>Promedio:</strong> ${escapeHtml(avg.toFixed(2))}</div>`;

  const itemsHtml = normalized
    .map((n) => {
      const activity = escapeHtml(n?.activityName || "Actividad");
      const grade = formatGrade(n?.grade);
      return `<li>${activity}: ${escapeHtml(grade || "—")}</li>`;
    })
    .join("");

  return `
    <div style="text-align:left;">
      ${promedioHtml}
      <ul style="margin:0; padding-left:18px;">
        ${itemsHtml}
      </ul>
    </div>
  `;
}

function renderCursos(assignments, notesByAssignmentId) {
  const tbody = document.getElementById("tablaMisCursos");
  if (!tbody) return;

  if (!assignments || assignments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No tienes cursos matriculados.</td></tr>`;
    return;
  }

  tbody.innerHTML = assignments
    .map((a) => {
      const courseName = a?.course?.name || "";
      const groupName = a?.group?.name || "";
      const teacher = getTeacherLabel(a?.teacher);
      const notes = notesByAssignmentId.get(String(a?._id)) || [];
      const notasHtml = renderNotasDetalle(notes);
      return `
        <tr>
          <td>${escapeHtml(courseName)}</td>
          <td>${escapeHtml(groupName)}</td>
          <td>${escapeHtml(teacher)}</td>
          <td>${notasHtml}</td>
        </tr>
      `;
    })
    .join("");
}

async function cargarDatosEstudiante() {
  const usuario = ensureEstudianteSession();
  if (!usuario) return;

  const bienvenida = document.getElementById("bienvenidaEstudiante");
  if (bienvenida) bienvenida.textContent = `Bienvenido, ${usuario.nombreCompleto}`;

  try {
    const fetchJson = async (url) => {
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
      if (!data) throw new Error("El servidor respondió, pero no devolvió JSON.");
      return data;
    };

    const [assignments, notes] = await Promise.all([
      fetchJson(`${resolveApiBase()}/students/${encodeURIComponent(usuario.id)}/assignments`),
      fetchJson(`${resolveApiBase()}/notes/student/${encodeURIComponent(usuario.id)}`),
    ]);

    cachedAssignments = Array.isArray(assignments) ? assignments : [];
    cachedNotes = Array.isArray(notes) ? notes : [];

    const notesByAssignmentId = buildNotesByAssignmentId(cachedNotes);

    renderCursos(cachedAssignments, notesByAssignmentId);
  } catch (err) {
    console.error(err);
    alert("No se pudieron cargar tus cursos/notas.");
  }
}

document.addEventListener("DOMContentLoaded", cargarDatosEstudiante);
