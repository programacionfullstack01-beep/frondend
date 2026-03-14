document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCrearCurso");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAdminMensaje("Creando curso...", "info");

    const payload = {
      name: document.getElementById("cursoName")?.value?.trim(),
      description: document.getElementById("cursoDescription")?.value?.trim() || "",
    };

    try {
      const created = await fetchJson(apiUrl("courses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAdminMensaje(`Curso creado: ${created?.name || ""}`.trim(), "ok");
      form.reset();
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo crear el curso.", "error");
      console.error(err);
    }
  });
});

