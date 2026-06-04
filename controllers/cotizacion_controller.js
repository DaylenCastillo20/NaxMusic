import { supabase } from '../config/DatabaseConfig.js';
import Cotizacion from '../models/Cotizacion.js';

const camposRequeridos = [
    'nombre_evento',
    'fecha_evento',
    'hora_evento',
    'lugar',
    'cantidad_asistentes',
    'tipo_evento',
    'descripcion'
];

export function initCotizacionForm() {
    actualizarResumenCotizacion();

    const form = document.getElementById('cotizacionEventoForm');

    if (!form || form.dataset.initialized === 'true') {
        return;
    }

    form.dataset.initialized = 'true';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await guardarCotizacionDesdeFormulario(form);
    });
}

function actualizarResumenCotizacion() {
    const resumenServicios = document.getElementById('resumenServicios');
    const resumenTotal = document.getElementById('resumenTotal');

    if (!resumenServicios || !resumenTotal) return;

    try {
        const serviciosStr = sessionStorage.getItem('serviciosSeleccionados');
        const totalStr = sessionStorage.getItem('cotizacionTotal');

        if (serviciosStr && totalStr) {
            const servicios = JSON.parse(serviciosStr);
            const total = Number(totalStr);

            const cantidadTotal = servicios.reduce((acc, curr) => acc + (Number(curr.cantidad) || 1), 0);

            resumenServicios.textContent = `${cantidadTotal} servicio${cantidadTotal !== 1 ? 's' : ''}`;
            resumenTotal.textContent = `$${total.toLocaleString()}`;
        }
    } catch (e) {
        console.warn('Error al leer el resumen de cotización', e);
    }
}

export async function guardarCotizacionDesdeFormulario(form) {
    const mensaje = document.getElementById('cotizacionMensaje');
    const botonSubmit = form.querySelector('button[type="submit"]');
    const contenidoOriginalBoton = botonSubmit?.innerHTML || 'Generar cotizacion';

    try {
        limpiarMensaje(mensaje);

        const datosCotizacion = obtenerDatosFormulario(form);
        validarDatosCotizacion(datosCotizacion);
        const usuarioRegistrado = await obtenerUsuarioRegistrado();

        if (botonSubmit) {
            botonSubmit.disabled = true;
            botonSubmit.textContent = 'Procesando...';
        }

        const serviciosStr = sessionStorage.getItem('serviciosSeleccionados');
        const totalStr = sessionStorage.getItem('cotizacionTotal');
        
        let servicios = [];
        let total = 0;

        if (serviciosStr) {
            servicios = JSON.parse(serviciosStr);
        }
        if (totalStr) {
            total = Number(totalStr);
        }

        const cotizacion = new Cotizacion(supabase);
        await cotizacion.crearConDetalles({
            evento: {
                ...datosCotizacion,
                id_usuario: usuarioRegistrado?.id_usuario || null,
                nombre_cliente: usuarioRegistrado?.nombre || null
            },
            servicios: servicios,
            totales: { total: total },
            usuario: usuarioRegistrado
        });

        mostrarMensaje(mensaje, 'Cotización realizada con éxito', 'success');
        form.reset();
        
        sessionStorage.removeItem('serviciosSeleccionados');
        sessionStorage.removeItem('cotizacionTotal');
        sessionStorage.removeItem('cotizacionServiciosEvento');
        
        actualizarResumenCotizacion();
    } catch (error) {
        console.error('Error al guardar la cotizacion:', error);
        mostrarMensaje(mensaje, error.message || 'No se pudo guardar la cotizacion.', 'error');
    } finally {
        if (botonSubmit) {
            botonSubmit.disabled = false;
            botonSubmit.innerHTML = contenidoOriginalBoton;
        }
    }
}

function obtenerDatosFormulario(form) {
    const formData = new FormData(form);

    return {
        nombre_evento: normalizarTexto(formData.get('nombre_evento')),
        fecha_evento: normalizarTexto(formData.get('fecha_evento')),
        hora_evento: normalizarTexto(formData.get('hora_evento')),
        lugar: normalizarTexto(formData.get('lugar')),
        cantidad_asistentes: Number(formData.get('cantidad_asistentes')),
        tipo_evento: normalizarTexto(formData.get('tipo_evento')),
        descripcion: normalizarTexto(formData.get('descripcion'))
    };
}

async function obtenerUsuarioRegistrado() {
    const sessionUser = leerSesionUsuario();

    if (!sessionUser) {
        return null;
    }

    if (sessionUser.id_usuario && sessionUser.nombre) {
        return sessionUser;
    }

    if (!sessionUser.email) {
        return null;
    }

    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, email, tipo_usuario')
        .eq('email', sessionUser.email)
        .single();

    if (error || !usuario) {
        console.warn('No se pudo obtener el usuario registrado:', error);
        return null;
    }

    localStorage.setItem('sessionUser', JSON.stringify({
        ...sessionUser,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        tipo_usuario: usuario.tipo_usuario
    }));

    return usuario;
}

function leerSesionUsuario() {
    const sessionString = localStorage.getItem('sessionUser');

    if (!sessionString) {
        return null;
    }

    try {
        return JSON.parse(sessionString);
    } catch (error) {
        console.warn('No se pudo leer la sesion del usuario:', error);
        return null;
    }
}

function validarDatosCotizacion(datosCotizacion) {
    const tieneCamposVacios = camposRequeridos.some((campo) => {
        if (campo === 'cantidad_asistentes') {
            return !Number.isInteger(datosCotizacion[campo]) || datosCotizacion[campo] <= 0;
        }

        return !datosCotizacion[campo];
    });

    if (tieneCamposVacios) {
        throw new Error('Todos los campos son obligatorios.');
    }
}

function normalizarTexto(valor) {
    return String(valor || '').trim();
}

function limpiarMensaje(mensaje) {
    if (!mensaje) return;

    mensaje.textContent = '';
    mensaje.className = 'cotizacion-message';
}

function mostrarMensaje(mensaje, texto, tipo) {
    if (!mensaje) {
        alert(texto);
        return;
    }

    mensaje.textContent = texto;
    mensaje.className = `cotizacion-message ${tipo}`;
}

window.initCotizacionForm = initCotizacionForm;
