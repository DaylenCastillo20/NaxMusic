import { supabase } from '../config/DatabaseConfig.js'; // Ajusta la ruta a tu cliente de Supabase

document.addEventListener('DOMContentLoaded', async () => {

    // Capturar los elementos del DOM (soportando los IDs nuevos y antiguos)
    const adminAvatar = document.getElementById('userAvatar') || document.getElementById('adminAvatar');
    const adminNombre = document.getElementById('userName') || document.getElementById('adminNombre');
    const adminRol = document.getElementById('userRole') || document.getElementById('adminRol');

    const menuUsuarioLogueado = document.getElementById('menuUsuarioLogueado');
    const menuUsuarioInvitado = document.getElementById('menuUsuarioInvitado');
    const menuMisCotizaciones = document.getElementById('menuMisCotizaciones');
    const menuPanelAdmin = document.getElementById('menuPanelAdmin');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    // 1. Obtener la sesión actual desde localStorage (Validación con DB local)
    const sessionString = localStorage.getItem('sessionUser');
    const userSession = sessionString ? JSON.parse(sessionString) : null;

    if (userSession) {
        // 2. Extraer datos del usuario guardados en la sesión
        const nombre = userSession.nombre || "Usuario";
        const rol = userSession.tipo_usuario || "Cliente";

        // 3. Renderizar Avatar e Info
        if (adminAvatar) adminAvatar.textContent = nombre.substring(0, 2).toUpperCase();
        if (adminNombre) adminNombre.textContent = nombre;
        if (adminRol) adminRol.textContent = rol;

        // 4. Mostrar menú de logueado y ocultar el de invitado
        menuUsuarioLogueado.style.display = 'block';
        menuUsuarioInvitado.style.display = 'none';

        // 5. Lógica de permisos de menú
        if (rol === 'Cliente') {
            menuMisCotizaciones.style.display = 'flex'; // Usar flex o block según tu CSS
        }

        if (rol === 'Administrador' || rol === 'Admin') {
            menuPanelAdmin.style.display = 'flex';
        }

        // 6. Configurar botón de cerrar sesión
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault();
            localStorage.removeItem('sessionUser');
            window.location.reload(); // Recargar la página para volver al estado de invitado
        });

    } else {
        // Si no hay sesión, se mantienen los valores estáticos por defecto (NM, NaxMusic, Invitado)
        // y se asegura que el menú de invitado sea el único visible.
        menuUsuarioLogueado.style.display = 'none';
        menuUsuarioInvitado.style.display = 'block';
    }

    // 2. DETECTOR AUTOMÁTICO DE ERRORES EN LA URL
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('error') === 'login') {
        cargarContenido('login');
        setTimeout(() => {
            mostrarError("Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.");
        }, 300);
        window.history.replaceState({}, document.title, "index.php");
    }

    if (urlParams.get('error') === 'registro_pass') {
        cargarContenido('registro');
        setTimeout(() => {
            mostrarError("Las contraseñas no coinciden");
        }, 300);
        window.history.replaceState({}, document.title, "index.php");
    }
});

// ==========================================
// LÓGICA SPA (CARGA DINÁMICA DE VISTAS)
// ==========================================

async function cargarContenido(opcion) {
    const contenido = document.getElementById("contenido");

    // Lógica especial de estilos por sección
    if (opcion === 'login' || opcion === 'registro') {
        contenido.classList.add("fondo-login");
    } else {
        contenido.classList.remove("fondo-login");
    }

    // Enrutamiento dinámico para cotizaciones
    if (opcion === 'cotizaciones') {
        const sessionString = localStorage.getItem('sessionUser');
        const userSession = sessionString ? JSON.parse(sessionString) : null;
        const rol = userSession ? userSession.tipo_usuario : 'Invitado';

        if (rol === 'Administrador' || rol === 'Admin') {
            opcion = 'gestion_cotizaciones';
        } else {
            opcion = 'formulario_eventos';
        }
    }

    try {
        const response = await fetch(`views/${opcion}.html`);
        if (!response.ok) {
            throw new Error(`Vista ${opcion} no encontrada`);
        }

        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const contenedorRegistro = doc.querySelector('.contenedor-registro');
        contenido.innerHTML = contenedorRegistro ? contenedorRegistro.outerHTML : doc.body.innerHTML;

        const scripts = doc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.type) newScript.type = oldScript.type;
            if (oldScript.src) newScript.src = oldScript.src;
            if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
            document.body.appendChild(newScript);
        });

    } catch (error) {
        console.error("Error cargando la vista:", error);
        mostrarError("Ocurrió un error cargando la sección.");
    }
}

function mostrarError(mensaje) {
    const errorBox = document.getElementById('errorAlert');
    const errorText = document.getElementById('errorMessage');

    if (errorBox && errorText) {
        errorText.textContent = mensaje;
        errorBox.classList.remove('hidden');

        setTimeout(() => {
            errorBox.classList.add('hidden');
        }, 4000);
    }
}

// Hacer las funciones accesibles globalmente ya que el script es type="module"
window.cargarContenido = cargarContenido;
window.mostrarError = mostrarError;