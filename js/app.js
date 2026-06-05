// Carga dinámicamente el contenido de la vista
// solicitada dentro del contenedor principal.
async function cargarContenido(opcion) {
    const contenido = document.getElementById("contenido");
    setSidebarCollapsed(true);

    // Lógica especial de estilos por sección
    if (opcion === 'login' || opcion === 'registro') {
        contenido.classList.add("fondo-login");
    } else {
        contenido.classList.remove("fondo-login");
    }

    // Enrutamiento dinámico para cotizaciones
    if (opcion === 'cotizaciones') {
        if (window.userRole === 'Administrador' || window.userRole === 'Admin') {
            opcion = 'gestion_cotizaciones';

        }
    }

    try {
        // Hacemos el fetch a la vista correspondiente en la carpeta views/
        const response = await fetch(`views/${opcion}.html`);
        if (!response.ok) {
            throw new Error(`Vista ${opcion} no encontrada`);
        }

        const html = await response.text();

        // Usamos DOMParser para extraer el contenido sin romper el layout
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Buscamos si la vista tiene el contenedor principal
        const contenedorRegistro = doc.querySelector('.contenedor-registro');

        // Si es login/registro, inyectamos el contenedor. Si es otra (ej. dashboard), inyectamos el body.
        contenido.innerHTML = contenedorRegistro ? contenedorRegistro.outerHTML : doc.body.innerHTML;

        // IMPORTANTE: Re-ejecutar dinámicamente los scripts que venían en la vista inyectada
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            // Copiar los atributos relevantes
            if (oldScript.type) newScript.type = oldScript.type;
            if (oldScript.src) newScript.src = oldScript.src;
            if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;

            // Adjuntar al DOM para que el navegador lo ejecute (se usa setTimeout para evitar bloqueos)
            document.body.appendChild(newScript);
        });

    } catch (error) {
        console.error("Error cargando la vista:", error);
        mostrarError("Ocurrió un error cargando la sección.");
    }
}

// Expande o colapsa el menú lateral
// actualizando la interfaz y el estado local.
function setSidebarCollapsed(collapsed) {
    const appContainer = document.querySelector('.app-container');
    const toggleButtons = document.querySelectorAll('[data-sidebar-toggle]');

    if (!appContainer) return;

    appContainer.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('naxSidebarCollapsed', collapsed ? '1' : '0');

    toggleButtons.forEach((button) => {
        button.setAttribute('aria-expanded', String(!collapsed));
        button.setAttribute('title', collapsed ? 'Mostrar menu' : 'Ocultar menu');
    });
}

// Inicializa los eventos y el estado
// del menú lateral responsivo.
function initSidebarToggle() {
    const storedState = localStorage.getItem('naxSidebarCollapsed');
    const savedState = storedState === null
        ? window.matchMedia('(max-width: 768px)').matches
        : storedState === '1';
    setSidebarCollapsed(savedState);

    document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-sidebar-toggle]');
        const appContainer = document.querySelector('.app-container');

        if (!toggle && appContainer && event.target === appContainer && window.matchMedia('(max-width: 768px)').matches) {
            setSidebarCollapsed(true);
            return;
        }

        if (!toggle) return;

        event.preventDefault();
        const isCollapsed = appContainer?.classList.contains('sidebar-collapsed') ?? false;
        setSidebarCollapsed(!isCollapsed);
    });
}

// Muestra una alerta temporal de error
// en la pantalla del usuario.
function mostrarError(mensaje) {
    const errorBox = document.getElementById('errorAlert');
    const errorText = document.getElementById('errorMessage');

    if (errorBox && errorText) {
        errorText.textContent = mensaje;
        errorBox.classList.remove('hidden');

        // desaparece solo después de 4 segundos
        setTimeout(() => {
            errorBox.classList.add('hidden');
        }, 4000);
    }
}

// 2. DETECTOR AUTOMÁTICO DE ERRORES EN LA URL
document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('error') === 'login') {

        cargarContenido('login');

        setTimeout(() => {
            mostrarError("Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.");
        }, 300);

        // LIMPIAR LA URL DESPUES DE MOSTRAR EL ERROR
        window.history.replaceState({}, document.title, "index.html");
    }

    if (urlParams.get('error') === 'registro_pass') {

        cargarContenido('registro');

        setTimeout(() => {
            mostrarError("Las contraseñas no coinciden");
        }, 300);

        // también limpiar
        window.history.replaceState({}, document.title, "index.html");
    }
});
