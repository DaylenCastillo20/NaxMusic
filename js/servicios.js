window.serviciosSeleccionados = window.serviciosSeleccionados || [];
var serviciosSeleccionados = window.serviciosSeleccionados;

(function iniciarVistaServicios() {
    const shell = document.getElementById('servicesShell');
    if (!shell || shell.dataset.initialized === 'true') return;
    shell.dataset.initialized = 'true';

    const servicios = [
        crearServicio('sonido-pro', 'Sonido', 'Sistema de Sonido Profesional', 'Audio de alta calidad para eventos medianos y grandes.', ['Hasta 500 pers.', 'Incluye transporte'], ['Bodas', 'Fiestas', 'Empresarial'], 450, 98, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80'),
        crearServicio('led-completa', 'Iluminacion', 'Iluminacion LED Completa', 'Luces LED inteligentes, efectos RGB y ambientacion profesional.', ['Efectos RGB', 'Programacion'], ['Bodas', 'Fiestas', 'Galas'], 600, 95, 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80'),
        crearServicio('dj-pro', 'DJ', 'DJ Profesional', 'DJ con experiencia para todo tipo de eventos y generos musicales.', ['+5 anos exp.', 'Playlist personalizada'], ['Bodas', 'Fiestas', 'Empresarial'], 350, 100, 'https://images.unsplash.com/photo-1571266028243-d220c9c3a26b?auto=format&fit=crop&w=900&q=80'),
        crearServicio('line-array', 'Sonido', 'Sonido Line Array', 'Potencia y claridad para eventos masivos y conciertos en vivo.', ['Alta potencia', 'Cobertura 180'], ['Conciertos', 'Empresarial'], 850, 89, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'),
        crearServicio('luces-robotizadas', 'Iluminacion', 'Luces Robotizadas', 'Iluminacion dinamica con robots moviles y efectos avanzados.', ['Movimientos', 'Sincronizacion'], ['Conciertos', 'Fiestas', 'Galas'], 750, 87, 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=900&q=80'),
        crearServicio('dj-animacion', 'DJ', 'DJ + Animacion', 'DJ + animador para mantener la energia durante todo el evento.', ['Interaccion', 'Microfono inalambrico'], ['Bodas', 'Fiestas'], 500, 92, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80')
    ];

    normalizarCarritoExistente();

    const grid = document.getElementById('servicesGrid');
    const listaCarrito = document.getElementById('listaCarrito');
    const contadorCarrito = document.getElementById('contadorCarrito');
    const tituloCarrito = document.getElementById('tituloCarrito');
    const subtotalCarrito = document.getElementById('subtotalCarrito');
    const descuentoCarrito = document.getElementById('descuentoCarrito');
    const totalCarrito = document.getElementById('totalCarrito');
    const botonIrCarrito = document.getElementById('irAlCarrito');
    const botonVaciar = document.getElementById('vaciarCarrito');
    const botonVolver = document.getElementById('volverCatalogo');
    const formularioEvento = document.getElementById('formInformacionEvento');
    const mensajeEvento = document.getElementById('mensajeEvento');
    const precioMaximo = document.getElementById('precioMaximo');
    const precioActual = document.getElementById('precioActual');
    const ordenServicios = document.getElementById('ordenServicios');
    const limpiarFiltros = document.getElementById('limpiarFiltros');
    const authQuoteModal = document.getElementById('authQuoteModal');
    const authModalContent = document.getElementById('authModalContent');
    const cerrarAuthModal = document.getElementById('cerrarAuthModal');

    let tabActivo = 'Todos';
    let supabaseClientPromise = null;

    renderizarCatalogo();
    renderizarCarrito();

    shell.querySelectorAll('.services-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            tabActivo = tab.dataset.tab;
            shell.querySelectorAll('.services-tab').forEach((item) => item.classList.remove('is-active'));
            tab.classList.add('is-active');
            renderizarCatalogo();
        });
    });

    shell.querySelectorAll('input[name="categoria"], input[name="ideal"]').forEach((input) => {
        input.addEventListener('change', renderizarCatalogo);
    });

    precioMaximo.addEventListener('input', () => {
        precioActual.textContent = formatearMoneda(Number(precioMaximo.value));
        renderizarCatalogo();
    });

    ordenServicios.addEventListener('change', renderizarCatalogo);

    limpiarFiltros.addEventListener('click', () => {
        precioMaximo.value = 2500;
        precioActual.textContent = '$2,500';
        shell.querySelectorAll('input[name="categoria"], input[name="ideal"]').forEach((input) => {
            input.checked = false;
        });
        renderizarCatalogo();
    });

    grid.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-add-service]');
        if (!boton) return;

        const servicio = servicios.find((item) => item.id_servicio === boton.dataset.addService);
        if (!servicio) return;

        agregarServicioAlCarrito(servicio);
        renderizarCarrito();
    });

    listaCarrito.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-remove-service]');
        if (!boton) return;

        const index = serviciosSeleccionados.findIndex((item) => item.id_servicio === boton.dataset.removeService);
        if (index >= 0) {
            serviciosSeleccionados.splice(index, 1);
            renderizarCarrito();
        }
    });

    botonVaciar.addEventListener('click', () => {
        serviciosSeleccionados.splice(0, serviciosSeleccionados.length);
        renderizarCarrito();
    });

    botonIrCarrito.addEventListener('click', async () => {
        if (!serviciosSeleccionados.length) return;

        const usuarioActivo = await verificarUsuarioActivo();
        if (!usuarioActivo) {
            abrirAuthModal('login');
            return;
        }

        avanzarAFormularioEvento();
    });

    botonVolver.addEventListener('click', () => {
        shell.classList.remove('is-checkout');
        actualizarEstadoCarrito();
        limpiarMensajeEvento();
    });

    formularioEvento.addEventListener('submit', (event) => {
        event.preventDefault();
        limpiarMensajeEvento();

        if (!formularioEvento.checkValidity()) {
            formularioEvento.reportValidity();
            mostrarMensajeEvento('Completa todos los campos obligatorios.', 'error');
            return;
        }

        if (!serviciosSeleccionados.length) {
            mostrarMensajeEvento('Agrega al menos un servicio antes de generar la cotizacion.', 'error');
            return;
        }

        const payload = prepararCotizacionPayload(formularioEvento);
        window.ultimaCotizacionPreparada = payload;
        enviarCotizacionPendiente(payload);
        mostrarMensajeEvento('Cotizacion lista para enviar al controlador.', 'success');
    });

    if (authQuoteModal && authModalContent && cerrarAuthModal) {
        cerrarAuthModal.addEventListener('click', cerrarModalAutenticacion);

        authQuoteModal.addEventListener('click', (event) => {
            if (event.target.closest('[data-auth-close]')) {
                cerrarModalAutenticacion();
            }
        });

        authModalContent.addEventListener('click', (event) => {
            const switchButton = event.target.closest('[data-auth-mode]');
            if (!switchButton) return;

            abrirAuthModal(switchButton.dataset.authMode);
        });

        authModalContent.addEventListener('submit', async (event) => {
            event.preventDefault();

            const form = event.target.closest('[data-auth-form]');
            if (!form) return;

            if (form.dataset.authForm === 'login') {
                await enviarLoginModal(form);
                return;
            }

            await enviarRegistroModal(form);
        });

        authModalContent.addEventListener('input', (event) => {
            if (event.target.matches('input[name="telefono"]')) {
                event.target.value = event.target.value.replace(/[^0-9]/g, '');
            }
        });
    }

    function renderizarCatalogo() {
        const serviciosFiltrados = obtenerServiciosFiltrados();

        grid.innerHTML = serviciosFiltrados.map((servicio) => `
            <article class="service-card">
                <div class="service-media">
                    <img src="${servicio.imagen}" alt="${servicio.titulo}" onerror="this.onerror=null;this.src='${obtenerImagenFallback()}';">
                    <button class="service-favorite" type="button" aria-label="Guardar ${servicio.titulo}">♡</button>
                    <span class="service-category">${servicio.categoria}</span>
                </div>
                <div class="service-body">
                    <h3>${servicio.titulo}</h3>
                    <p class="service-description">${servicio.descripcion}</p>
                    <div class="service-tags">${servicio.caracteristicas.map((tag) => `<span>${tag}</span>`).join('')}</div>
                    <div class="service-footer">
                        <div class="service-price">Desde <strong>${formatearMoneda(servicio.precio)}</strong></div>
                        <button class="service-add" type="button" data-add-service="${servicio.id_servicio}">
                            ${iconoCarrito()} Añadir
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function obtenerServiciosFiltrados() {
        const categoriasSeleccionadas = obtenerChecks('categoria');
        const idealesSeleccionados = obtenerChecks('ideal');
        const precioLimite = Number(precioMaximo.value);

        return servicios
            .filter((servicio) => tabActivo === 'Todos' || servicio.categoria === tabActivo)
            .filter((servicio) => !categoriasSeleccionadas.length || categoriasSeleccionadas.includes(servicio.categoria))
            .filter((servicio) => !idealesSeleccionados.length || idealesSeleccionados.some((ideal) => servicio.ideal.includes(ideal)))
            .filter((servicio) => servicio.precio <= precioLimite)
            .sort((a, b) => {
                if (ordenServicios.value === 'precio-asc') return a.precio - b.precio;
                if (ordenServicios.value === 'precio-desc') return b.precio - a.precio;
                return b.popularidad - a.popularidad;
            });
    }

    function renderizarCarrito() {
        const cantidadTotal = calcularCantidadTotal();
        actualizarTituloCarrito(cantidadTotal);
        botonIrCarrito.disabled = cantidadTotal === 0;

        if (!cantidadTotal) {
            listaCarrito.innerHTML = '<p class="cart-empty">Selecciona servicios del catalogo para preparar tu cotizacion.</p>';
        } else {
            listaCarrito.innerHTML = serviciosSeleccionados.map((servicio) => `
                <article class="cart-item">
                    <img src="${servicio.imagen}" alt="${servicio.titulo}" onerror="this.onerror=null;this.src='${obtenerImagenFallback()}';">
                    <div>
                        <h4>${servicio.titulo} x${servicio.cantidad}</h4>
                        <strong>${formatearMoneda(servicio.precio * servicio.cantidad)}</strong>
                    </div>
                    <button class="cart-remove" type="button" data-remove-service="${servicio.id_servicio}" aria-label="Eliminar ${servicio.titulo}">
                        ${iconoPapelera()}
                    </button>
                </article>
            `).join('');
        }

        const subtotal = calcularSubtotal();
        const descuento = calcularDescuento(subtotal);
        const total = subtotal - descuento;

        subtotalCarrito.textContent = formatearMoneda(subtotal);
        descuentoCarrito.textContent = `-${formatearMoneda(descuento)}`;
        totalCarrito.textContent = formatearMoneda(total);
    }

    function actualizarEstadoCarrito() {
        renderizarCarrito();
    }

    function avanzarAFormularioEvento() {
        shell.classList.add('is-checkout');
        actualizarEstadoCarrito();
        shell.scrollTop = 0;
    }

    function actualizarTituloCarrito(cantidadTotal) {
        if (shell.classList.contains('is-checkout')) {
            tituloCarrito.textContent = 'Resumen de tu cotizacion';
            return;
        }

        tituloCarrito.innerHTML = `Tu carrito (<span id="contadorCarrito">${cantidadTotal}</span>)`;
    }

    function prepararCotizacionPayload(form) {
        const formData = new FormData(form);
        const subtotal = calcularSubtotal();
        const descuento = calcularDescuento(subtotal);

        return {
            evento: {
                nombre_evento: normalizarTexto(formData.get('nombre_evento')),
                fecha_evento: normalizarTexto(formData.get('fecha_evento')),
                hora_evento: normalizarTexto(formData.get('hora_evento')),
                lugar: normalizarTexto(formData.get('lugar')),
                cantidad_asistentes: Number(formData.get('cantidad_asistentes')),
                tipo_evento: normalizarTexto(formData.get('tipo_evento')),
                descripcion: normalizarTexto(formData.get('descripcion'))
            },
            servicios: serviciosSeleccionados.map((servicio) => ({
                id_servicio: servicio.id_servicio,
                categoria: servicio.categoria,
                titulo: servicio.titulo,
                precio: servicio.precio,
                cantidad: servicio.cantidad,
                subtotal: servicio.precio * servicio.cantidad
            })),
            totales: {
                subtotal,
                descuento,
                total: subtotal - descuento
            }
        };
    }

    function enviarCotizacionPendiente(payload) {
        console.log('Payload listo para enviar al controlador MVC:', payload);
        return payload;
    }

    async function verificarUsuarioActivo() {
        const sessionGuardada = leerSesionLocal();
        if (sessionGuardada) return sessionGuardada;

        try {
            const supabaseClient = await obtenerSupabaseClient();
            if (!supabaseClient?.auth?.getSession) return null;

            const { data, error } = await supabaseClient.auth.getSession();
            if (error || !data?.session?.user) return null;

            const usuario = {
                id_usuario: data.session.user.id,
                email: data.session.user.email,
                nombre: data.session.user.user_metadata?.nombre || data.session.user.email,
                tipo_usuario: data.session.user.user_metadata?.tipo_usuario || 'Cliente',
                access_token: data.session.access_token
            };

            guardarSesionUsuario(usuario);
            return usuario;
        } catch (error) {
            console.warn('No se pudo verificar la sesion de Supabase:', error);
            return null;
        }
    }

    function leerSesionLocal() {
        const sessionUser = parseStoredJson(localStorage.getItem('sessionUser'));
        if (sessionUser?.id_usuario || sessionUser?.token || sessionUser?.access_token) {
            return sessionUser;
        }

        const idUsuario = localStorage.getItem('id_usuario');
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (!idUsuario && !token) return null;

        return {
            id_usuario: idUsuario,
            token,
            email: localStorage.getItem('email') || '',
            nombre: localStorage.getItem('nombre') || 'Usuario',
            tipo_usuario: localStorage.getItem('tipo_usuario') || 'Cliente'
        };
    }

    function abrirAuthModal(modo) {
        if (!authQuoteModal || !authModalContent) return;

        authModalContent.innerHTML = modo === 'registro' ? obtenerRegistroMarkup() : obtenerLoginMarkup();
        authQuoteModal.classList.add('is-open');
        authQuoteModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('auth-modal-lock');

        const primerCampo = authModalContent.querySelector('input');
        if (primerCampo) primerCampo.focus();
    }

    function cerrarModalAutenticacion() {
        if (!authQuoteModal) return;

        authQuoteModal.classList.remove('is-open');
        authQuoteModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('auth-modal-lock');
    }

    async function enviarLoginModal(form) {
        const email = normalizarTexto(form.elements.email.value).toLowerCase();
        const password = String(form.elements.password.value || '');
        const botonSubmit = form.querySelector('[type="submit"]');

        setAuthLoading(form, botonSubmit, true);
        mostrarMensajeAuth(form, '');

        try {
            const supabaseClient = await obtenerSupabaseClient();
            const { data: user, error } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                mostrarMensajeAuth(form, 'Usuario no encontrado o correo incorrecto.');
                return;
            }

            await asegurarBcryptDisponible();

            const passwordCorrecto = window.dcodeIO?.bcrypt?.compareSync(password, user.password);
            if (!passwordCorrecto) {
                mostrarMensajeAuth(form, 'Contrasena incorrecta.');
                return;
            }

            autenticarYContinuar({
                id_usuario: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                tipo_usuario: user.tipo_usuario || 'Cliente'
            });
        } catch (error) {
            console.error('Error iniciando sesion desde servicios:', error);
            mostrarMensajeAuth(form, 'No se pudo iniciar sesion. Intentalo nuevamente.');
        } finally {
            setAuthLoading(form, botonSubmit, false);
        }
    }

    async function enviarRegistroModal(form) {
        const nombre = normalizarTexto(form.elements.nombre.value);
        const telefono = normalizarTexto(form.elements.telefono.value);
        const email = normalizarTexto(form.elements.email.value).toLowerCase();
        const password = String(form.elements.password.value || '');
        const botonSubmit = form.querySelector('[type="submit"]');

        setAuthLoading(form, botonSubmit, true);
        mostrarMensajeAuth(form, '');

        try {
            await asegurarBcryptDisponible();

            const salt = window.dcodeIO.bcrypt.genSaltSync(10);
            const passwordHash = window.dcodeIO.bcrypt.hashSync(password, salt);
            const supabaseClient = await obtenerSupabaseClient();
            const { data: user, error } = await supabaseClient
                .from('usuarios')
                .insert([{
                    nombre,
                    telefono,
                    email,
                    password: passwordHash,
                    tipo_usuario: 'Cliente'
                }])
                .select('id_usuario,email,nombre,tipo_usuario')
                .single();

            if (error || !user) {
                mostrarMensajeAuth(form, `Error al registrar usuario: ${error?.message || 'intenta nuevamente.'}`);
                return;
            }

            autenticarYContinuar({
                id_usuario: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                tipo_usuario: user.tipo_usuario || 'Cliente'
            });
        } catch (error) {
            console.error('Error registrando usuario desde servicios:', error);
            mostrarMensajeAuth(form, 'No se pudo completar el registro. Intentalo nuevamente.');
        } finally {
            setAuthLoading(form, botonSubmit, false);
        }
    }

    function autenticarYContinuar(usuario) {
        guardarSesionUsuario(usuario);
        actualizarMenuSesion(usuario);
        cerrarModalAutenticacion();
        avanzarAFormularioEvento();
    }

    function guardarSesionUsuario(usuario) {
        localStorage.setItem('sessionUser', JSON.stringify(usuario));
    }

    function actualizarMenuSesion(usuario) {
        const nombre = usuario.nombre || 'Usuario';
        const rol = usuario.tipo_usuario || 'Cliente';
        const userAvatar = document.getElementById('userAvatar') || document.getElementById('adminAvatar');
        const userName = document.getElementById('userName') || document.getElementById('adminNombre');
        const userRole = document.getElementById('userRole') || document.getElementById('adminRol');
        const menuUsuarioLogueado = document.getElementById('menuUsuarioLogueado');
        const menuUsuarioInvitado = document.getElementById('menuUsuarioInvitado');
        const menuMisCotizaciones = document.getElementById('menuMisCotizaciones');
        const menuGestionCotizaciones = document.getElementById('menuGestionCotizaciones');
        const menuPanelAdmin = document.getElementById('menuPanelAdmin');

        if (userAvatar) userAvatar.textContent = nombre.substring(0, 2).toUpperCase();
        if (userName) userName.textContent = nombre;
        if (userRole) userRole.textContent = rol;
        if (menuUsuarioLogueado) menuUsuarioLogueado.style.display = 'block';
        if (menuUsuarioInvitado) menuUsuarioInvitado.style.display = 'none';
        if (menuMisCotizaciones && rol === 'Cliente') menuMisCotizaciones.style.display = 'flex';
        if (menuGestionCotizaciones && (rol === 'Administrador' || rol === 'Admin')) menuGestionCotizaciones.style.display = 'flex';
        if (menuPanelAdmin && (rol === 'Administrador' || rol === 'Admin')) menuPanelAdmin.style.display = 'flex';
    }

    function obtenerLoginMarkup() {
        return `
            <p class="auth-modal-eyebrow">Cotizacion protegida</p>
            <h2 id="authModalTitle">Iniciar sesion</h2>
            <p class="auth-modal-text">Ingresa para continuar con tu cotizacion sin perder los servicios seleccionados.</p>
            <form class="auth-modal-form" data-auth-form="login">
                <div class="auth-modal-field">
                    <label for="auth_email">Email</label>
                    <input id="auth_email" name="email" type="email" autocomplete="email" required>
                </div>
                <div class="auth-modal-field">
                    <label for="auth_password">Contrasena</label>
                    <input id="auth_password" name="password" type="password" autocomplete="current-password" required>
                </div>
                <div class="auth-modal-message" data-auth-message role="status" aria-live="polite"></div>
                <button class="auth-modal-submit" type="submit">Iniciar sesion y continuar</button>
            </form>
            <p class="auth-modal-switch">No tienes cuenta? <button type="button" data-auth-mode="registro">Registrate aqui</button></p>
        `;
    }

    function obtenerRegistroMarkup() {
        return `
            <p class="auth-modal-eyebrow">Cliente nuevo</p>
            <h2 id="authModalTitle">Registro de Cliente</h2>
            <p class="auth-modal-text">Crea tu cuenta para guardar tu cotizacion y continuar con el formulario del evento.</p>
            <form class="auth-modal-form" data-auth-form="registro">
                <div class="auth-modal-field">
                    <label for="auth_nombre">Nombre</label>
                    <input id="auth_nombre" name="nombre" type="text" autocomplete="name" required>
                </div>
                <div class="auth-modal-field">
                    <label for="auth_reg_email">Email</label>
                    <input id="auth_reg_email" name="email" type="email" autocomplete="email" required>
                </div>
                <div class="auth-modal-field">
                    <label for="auth_telefono">Telefono</label>
                    <input id="auth_telefono" name="telefono" type="tel" inputmode="numeric" pattern="[0-9]+" autocomplete="tel" required>
                </div>
                <div class="auth-modal-field">
                    <label for="auth_reg_password">Contrasena</label>
                    <input id="auth_reg_password" name="password" type="password" autocomplete="new-password" minlength="6" required>
                </div>
                <div class="auth-modal-message" data-auth-message role="status" aria-live="polite"></div>
                <button class="auth-modal-submit" type="submit">Registrarme y continuar</button>
            </form>
            <p class="auth-modal-switch">Ya tienes cuenta? <button type="button" data-auth-mode="login">Inicia sesion</button></p>
        `;
    }

    function mostrarMensajeAuth(form, texto) {
        const mensaje = form.querySelector('[data-auth-message]');
        if (mensaje) mensaje.textContent = texto;
    }

    function setAuthLoading(form, botonSubmit, loading) {
        Array.from(form.elements).forEach((element) => {
            element.disabled = loading;
        });

        if (botonSubmit) {
            botonSubmit.textContent = loading ? 'Procesando...' : (form.dataset.authForm === 'login' ? 'Iniciar sesion y continuar' : 'Registrarme y continuar');
        }
    }

    function obtenerSupabaseClient() {
        if (!supabaseClientPromise) {
            const scriptServicios = document.querySelector('script[src$="js/servicios.js"]');
            const moduleUrl = new URL('../config/DatabaseConfig.js', scriptServicios?.src || window.location.href).href;
            supabaseClientPromise = import(moduleUrl).then((module) => module.supabase);
        }

        return supabaseClientPromise;
    }

    function asegurarBcryptDisponible() {
        if (window.dcodeIO?.bcrypt) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const scriptExistente = document.querySelector('script[data-bcryptjs]');
            if (scriptExistente) {
                scriptExistente.addEventListener('load', resolve, { once: true });
                scriptExistente.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/bcryptjs@2.4.3/dist/bcrypt.js';
            script.dataset.bcryptjs = 'true';
            script.onload = resolve;
            script.onerror = () => reject(new Error('No se pudo cargar bcryptjs.'));
            document.head.appendChild(script);
        });
    }

    function crearServicio(idServicio, categoria, titulo, descripcion, caracteristicas, ideal, precio, popularidad, imagen) {
        return { id_servicio: idServicio, categoria, titulo, descripcion, caracteristicas, ideal, precio, popularidad, imagen };
    }

    function obtenerChecks(nombre) {
        return Array.from(shell.querySelectorAll(`input[name="${nombre}"]:checked`)).map((input) => input.value);
    }

    function calcularSubtotal() {
        return serviciosSeleccionados.reduce((total, servicio) => total + (servicio.precio * servicio.cantidad), 0);
    }

    function calcularDescuento(subtotal) {
        return calcularCantidadTotal() >= 4 ? Math.round(subtotal * 0.1) : 0;
    }

    function formatearMoneda(valor) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(valor);
    }

    function normalizarTexto(valor) {
        return String(valor || '').trim();
    }

    function parseStoredJson(value) {
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('No se pudo leer la sesion guardada:', error);
            return null;
        }
    }

    function agregarServicioAlCarrito(servicio) {
        const servicioExistente = serviciosSeleccionados.find((item) => item.id_servicio === servicio.id_servicio);

        if (servicioExistente) {
            servicioExistente.cantidad += 1;
            return;
        }

        serviciosSeleccionados.push({ ...servicio, cantidad: 1 });
    }

    function normalizarCarritoExistente() {
        serviciosSeleccionados.forEach((servicio) => {
            servicio.id_servicio = servicio.id_servicio || servicio.id;
            servicio.cantidad = Number.isInteger(servicio.cantidad) && servicio.cantidad > 0 ? servicio.cantidad : 1;
        });
    }

    function calcularCantidadTotal() {
        return serviciosSeleccionados.reduce((total, servicio) => total + servicio.cantidad, 0);
    }

    function obtenerImagenFallback() {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 900 560%22%3E%3Cdefs%3E%3CradialGradient id=%22g%22 cx=%2270%25%22 cy=%2220%25%22 r=%2270%25%22%3E%3Cstop offset=%220%25%22 stop-color=%22%23ef111c%22 stop-opacity=%220.42%22/%3E%3Cstop offset=%2248%25%22 stop-color=%22%23151518%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23050505%22/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width=%22900%22 height=%22560%22 fill=%22url(%23g)%22/%3E%3Cg fill=%22none%22 stroke=%22%23ffffff%22 stroke-opacity=%220.32%22 stroke-width=%228%22%3E%3Cpath d=%22M245 355h410M305 290h290M365 225h170%22 stroke-linecap=%22round%22/%3E%3Ccircle cx=%22450%22 cy=%22285%22 r=%22155%22/%3E%3C/g%3E%3Ctext x=%22450%22 y=%22472%22 text-anchor=%22middle%22 fill=%22%23ffffff%22 fill-opacity=%220.72%22 font-family=%22Arial%22 font-size=%2236%22 font-weight=%22700%22%3ENaxMusic%3C/text%3E%3C/svg%3E';
    }

    function limpiarMensajeEvento() {
        mensajeEvento.textContent = '';
        mensajeEvento.className = 'event-message';
    }

    function mostrarMensajeEvento(texto, tipo) {
        mensajeEvento.textContent = texto;
        mensajeEvento.className = `event-message is-${tipo}`;
    }

    function iconoCarrito() {
        return `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L23 6H6"></path>
            </svg>
        `;
    }

    function iconoPapelera() {
        return `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
            </svg>
        `;
    }

    window.prepararCotizacionPayload = prepararCotizacionPayload;
    window.enviarCotizacionPendiente = enviarCotizacionPendiente;
})();
