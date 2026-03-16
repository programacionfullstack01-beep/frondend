function fillSelect(selectEl, items, getValue, getLabel) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Selecciona --";
  selectEl.appendChild(placeholder);

  for (const item of items || []) {
    const opt = document.createElement("option");
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    selectEl.appendChild(opt);
  }

  if (current) selectEl.value = current;
}

async function recargarListas() {
  const [courses, students, assignments] = await Promise.all([
    fetchJson(apiUrl("courses")),
    fetchJson(apiUrl("students")),
    fetchJson(apiUrl("assignments")),
  ]);

  const courseSelect = document.getElementById("matriculaCourseId");

  fillSelect(
    document.getElementById("matriculaStudentId"),
    students,
    (s) => s._id,
    (s) => `${s.name || ""} ${s.lastname || ""}`.trim() || s.user || s._id
  );

  fillSelect(
    courseSelect,
    courses,
    (c) => c._id,
    (c) => c.name || c._id
  );

  fillSelect(
    document.getElementById("matriculaGroupId"),
    [],
    (a) => a._id,
    () => ""
  );

  // Mejor UX: si hay cursos y no hay uno seleccionado, seleccionar el primero.
  if (courseSelect && !courseSelect.value && courseSelect.options.length > 1) {
    courseSelect.selectedIndex = 1;
  }

  return { assignments: Array.isArray(assignments) ? assignments : [] };
}

document.addEventListener("DOMContentLoaded", () => {
  const formMatricular = document.getElementById("formMatricularEstudiante");
  const btnRecargar = document.getElementById("btnRecargarMatriculas");
  const courseSelect = document.getElementById("matriculaCourseId");
  const groupSelect = document.getElementById("matriculaGroupId");

  let cachedAssignments = [];

  const init = async () => {
    try {
      setAdminMensaje("Cargando listas...", "info");
      const { assignments } = await recargarListas();
      cachedAssignments = assignments;
      setAdminMensaje("", "info");
      if (courseSelect) courseSelect.dispatchEvent(new Event("change"));
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudieron cargar las listas.", "error");
      console.error(err);
    }
  };

  init();

  if (btnRecargar) {
    btnRecargar.addEventListener("click", init);
  }

  const fillGroupsByCourse = () => {
    if (!courseSelect || !groupSelect) return;
    const courseId = courseSelect.value;
    if (!courseId) {
      fillSelect(groupSelect, [], (a) => a._id, () => "");
      return;
    }
    const filtered = cachedAssignments.filter((a) => String(a?.course?._id || a?.course) === String(courseId));

    fillSelect(
      groupSelect,
      filtered,
      (a) => a._id,
      (a) => {
        const groupName = a?.group?.name || "(Sin grupo)";
        const groupDesc = a?.group?.description ? ` - ${a.group.description}` : "";
        const teacherName = `${a?.teacher?.name || ""} ${a?.teacher?.lastname || ""}`.trim();
        const teacherLabel = teacherName ? ` (${teacherName})` : "";
        return `${groupName}${groupDesc}${teacherLabel}`;
      }
    );

    if (filtered.length === 0) {
      setAdminMensaje("No hay grupos para este curso. Ve a 'Asignar docente' y crea una asignación.", "info");
    } else {
      setAdminMensaje("", "info");
    }
  };

  if (courseSelect) courseSelect.addEventListener("change", fillGroupsByCourse);

  if (formMatricular) {
    formMatricular.addEventListener("submit", async (e) => {
      e.preventDefault();
      setAdminMensaje("Matriculando...", "info");

      const studentId = document.getElementById("matriculaStudentId")?.value;
      const assignmentId = document.getElementById("matriculaGroupId")?.value;

      try {
        if (!studentId || !courseSelect?.value || !assignmentId) {
          throw new Error("Selecciona estudiante, curso y grupo.");
        }
        await fetchJson(apiUrl(`assignments/${assignmentId}/students`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        setAdminMensaje("Matrícula realizada.", "ok");
        formMatricular.reset();
        if (courseSelect) courseSelect.dispatchEvent(new Event("change"));
      } catch (err) {
        setAdminMensaje(err?.message || "No se pudo matricular.", "error");
        console.error(err);
      }
    });
  }
});
