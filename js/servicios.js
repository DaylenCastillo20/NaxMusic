/**
 * Lógica de la Vista: Servicios (Optimizada para Enrutadores SPA)
 * Maneja exclusivamente la manipulación del DOM, filtros y eventos.
 */

window.serviciosSeleccionados = window.serviciosSeleccionados || [];

// Inicialización segura para entornos SPA
(function bootstrapServiciosView() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarCatalogo, { once: true });
    } else {
        inicializarCatalogo();
    }
})();

let serviciosGlobales = [];
let tabActivo = 'Todos';

// Función para obtener referencias FRESCAS del DOM en cada renderizado (Evita referencias null/huérfanas)
function obtenerElementosDOM() {
    return {
        grid: document.getElementById('contenedor-servicios'),
        precioMaximo: document.getElementById('precioMaximo'),
        precioActual: document.getElementById('precioActual'),
        ordenServicios: document.getElementById('ordenServicios'),
        limpiarFiltros: document.getElementById('limpiarFiltros'),
        shell: document.getElementById('servicesShell')
    };
}

async function inicializarCatalogo() {
    const dom = obtenerElementosDOM();

    // Si el enrutador SPA aún no ha inyectado el HTML, esperar 50ms y reintentar
    if (!dom.shell) {
        setTimeout(inicializarCatalogo, 50);
        return;
    }

    // Evitar duplicar listeners en la misma navegación
    if (dom.shell.dataset.initialized === 'true') return;
    dom.shell.dataset.initialized = 'true';

    mostrarEstadoCatalogo('Cargando servicios...');

    try {
        // ESPERA ACTIVA: Dar hasta 1 segundo para que el controlador se registre en el objeto window global
        let intentos = 0;
        while (typeof window.ServicioController === 'undefined' && intentos < 20) {
            await new Promise(resolve => setTimeout(resolve, 50));
            intentos++;
        }

        if (typeof window.ServicioController === 'undefined') {
            throw new Error("ServicioController no se encontró en el ámbito global 'window'.");
        }

        // Solicitar los datos limpios y normalizados al controlador
        serviciosGlobales = await window.ServicioController.obtenerServicios();

        if (!serviciosGlobales || serviciosGlobales.length === 0) {
            mostrarEstadoCatalogo('No hay servicios disponibles en este momento.');
            return;
        }

        configurarEventosFiltros();
        renderizarCarrito();
        actualizarVista();

    } catch (error) {
        console.error('Error al inicializar el catálogo:', error);
        mostrarEstadoCatalogo('No fue posible cargar los servicios. Revisa la consola.', 'error');
    }
}

function actualizarVista() {
    const serviciosFiltrados = aplicarFiltros(serviciosGlobales);

    if (serviciosFiltrados.length === 0) {
        mostrarEstadoCatalogo('No se encontraron servicios con los filtros actuales.');
    } else {
        renderizarTarjetas(serviciosFiltrados);
    }
}

function renderizarTarjetas(servicios) {
    const dom = obtenerElementosDOM();
    if (!dom.grid) return;

    dom.grid.innerHTML = servicios.map(servicio => `
<div class="service-card">
    <div class="service-media">
        <img src="${servicio.imagen_url}" alt="${servicio.nombre}">
        <button onclick="agregarAlCarrito('${servicio.id}')" class="service-favorite" title="Añadir al carrito">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px; margin: auto;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
        <span class="service-category">${servicio.categoria}</span>
    </div>

    <div class="service-body">
        <h3>${servicio.nombre}</h3>
        <p class="service-description">${servicio.descripcion}</p>
        
        <div class="service-tags">
            <span>${servicio.categoria === 'DJ' ? '+5 años exp.' : 'Hasta 500 pers.'}</span>
            <span>${servicio.categoria === 'DJ' ? 'Playlist personalizada' : 'Incluye transporte'}</span>
        </div>

        <div class="service-footer">
            <div class="service-price">
                Desde <strong>$${servicio.precio.toLocaleString()}</strong>
            </div>
            <button onclick="agregarAlCarrito('${servicio.id}')" class="service-add">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                Añadir
            </button>
        </div>
    </div>
</div>
    `).join('');
}

function aplicarFiltros(servicios) {
    const dom = obtenerElementosDOM();
    const categoriasSeleccionadas = Array.from(document.querySelectorAll('input[name="categoria"]:checked')).map(cb => cb.value);
    const idealesSeleccionados = Array.from(document.querySelectorAll('input[name="ideal"]:checked')).map(cb => cb.value);
    const precioLimite = dom.precioMaximo ? Number(dom.precioMaximo.value) : Infinity;

    return servicios
        .filter(servicio => tabActivo === 'Todos' || servicio.categoria === tabActivo)
        .filter(servicio => categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(servicio.categoria))
        .filter(servicio => idealesSeleccionados.length === 0 || idealesSeleccionados.some(ideal => servicio.ideal_para.includes(ideal)))
        .filter(servicio => servicio.precio <= precioLimite)
        .sort((a, b) => {
            if (dom.ordenServicios && dom.ordenServicios.value === 'precio-asc') return a.precio - b.precio;
            if (dom.ordenServicios && dom.ordenServicios.value === 'precio-desc') return b.precio - a.precio;
            return b.popularidad - a.popularidad;
        });
}

function configurarEventosFiltros() {
    const dom = obtenerElementosDOM();
    if (!dom.shell) return;

    // Limpiar listeners antiguos clonando los nodos (Vital en SPAs para no duplicar triggers)
    dom.shell.querySelectorAll('.services-tab').forEach(tab => {
        tab.replaceWith(tab.cloneNode(true));
    });

    // Re-vincular los eventos en los botones nuevos limpios
    obtenerElementosDOM().shell.querySelectorAll('.services-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabActivo = tab.dataset.tab;
            obtenerElementosDOM().shell.querySelectorAll('.services-tab').forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');
            actualizarVista();
        });
    });

    if (dom.precioMaximo) {
        dom.precioMaximo.addEventListener('input', (e) => {
            const actualDom = obtenerElementosDOM();
            if (actualDom.precioActual) actualDom.precioActual.textContent = `$${Number(e.target.value).toLocaleString()}`;
            actualizarVista();
        });
    }

    document.querySelectorAll('input[name="categoria"], input[name="ideal"]').forEach(cb => {
        cb.addEventListener('change', actualizarVista);
    });

    if (dom.ordenServicios) {
        dom.ordenServicios.addEventListener('change', actualizarVista);
    }

    if (dom.limpiarFiltros) {
        dom.limpiarFiltros.addEventListener('click', () => {
            tabActivo = 'Todos';
            const freshDom = obtenerElementosDOM();

            freshDom.shell.querySelectorAll('.services-tab').forEach(item => item.classList.remove('is-active'));
            freshDom.shell.querySelector('[data-tab="Todos"]')?.classList.add('is-active');

            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

            if (freshDom.precioMaximo) {
                freshDom.precioMaximo.value = freshDom.precioMaximo.max;
                if (freshDom.precioActual) freshDom.precioActual.textContent = `$${Number(freshDom.precioMaximo.value).toLocaleString()}`;
            }

            if (freshDom.ordenServicios) freshDom.ordenServicios.value = 'popular';

            actualizarVista();
        });
    }
}

function mostrarEstadoCatalogo(texto, tipo = 'empty') {
    const dom = obtenerElementosDOM();
    if (!dom.grid) return;
    dom.grid.innerHTML = `
        <div class="col-span-full flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-[#111317] p-8 text-center shadow-2xl">
            <p class="${tipo === 'error' ? 'text-red-400' : 'text-gray-400'} text-base font-semibold">${texto}</p>
        </div>
    `;
}

// -----------------------------------------------------
// Lógica del Carrito Global
// -----------------------------------------------------
window.agregarAlCarrito = function (idServicio) {
    const servicio = serviciosGlobales.find(s => String(s.id) === String(idServicio));
    if (!servicio) return;

    const existe = window.serviciosSeleccionados.find(s => String(s.id) === String(idServicio));
    if (existe) {
        existe.cantidad += 1;
    } else {
        window.serviciosSeleccionados.push({ ...servicio, cantidad: 1 });
    }

    renderizarCarrito();
};

function renderizarCarritoLegacy() {
    const listaCarrito = document.getElementById('listaCarrito');
    const contadorCarrito = document.getElementById('contadorCarrito');
    const subtotalCarrito = document.getElementById('subtotalCarrito');
    const totalCarrito = document.getElementById('totalCarrito');
    const botonSolicitar = document.getElementById('irAlCarrito');

    if (!listaCarrito) return;

    let total = 0;
    let cantidadTotal = 0;

    listaCarrito.innerHTML = window.serviciosSeleccionados.map(item => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;
        cantidadTotal += item.cantidad;

        return `
        <div class="flex justify-between items-center p-2 border-b border-gray-800 text-sm text-gray-300 mb-2">
            <div>
                <h4 class="font-bold text-white">${item.nombre}</h4>
                <div class="text-xs text-gray-500">$${item.precio.toLocaleString()} x ${item.cantidad}</div>
            </div>
            <button onclick="eliminarDelCarrito('${item.id}')" class="text-red-500 hover:text-red-700 text-xs font-bold px-2">✕</button>
        </div>
        `;
    }).join('');

    if (contadorCarrito) contadorCarrito.textContent = cantidadTotal;
    if (subtotalCarrito) subtotalCarrito.textContent = `$${total.toLocaleString()}`;
    if (totalCarrito) totalCarrito.textContent = `$${total.toLocaleString()}`;

    if (botonSolicitar) {
        botonSolicitar.disabled = window.serviciosSeleccionados.length === 0;
    }
}

function renderizarCarrito() {
    const listaCarrito = document.getElementById('listaCarrito');
    const contadorCarrito = document.getElementById('contadorCarrito');
    const subtotalCarrito = document.getElementById('subtotalCarrito');
    const totalCarrito = document.getElementById('totalCarrito');
    const botonSolicitar = document.getElementById('irAlCarrito');

    if (!listaCarrito) return;

    let total = 0;
    let cantidadTotal = 0;

    if (window.serviciosSeleccionados.length === 0) {
        listaCarrito.innerHTML = `
            <div class="cart-empty rounded-xl border border-white/5 bg-white/[0.03] px-4 py-5 text-sm text-gray-400">
                Aun no has agregado servicios.
            </div>
        `;
    } else {
        listaCarrito.innerHTML = window.serviciosSeleccionados.map(item => {
            const cantidad = Number(item.cantidad || 1);
            const precio = Number(item.precio || 0);
            const itemTotal = precio * cantidad;
            total += itemTotal;
            cantidadTotal += cantidad;

            return `
            <div class="cart-item group rounded-xl border border-white/5 bg-[#171a20]/80 p-3 text-sm text-gray-300 transition-all duration-200 hover:border-red-500/20 hover:bg-white/[0.06]">
                <div class="min-w-0">
                    <h4 class="truncate font-bold text-white">${item.nombre}</h4>
                    <div class="mt-1 text-xs text-gray-500">$${precio.toLocaleString()} x ${cantidad}</div>
                    <div class="mt-2 text-xs font-semibold text-gray-300">Subtotal: $${itemTotal.toLocaleString()}</div>
                </div>
                <button type="button" data-action="eliminar-carrito" data-id="${item.id}" class="cart-remove inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-600/10 hover:text-red-400 active:scale-95" aria-label="Eliminar ${item.nombre}">
                    <svg class="trash-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.9" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.35 9m-4.78 0L9.26 9m9.97-3.21c.34.05.67.1 1 .16m-1-.16L18.16 19.67A2.25 2.25 0 0 1 15.92 21H8.08a2.25 2.25 0 0 1-2.24-2.08L4.77 5.79m14.46 0a48.1 48.1 0 0 0-3.48-.33m-11 .33c-.34.05-.67.1-1 .16m1-.16a48.1 48.1 0 0 1 3.48-.33m7.52 0V4.54c0-1.18-.91-2.17-2.09-2.2a51.96 51.96 0 0 0-3.32 0c-1.18.03-2.09 1.02-2.09 2.2v.92m7.52 0a48.67 48.67 0 0 0-7.52 0" />
                    </svg>
                </button>
            </div>
            `;
        }).join('');
    }

    if (contadorCarrito) contadorCarrito.textContent = cantidadTotal;
    if (subtotalCarrito) subtotalCarrito.textContent = `$${total.toLocaleString()}`;
    if (totalCarrito) totalCarrito.textContent = `$${total.toLocaleString()}`;

    actualizarEstadoBotonCotizacion(botonSolicitar, total);
}

function actualizarEstadoBotonCotizacion(botonSolicitar, total = 0) {
    if (!botonSolicitar) return;

    const carritoVacio = window.serviciosSeleccionados.length === 0;
    botonSolicitar.disabled = carritoVacio;
    botonSolicitar.dataset.total = String(total);
    botonSolicitar.textContent = carritoVacio ? 'Solicitar Cotizacion' : 'Generar Cotizacion ->';

    botonSolicitar.classList.toggle('opacity-50', carritoVacio);
    botonSolicitar.classList.toggle('cursor-not-allowed', carritoVacio);
    botonSolicitar.classList.toggle('bg-red-600', !carritoVacio);
    botonSolicitar.classList.toggle('hover:bg-red-700', !carritoVacio);
    botonSolicitar.classList.toggle('cursor-pointer', !carritoVacio);
    botonSolicitar.classList.toggle('active:scale-95', !carritoVacio);
    botonSolicitar.classList.toggle('shadow-lg', !carritoVacio);
    botonSolicitar.classList.toggle('shadow-red-600/30', !carritoVacio);
}

window.eliminarDelCarrito = function (idServicio) {
    window.serviciosSeleccionados = window.serviciosSeleccionados.filter(s => String(s.id) !== String(idServicio));
    renderizarCarrito();
};

function obtenerTotalCarrito() {
    return window.serviciosSeleccionados.reduce((total, servicio) => {
        return total + (Number(servicio.precio) * Number(servicio.cantidad || 1));
    }, 0);
}

function guardarCotizacionEnStorage(total) {
    const servicios = window.serviciosSeleccionados.map(servicio => ({
        ...servicio,
        id_servicio: servicio.id_servicio || servicio.id,
        cantidad: Number(servicio.cantidad || 1),
        precio: Number(servicio.precio || 0),
        subtotal: Number(servicio.precio || 0) * Number(servicio.cantidad || 1)
    }));

    const payload = {
        servicios,
        total,
        creadoEn: new Date().toISOString()
    };

    sessionStorage.setItem('serviciosSeleccionados', JSON.stringify(servicios));
    sessionStorage.setItem('cotizacionTotal', JSON.stringify(total));
    sessionStorage.setItem('cotizacionServiciosEvento', JSON.stringify(payload));
}

function enviarCotizacionSeleccionada() {
    if (window.serviciosSeleccionados.length === 0) return;

    const total = obtenerTotalCarrito();
    guardarCotizacionEnStorage(total);

    const sessionUser = localStorage.getItem('sessionUser');

    if (sessionUser) {
        if (typeof window.cargarContenido === 'function') {
            window.cargarContenido('formulario_eventos');
        } else {
            window.location.assign('index.html');
        }
    } else {
        localStorage.setItem('redirectAfterLogin', 'formulario_eventos');
        if (typeof window.cargarContenido === 'function') {
            window.cargarContenido('login');
            if (typeof window.mostrarError === 'function') {
                window.mostrarError('Debes iniciar sesión para completar tu cotización');
            }
        } else {
            window.location.assign('index.html');
        }
    }
}

// Delegación segura del evento click para limpiar el carrito en SPAs
if (!window.__serviciosCarritoDelegationBound) {
    window.__serviciosCarritoDelegationBound = true;

    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target?.closest) return;

        const botonEliminar = target.closest('[data-action="eliminar-carrito"]');
        if (botonEliminar) {
            window.eliminarDelCarrito(botonEliminar.dataset.id);
            return;
        }

        if (target.closest('#vaciarCarrito')) {
            window.serviciosSeleccionados = [];
            renderizarCarrito();
            return;
        }

        const botonSolicitar = target.closest('#irAlCarrito');
        if (botonSolicitar && !botonSolicitar.disabled) {
            enviarCotizacionSeleccionada();
        }
    });
}
