document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCrearEstudiante");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAdminMensaje("Creando estudiante...", "info");

    const payload = {
      identification: document.getElementById("estudianteIdentification")?.value?.trim(),
      name: document.getElementById("estudianteName")?.value?.trim(),
      lastname: document.getElementById("estudianteLastname")?.value?.trim(),
      user: document.getElementById("estudianteUser")?.value?.trim(),
      password: document.getElementById("estudiantePassword")?.value?.trim(),
      status: true,
    };

    try {
      const created = await fetchJson(apiUrl("students"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAdminMensaje(
        `Estudiante creado: ${created?.name || ""} ${created?.lastname || ""}`.trim(),
        "ok"
      );
      form.reset();
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo crear el estudiante.", "error");
      console.error(err);
    }
  });
});

