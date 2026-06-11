/**
 * Controlador de Servicios (MVC)
 * Maneja exclusivamente la logica de negocio y comunicacion con Supabase.
 */
// Encapsula la logica de negocio, cache y comunicacion con BD
// relacionada a la gestion de servicios.
window.ServicioController = (function() {
    const CACHE_KEY = 'catalogoServicios';
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const cacheMemoria = window.__catalogoServiciosCache || {
        timestamp: 0,
        data: null
    };

    window.__catalogoServiciosCache = cacheMemoria;

    // Funcion privada para obtener el cliente de Supabase
    // Obtiene y retorna el cliente de Supabase asegurando
    // su correcta inicializacion o importacion.
    async function getSupabaseClient() {
        // Priorizar el cliente global ya inicializado por index.js
        if (window.supabase) {
            return window.supabase;
        }

        // Fallback para importacion dinamica en caso de carga directa
        const scriptActual = document.querySelector('script[src*="servicio_controller.js"]');
        const moduleUrl = scriptActual
            ? new URL('../config/DatabaseConfig.js', scriptActual.src).href
            : new URL('config/DatabaseConfig.js', document.baseURI || window.location.href).href;
        const module = await import(moduleUrl);
        return module.supabase;
    }

    // Recorta espacios de los extremos del texto
    // asegurando un formato de string seguro.
    function normalizarTexto(valor) {
        return String(valor || '').trim();
    }

    // Verifica que el cache tenga la estructura esperada
    // y que no haya superado su tiempo de expiracion.
    function cacheVigente(cache) {
        return Boolean(
            cache &&
            Number.isFinite(cache.timestamp) &&
            Array.isArray(cache.data) &&
            Date.now() - cache.timestamp < CACHE_TTL_MS
        );
    }

    // Lee primero el cache en RAM, que es el origen
    // mas rapido dentro de la misma sesion SPA.
    function leerCacheMemoria() {
        if (!cacheVigente(cacheMemoria)) {
            return null;
        }

        console.info('[CACHE RAM]');
        return cacheMemoria.data;
    }

    // Recupera el catalogo guardado en sessionStorage
    // y descarta entradas corruptas o vencidas.
    function leerCacheSession() {
        try {
            const rawCache = sessionStorage.getItem(CACHE_KEY);
            if (!rawCache) return null;

            const cache = JSON.parse(rawCache);
            if (!cacheVigente(cache)) {
                sessionStorage.removeItem(CACHE_KEY);
                return null;
            }

            cacheMemoria.timestamp = cache.timestamp;
            cacheMemoria.data = cache.data;
            window.catalogoServicios = cache.data;

            console.info('[CACHE SESSION]');
            return cache.data;
        } catch (error) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    // Guarda el resultado normalizado en RAM y sessionStorage
    // para evitar lecturas repetidas a Supabase.
    function guardarCacheServicios(servicios) {
        const payload = {
            timestamp: Date.now(),
            data: servicios
        };

        cacheMemoria.timestamp = payload.timestamp;
        cacheMemoria.data = payload.data;
        window.catalogoServicios = payload.data;

        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Si el navegador bloquea sessionStorage, el cache en RAM sigue funcionando.
        }
    }

    // Invalida el cache del catalogo para futuros CRUD de servicios.
    function limpiarCacheServicios() {
        cacheMemoria.timestamp = 0;
        cacheMemoria.data = null;
        window.catalogoServicios = [];
        window.__catalogoServiciosPromise = null;
        sessionStorage.removeItem(CACHE_KEY);
    }

    function normalizarServicio(servicio) {
        return {
            id: servicio.id_servicio || servicio.id, // Soportar ambos nombres comunes
            nombre: servicio.nombre || servicio.titulo || 'Servicio sin nombre',
            descripcion: servicio.descripcion || servicio.detalle || 'Sin descripcion disponible',
            precio: Number(servicio.precio || servicio.costo) || 0,
            categoria: servicio.categoria || 'General',
            ideal_para: Array.isArray(servicio.ideal) ? servicio.ideal : (servicio.ideal ? [servicio.ideal] : ['Eventos Generales']),
            imagen_url: servicio.imagen_url || servicio.imagen || 'img/placeholder.jpg',
            popularidad: Number(servicio.popularidad) || 0
        };
    }

    async function consultarServiciosSupabase() {
        const supabaseClient = await getSupabaseClient();

        const { data, error } = await supabaseClient
            .from('servicios')
            .select('*')
            .order('id_servicio', { ascending: true });

        if (error) {
            throw error;
        }

        if (!Array.isArray(data)) {
            throw new Error("Formato de respuesta invalido de Supabase.");
        }

        console.info('[SUPABASE]');
        return data.map(normalizarServicio);
    }

    // Valida y prepara la informacion del servicio
    // antes de ser enviada a la base de datos.
    function prepararPayloadServicio(datosServicio) {
        const payload = {
            nombre: normalizarTexto(datosServicio && datosServicio.nombre),
            descripcion: normalizarTexto(datosServicio && datosServicio.descripcion),
            precio: Number(datosServicio && datosServicio.precio),
            categoria: normalizarTexto(datosServicio && datosServicio.categoria),
            ideal: normalizarTexto(datosServicio && datosServicio.ideal),
            imagen_url: normalizarTexto((datosServicio && datosServicio.imagen_url) || (datosServicio && datosServicio.imagen))
        };

        if (!payload.nombre || !payload.categoria || !payload.ideal || !payload.descripcion || !payload.imagen_url) {
            throw new Error('Todos los campos del servicio son obligatorios.');
        }

        if (!Number.isFinite(payload.precio) || payload.precio <= 0) {
            throw new Error('El precio debe ser un numero mayor a cero.');
        }

        return payload;
    }

    return {
        /**
         * Obtiene todos los servicios priorizando RAM, sessionStorage y Supabase.
         * @returns {Promise<Array>} Array de objetos de servicio limpios.
         */
        // Consulta todos los servicios con cache inteligente
        // y los devuelve con un formato consistente.
        obtenerServicios: async function() {
            try {
                const cacheRam = leerCacheMemoria();
                if (cacheRam) {
                    return cacheRam;
                }

                const cacheSession = leerCacheSession();
                if (cacheSession) {
                    return cacheSession;
                }

                if (!window.__catalogoServiciosPromise) {
                    window.__catalogoServiciosPromise = consultarServiciosSupabase()
                        .then((servicios) => {
                            guardarCacheServicios(servicios);
                            return servicios;
                        })
                        .finally(() => {
                            window.__catalogoServiciosPromise = null;
                        });
                }

                return await window.__catalogoServiciosPromise;

            } catch (error) {
                console.error("Error en ServicioController.obtenerServicios:", error);
                throw error; // Relanzar el error para que la vista lo maneje
            }
        },

        /**
         * Crea un nuevo servicio en Supabase.
         * @param {Object} datosServicio Datos del formulario de administracion.
         * @returns {Promise<Object>} Servicio insertado.
         */
        // Inserta un nuevo servicio en la base de datos
        // validando previamente su estructura y datos.
        crearServicio: async function(datosServicio) {
            try {
                const supabaseClient = await getSupabaseClient();
                const payload = prepararPayloadServicio(datosServicio);

                const { data, error } = await supabaseClient
                    .from('servicios')
                    .insert([{
                        nombre: payload.nombre,
                        descripcion: payload.descripcion,
                        precio: payload.precio,
                        categoria: payload.categoria,
                        ideal: payload.ideal,
                        imagen_url: payload.imagen_url
                    }])
                    .select('id_servicio, nombre, descripcion, precio, categoria, ideal, imagen_url')
                    .single();

                if (error) {
                    throw error;
                }

                limpiarCacheServicios();
                return data;
            } catch (error) {
                console.error("Error en ServicioController.crearServicio:", error);
                throw error;
            }
        },

        limpiarCacheServicios
    };
})();

window.limpiarCacheServicios = window.ServicioController.limpiarCacheServicios;
