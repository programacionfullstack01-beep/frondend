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

async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : null;
    if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
    if (!data) throw new Error("El servidor respondió, pero no devolvió JSON.");
    return data;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderAssignmentCards(assignments) {
    const cards = document.getElementById("tarjetasCursosProfesor");
    if (!cards) return;
    cards.innerHTML = "";

    for (const a of assignments || []) {
        const courseName = a?.course?.name || "(Sin curso)";
        const groupName = a?.group?.name || "(Sin grupo)";
        const groupDesc = a?.group?.description || "";
        const assignmentId = a?._id || "";

        const card = document.createElement("a");
        card.className = "admin-card";
        card.href = `./cursoProfesor.html?assignmentId=${encodeURIComponent(assignmentId)}`;
        card.innerHTML = `
            <span class="material-symbols-outlined" aria-hidden="true">menu_book</span>
            <div class="admin-card__text">
                <h2>${escapeHtml(courseName)}</h2>
                <p>${escapeHtml(`${groupName}${groupDesc ? ` - ${groupDesc}` : ""}`)}</p>
            </div>
        `;
        cards.appendChild(card);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = ensureProfesorSession();
    if (!usuario) return;

    const bienvenida = document.getElementById("bienvenidaProfesor");
    if (bienvenida) bienvenida.textContent = `Bienvenido, ${usuario.nombreCompleto}`;

    const empty = document.getElementById("cursosProfesorVacio");
    const cards = document.getElementById("tarjetasCursosProfesor");
    if (cards) cards.innerHTML = "";
    if (empty) empty.style.display = "none";

    try {
        const data = await fetchJson(`${resolveApiBase()}/teachers/${encodeURIComponent(usuario.id)}/assignments`);
        const assignments = Array.isArray(data) ? data : [];

        if (assignments.length === 0) {
            if (empty) empty.style.display = "block";
            return;
        }

        renderAssignmentCards(assignments);
    } catch (err) {
        console.error(err);
        alert(err?.message || "No se pudieron cargar tus cursos.");
    }
});

