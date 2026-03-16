document.addEventListener("DOMContentLoaded", () => {
  const formCrearGrupo = document.getElementById("formCrearGrupo");

  if (!formCrearGrupo) return;
  formCrearGrupo.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAdminMensaje("Creando grupo...", "info");

    const payload = {
      name: document.getElementById("grupoName")?.value?.trim(),
      description: document.getElementById("grupoDescription")?.value?.trim(),
    };

    try {
      if (!payload.name) {
        throw new Error("Completa el nombre del grupo.");
      }

      const created = await fetchJson(apiUrl("groups"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAdminMensaje(`Grupo creado: ${created?.name || ""}`.trim(), "ok");
      formCrearGrupo.reset();
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo crear el grupo.", "error");
      console.error(err);
    }
  });
});
