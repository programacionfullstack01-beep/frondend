function getUsuarioActivo() {
  try {
    return JSON.parse(localStorage.getItem("usuarioActivo") || "null");
  } catch {
    return null;
  }
}

function ensureProfesorSession() {
  const usuario = getUsuarioActivo();
  if (!usuario || usuario.rol !== "profesor") {
    window.location.href = "../index.html";
    return null;
  }
  if (!usuario.id) {
    alert("Tu sesión no trae el id del profesor. Cierra sesión e inicia de nuevo.");
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

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
  if (!data) throw new Error("El servidor respondió, pero no devolvió JSON.");
  return data;
}

function studentLabel(s) {
  const name = `${s?.name || ""} ${s?.lastname || ""}`.trim();
  return name || s?.user || s?._id || "";
}

function setMensaje(text, tipo = "info") {
  const el = document.getElementById("mensajeCursoProfesor");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.tipo = tipo;
  el.classList.toggle("is-error", tipo === "error");
}

function setModalMsg(text, tipo = "info") {
  const el = document.getElementById("modalNotaMsg");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.tipo = tipo;
  el.classList.toggle("is-error", tipo === "error");
}

function openModal() {
  const backdrop = document.getElementById("modalNotaBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const backdrop = document.getElementById("modalNotaBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  document.body.style.overflow = "";
  setModalMsg("", "info");
}

function getAssignmentId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("assignmentId") || "";
}

let cachedStudents = [];
let cachedNotes = [];
let selectedAssignmentId = "";

function notesByStudentId(notes) {
  const map = new Map();
  for (const n of notes || []) {
    const sid = n?.student?._id || n?.student;
    if (!sid) continue;
    const key = String(sid);
    const arr = map.get(key) || [];
    arr.push(n);
    map.set(key, arr);
  }
  return map;
}

function renderStudents() {
  const tbody = document.getElementById("tablaEstudiantesCurso");
  if (!tbody) return;

  const map = notesByStudentId(cachedNotes);

  if (!cachedStudents.length) {
    tbody.innerHTML = `<tr><td colspan="4">No hay estudiantes matriculados.</td></tr>`;
    return;
  }

  tbody.innerHTML = cachedStudents
    .map((s) => {
      const sid = s?._id || "";
      const count = (map.get(String(sid)) || []).length;
      return `
        <tr>
          <td>${escapeHtml(studentLabel(s))}</td>
          <td>${escapeHtml(s?.user || "")}</td>
          <td>${escapeHtml(String(count))}</td>
          <td>
            <button type="button" class="icon-btn" title="Agregar nota" aria-label="Agregar nota" data-action="add" data-student="${escapeHtml(String(sid))}">
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
            <button type="button" class="icon-btn" title="Actualizar nota" aria-label="Actualizar nota" data-action="edit" data-student="${escapeHtml(String(sid))}">
              <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            </button>
            <button type="button" class="icon-btn" title="Eliminar nota" aria-label="Eliminar nota" data-action="delete" data-student="${escapeHtml(String(sid))}">
              <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-action") || "add";
      const sid = btn.getAttribute("data-student") || "";
      openNoteModal(mode, sid);
    });
  });
}

function fillSelect(selectEl, items, getValue, getLabel) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  for (const item of items || []) {
    const opt = document.createElement("option");
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    selectEl.appendChild(opt);
  }
}

function openNoteModal(mode, studentId) {
  const modeInput = document.getElementById("modalMode");
  const studentIdInput = document.getElementById("studentId");
  const noteIdInput = document.getElementById("noteId");
  const studentLabelEl = document.getElementById("studentLabel");
  const existingWrap = document.getElementById("existingNoteWrap");
  const existingSelect = document.getElementById("existingNoteSelect");
  const actividadInput = document.getElementById("actividadName");
  const notaInput = document.getElementById("nota");
  const btnEliminar = document.getElementById("btnEliminarNota");

  const student = cachedStudents.find((s) => String(s?._id) === String(studentId));
  const notesForStudent = cachedNotes.filter((n) => String(n?.student?._id || n?.student) === String(studentId));

  if (modeInput) modeInput.value = mode;
  if (studentIdInput) studentIdInput.value = studentId;
  if (studentLabelEl) studentLabelEl.textContent = studentLabel(student);
  if (noteIdInput) noteIdInput.value = "";
  setModalMsg("", "info");

  const hasNotes = notesForStudent.length > 0;

  if (existingWrap) existingWrap.style.display = mode === "add" ? "none" : "block";
  if (btnEliminar) btnEliminar.style.display = mode === "delete" ? "inline-flex" : "none";

  if (mode !== "add" && !hasNotes) {
    setModalMsg("Este estudiante no tiene notas para actualizar/eliminar.", "error");
  }

  if (existingSelect) {
    fillSelect(
      existingSelect,
      notesForStudent,
      (n) => n._id,
      (n) => `${n.activityName || "Actividad"} - ${n.grade ?? ""}`
    );

    const pick = () => {
      const selectedId = existingSelect.value;
      const note = notesForStudent.find((n) => String(n?._id) === String(selectedId));
      if (!note) return;
      if (noteIdInput) noteIdInput.value = note._id || "";
      if (actividadInput) actividadInput.value = note.activityName || "";
      if (notaInput) notaInput.value = String(note.grade ?? "");
    };

    existingSelect.onchange = pick;
    pick();
  }

  if (mode === "add") {
    if (actividadInput) actividadInput.value = "";
    if (notaInput) notaInput.value = "";
  }

  openModal();
  if (actividadInput) actividadInput.focus();
}

async function reloadData() {
  setMensaje("Cargando estudiantes...", "info");
  try {
    const [students, notes] = await Promise.all([
      fetchJson(`${resolveApiBase()}/assignments/${encodeURIComponent(selectedAssignmentId)}/students`),
      fetchJson(`${resolveApiBase()}/notes/assignment/${encodeURIComponent(selectedAssignmentId)}`),
    ]);
    cachedStudents = Array.isArray(students) ? students : [];
    cachedNotes = Array.isArray(notes) ? notes : [];
    setMensaje("", "info");
    renderStudents();
  } catch (err) {
    console.error(err);
    setMensaje(err?.message || "No se pudo cargar la información.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = ensureProfesorSession();
  if (!usuario) return;

  const bienvenida = document.getElementById("bienvenidaProfesor");
  if (bienvenida) bienvenida.textContent = `Bienvenido, ${usuario.nombreCompleto}`;

  selectedAssignmentId = getAssignmentId();
  if (!selectedAssignmentId) {
    window.location.href = "./Panelprofesor.html";
    return;
  }

  try {
    const assignments = await fetchJson(`${resolveApiBase()}/teachers/${encodeURIComponent(usuario.id)}/assignments`);
    const assignment = (Array.isArray(assignments) ? assignments : []).find((a) => String(a?._id) === String(selectedAssignmentId));
    const courseName = assignment?.course?.name || "Curso";
    const groupName = assignment?.group?.name || "";
    const groupDesc = assignment?.group?.description ? ` - ${assignment.group.description}` : "";
    const header = document.getElementById("headerCursoGrupo");

    const title = document.getElementById("tituloCursoProfesor");
    const subtitle = document.getElementById("subtituloCursoProfesor");
    if (header) header.textContent = `${courseName}${groupName ? ` - ${groupName}` : ""}`;
    if (title) title.textContent = courseName;
    if (subtitle) subtitle.textContent = `${groupName}${groupDesc}`;
  } catch (err) {
    console.error(err);
  }

  // modal wiring
  const backdrop = document.getElementById("modalNotaBackdrop");
  const btnCerrar = document.getElementById("btnCerrarModalNota");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const btnEliminar = document.getElementById("btnEliminarNota");
  const form = document.getElementById("formNotaProfesor");

  if (btnCerrar) btnCerrar.addEventListener("click", closeModal);
  if (btnCancelar) btnCancelar.addEventListener("click", closeModal);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (btnEliminar) {
    btnEliminar.addEventListener("click", async () => {
      const noteId = document.getElementById("noteId")?.value || "";
      if (!noteId) {
        setModalMsg("Selecciona una nota.", "error");
        return;
      }
      if (!confirm("¿Eliminar esta nota?")) return;
      try {
        await fetchJson(`${resolveApiBase()}/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
        closeModal();
        await reloadData();
      } catch (err) {
        console.error(err);
        setModalMsg(err?.message || "No se pudo eliminar.", "error");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setModalMsg("Guardando...", "info");

      const mode = document.getElementById("modalMode")?.value || "add";
      const studentId = document.getElementById("studentId")?.value || "";
      const noteId = document.getElementById("noteId")?.value || "";
      const activityName = document.getElementById("actividadName")?.value?.trim() || "";
      const grade = Number(document.getElementById("nota")?.value);

      if (!studentId || !activityName || !Number.isFinite(grade)) {
        setModalMsg("Completa actividad y nota.", "error");
        return;
      }

      const payload = { student: studentId, group: selectedAssignmentId, activityName, grade };

      try {
        if (mode === "edit" && noteId) {
          await fetchJson(`${resolveApiBase()}/notes/${encodeURIComponent(noteId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetchJson(`${resolveApiBase()}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        closeModal();
        await reloadData();
      } catch (err) {
        console.error(err);
        setModalMsg(err?.message || "No se pudo guardar.", "error");
      }
    });
  }

  await reloadData();
});
