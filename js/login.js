// Base de API:
// - En Netlify: usar proxy con `/api/*` (ver `_redirects` o `netlify.toml`)
// - En local con Live Server: apuntar directo al backend local
function resolveApiBase() {
    const { hostname, port } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocalHost && port && port !== "4020") return "http://localhost:4020/api";
    return "/api";
}

// ===============================
// INICIALIZACIÓN DEL SISTEMA
// ===============================

// Crear admin por defecto si no existe
if (!localStorage.getItem("usuarios")) {
    const usuariosIniciales = [
        {
            usuario: "admin",
            contrasena: "1234",
            rol: "admin",
            nombreCompleto: "Administrador General"
        }
    ];
    localStorage.setItem("usuarios", JSON.stringify(usuariosIniciales));
    console.log("Admin creado por defecto");

}


// ===============================
// LOGIN
// ===============================
const rutasPorRol = {
    admin: "../admin/panelAdmin.html",
    profesor: "../teacher/Panelprofesor.html",
    estudiante: "../student/panelestudiante.html"
};

const formLogin = document.getElementById("formLogin");
if (formLogin) {
    formLogin.addEventListener("submit", async function (event) {
        event.preventDefault();

        console.log("Iniciando login para los datos..", formLogin)
        const rolSeleccionado = document.getElementById("rol").value;
        const usuarioIngresado = document.getElementById("usuario").value.trim();
        const contrasenaIngresada = document.getElementById("contrasena").value.trim();

        // Login local para admin (manejado en localStorage)
        if (rolSeleccionado === "admin") {
            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            const admin = usuarios.find(
                (u) =>
                    u.usuario === usuarioIngresado &&
                    u.contrasena === contrasenaIngresada &&
                    u.rol === "admin"
            );

            if (admin) {
                localStorage.setItem("usuarioActivo", JSON.stringify(admin));
                window.location.href = rutasPorRol.admin;
            } else {
                alert("Credenciales de administrador inválidas");
            }
            return;
        }

        try {
            const response = await fetch(`${resolveApiBase()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: usuarioIngresado,
                    password: contrasenaIngresada,
                    role: rolSeleccionado
                })
            });

            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const data = isJson ? await response.json() : null;

            if (!response.ok) {
                throw new Error(data?.message || `Error HTTP ${response.status}`);
            }

            if (!data) {
                throw new Error("El servidor respondió, pero no devolvió JSON (posible redirect/URL incorrecta).");
            }

            if (data.success) {
                const rolDesdeBackend =
                    data.role === "teacher" ? "profesor" :
                        data.role === "student" ? "estudiante" :
                            "";

                if (!rolDesdeBackend) {
                    alert("Rol no reconocido en el servidor");
                    return;
                }

                if (rolSeleccionado !== rolDesdeBackend) {
                    alert("El rol seleccionado no coincide con el usuario");
                    return;
                }

                const usuarioSesion = {
                    id: data.id || null,
                    usuario: usuarioIngresado,
                    nombreCompleto: data.name || usuarioIngresado,
                    rol: rolDesdeBackend
                };

                localStorage.setItem("usuarioActivo", JSON.stringify(usuarioSesion));
                window.location.href = rutasPorRol[rolDesdeBackend];
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error?.message || 'An error occurred during login.');
        }
    });
}

function cerrarSesionEstudiante() {
    localStorage.removeItem("usuarioActivo");
    window.location.href = "../index.html";
}

function cerrarSesionProfesor() {
    localStorage.removeItem("usuarioActivo");
    window.location.href = "../index.html";
}
