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
  const [courses, teachers, students, groups] = await Promise.all([
    fetchJson(apiUrl("courses")),
    fetchJson(apiUrl("teachers")),
    fetchJson(apiUrl("students")),
    fetchJson(apiUrl("groups")),
  ]);

  fillSelect(
    document.getElementById("grupoCourseId"),
    courses,
    (c) => c._id,
    (c) => c.name || c._id
  );

  fillSelect(
    document.getElementById("grupoTeacherId"),
    teachers,
    (t) => t._id,
    (t) => `${t.name || ""} ${t.lastname || ""}`.trim() || t.user || t._id
  );

  fillSelect(
    document.getElementById("matriculaStudentId"),
    students,
    (s) => s._id,
    (s) => `${s.name || ""} ${s.lastname || ""}`.trim() || s.user || s._id
  );

  fillSelect(
    document.getElementById("matriculaGroupId"),
    groups,
    (g) => g._id,
    (g) => {
      const courseName = g.course?.name ? ` - ${g.course.name}` : "";
      const teacherName = g.teacher?.name ? ` - ${g.teacher.name} ${g.teacher.lastname || ""}` : "";
      return `${g.name || g._id}${courseName}${teacherName}`.trim();
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const formCrearGrupo = document.getElementById("formCrearGrupo");
  const formMatricular = document.getElementById("formMatricularEstudiante");
  const btnRecargar = document.getElementById("btnRecargarMatriculas");

  const init = async () => {
    try {
      setAdminMensaje("Cargando listas...", "info");
      await recargarListas();
      setAdminMensaje("", "info");
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudieron cargar las listas.", "error");
      console.error(err);
    }
  };

  init();

  if (btnRecargar) {
    btnRecargar.addEventListener("click", init);
  }

  if (formCrearGrupo) {
    formCrearGrupo.addEventListener("submit", async (e) => {
      e.preventDefault();
      setAdminMensaje("Creando grupo...", "info");

      const payload = {
        name: document.getElementById("grupoName")?.value?.trim(),
        courseId: document.getElementById("grupoCourseId")?.value,
        teacherId: document.getElementById("grupoTeacherId")?.value,
      };

      try {
        const created = await fetchJson(apiUrl("groups"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setAdminMensaje(`Grupo creado: ${created?.name || ""}`.trim(), "ok");
        formCrearGrupo.reset();
        await recargarListas();
      } catch (err) {
        setAdminMensaje(err?.message || "No se pudo crear el grupo.", "error");
        console.error(err);
      }
    });
  }

  if (formMatricular) {
    formMatricular.addEventListener("submit", async (e) => {
      e.preventDefault();
      setAdminMensaje("Matriculando...", "info");

      const studentId = document.getElementById("matriculaStudentId")?.value;
      const groupId = document.getElementById("matriculaGroupId")?.value;

      try {
        await fetchJson(apiUrl(`groups/${groupId}/students`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        setAdminMensaje("Matrícula realizada.", "ok");
        formMatricular.reset();
      } catch (err) {
        setAdminMensaje(err?.message || "No se pudo matricular.", "error");
        console.error(err);
      }
    });
  }
});

