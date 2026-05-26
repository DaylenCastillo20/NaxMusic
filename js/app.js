function cargarContenido(opcion) {

    const contenido = document.getElementById("contenido");

    // DASHBOARD
    if (opcion === "dashboard") {
        contenido.innerHTML = `
            <h1>Bienvenido a NaxMusic</h1>
            <p>Selecciona una opción del menú</p>
        `;
    }

    // SERVICIOS
    if (opcion === "servicios") {
        contenido.innerHTML = `
            <h1>Servicios</h1>
            <p>Lista de servicios disponibles</p>
        `;
    }

    // COTIZACIONES
    if (opcion === "cotizaciones") {
        contenido.innerHTML = `
            <h1>Cotizaciones</h1>
            <p>Genera tu cotización aquí</p>
        `;
    }

    // CARRITO
    if (opcion === "carrito") {
        contenido.innerHTML = `
            <h1>Carrito</h1>
            <p>Productos agregados</p>
        `;
    }

    // LOGIN (IMPORTANTE)
    if (opcion === "login") {
        
        const contenido = document.getElementById("contenido");
        //  AGREGA EL FONDO
        contenido.classList.add("fondo-login");
        contenido.innerHTML = `
            <div class="contenedor contenedor-registro">

                <img src="img/logo.jpeg" class="logo-registro">

                <h2>Iniciar Sesión</h2>

                <p class="subtexto">
                    Bienvenido a <span>NaxMusic</span>
                </p>

                <form action="controllers/login_controller.php" method="POST">

                    <input type="email" name="email" placeholder="Correo electronico" required>

                    <input type="password" name="password" placeholder="Contraseña" required>

                    <button type="submit">Ingresar</button>

                </form>

                <p class="texto-login">
                    ¿No tienes cuenta?
                    <a href="#" onclick="cargarContenido('registro')">Registrarse</a>
                </p>

            </div>
        `;
    }


    // REGISTRO
    if (opcion === "registro") {

        const contenido = document.getElementById("contenido");

        // activar fondo
        contenido.classList.add("fondo-login");

        contenido.innerHTML = `
            <div class="contenedor contenedor-registro">

                <img src="img/logo.jpeg" class="logo-registro">

                <h2>Crear cuenta</h2>

                <p class="subtexto">
                    Unete a <span>NaxMusic</span>
                </p>

                <form action="controllers/registro_controller.php" method="POST">

                    <input type="text" name="nombre" placeholder="Nombre completo" required>

                    <input type="email" name="email" placeholder="Correo electronico" required>

                    <input type="password" name="password" placeholder="Contraseña" required>

                    <input type="password" name="confirmar" placeholder="Confirmar contraseña" required>

                    <button type="submit">Registrarse</button>

                </form>

                <p class="texto-login">
                    ¿Ya tienes cuenta?
                    <a href="#" onclick="cargarContenido('login')">Iniciar sesión</a>
                </p>

            </div>
        `;
    }

}

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
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('error') === 'login') {

        cargarContenido('login'); 
        
        setTimeout(() => {
            mostrarError("Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.");
        }, 300);

        // LIMPIAR LA URL DESPUES DE MOSTRAR EL ERROR
        window.history.replaceState({}, document.title, "index.php");
    }

    if (urlParams.get('error') === 'registro_pass') {

        cargarContenido('registro');

        setTimeout(() => {
            mostrarError("Las contraseñas no coinciden");
        }, 300);

        // también limpiar
        window.history.replaceState({}, document.title, "index.php");
    }
});