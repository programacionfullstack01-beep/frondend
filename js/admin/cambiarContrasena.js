document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCambiarContrasena");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const role = document.getElementById("pwdRole")?.value?.trim();
    const user = document.getElementById("pwdUser")?.value?.trim();
    const newPassword = document.getElementById("pwdNewPassword")?.value?.trim();
    const confirmPassword = document.getElementById("pwdConfirmPassword")?.value?.trim();

    if (!role || !user || !newPassword) {
      setAdminMensaje("Completa todos los campos.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setAdminMensaje("Las contraseñas no coinciden.", "error");
      return;
    }

    setAdminMensaje("Cambiando contraseña...", "info");

    try {
      await fetchJson(apiUrl("auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, user, newPassword }),
      });

      setAdminMensaje("Contraseña actualizada.", "ok");
      form.reset();
    } catch (err) {
      setAdminMensaje(err?.message || "No se pudo cambiar la contraseña.", "error");
      console.error(err);
    }
  });
});

