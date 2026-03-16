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

async function recargarListasAsignarDocente() {
  const [groups, courses, teachers] = await Promise.all([
    fetchJson(apiUrl("groups")),
    fetchJson(apiUrl("courses")),
    fetchJson(apiUrl("teachers")),
  ]);

  fillSelect(
    document.getElementById("asignarGroupId"),
    groups,
    (g) => g._id,
    (g) => `${g.name || ""}${g.description ? ` - ${g.description}` : ""}`.trim() || g._id
  );

  fillSelect(
    document.getElementById("asignarCourseId"),
    courses,
    (c) => c._id,
    (c) => c.name || c._id
  );

  fillSelect(
    document.getElementById("asignarTeacherId"),
    teachers,
    (t) => t._id,
    (t) => `${t.name || ""} ${t.lastname || ""}`.trim() || t.user || t._id
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formAsignarDocente");
  const btnRecargar = document.getElementById("btnRecargarAsignarDocente");
  const groupSelect = document.getElementById("asignarGroupId");
  const courseSelect = document.getElementById("asignarCourseId");
  const teacherSelect = document.getElementById("asignarTeacherId");

  const init = async () => {
    try {
      setAdminMensaje("Cargando listas...", "info");
      await recargarListasAsignarDocente();
      setAdminMensaje("", "info");
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudieron cargar las listas.", "error");
      console.error(err);
    }
  };

  init();

  if (btnRecargar) btnRecargar.addEventListener("click", init);

  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAdminMensaje("Asignando docente...", "info");

    const payload = {
      groupId: groupSelect?.value,
      courseId: courseSelect?.value,
      teacherId: teacherSelect?.value,
    };

    try {
      if (!payload.groupId || !payload.courseId || !payload.teacherId) {
        throw new Error("Completa grupo, curso y profesor.");
      }

      const created = await fetchJson(apiUrl("assignments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAdminMensaje("Asignación creada.", "ok");
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo asignar.", "error");
      console.error(err);
    }
  });
});
