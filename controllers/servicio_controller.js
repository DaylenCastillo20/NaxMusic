/**
 * Controlador de Servicios (MVC)
 * Maneja exclusivamente la lógica de negocio y comunicación con Supabase.
 */
// Encapsula la lógica de negocio y comunicación con BD
// relacionada a la gestión de servicios.
window.ServicioController = (function() {
    
    // Función privada para obtener el cliente de Supabase
    // Obtiene y retorna el cliente de Supabase asegurando
    // su correcta inicialización o importación.
    async function getSupabaseClient() {
        // Priorizar el cliente global ya inicializado por index.js
        if (window.supabase) {
            return window.supabase;
        }
        
        // Fallback para importación dinámica en caso de carga directa
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

    // Valida y prepara la información del servicio
    // antes de ser enviada a la base de datos.
    function prepararPayloadServicio(datosServicio) {
        const payload = {
            nombre: normalizarTexto(datosServicio && datosServicio.nombre),
            descripcion: normalizarTexto(datosServicio && datosServicio.descripcion),
            precio: Number(datosServicio && datosServicio.precio),
            categoria: normalizarTexto(datosServicio && datosServicio.categoria),
            imagen_url: normalizarTexto((datosServicio && datosServicio.imagen_url) || (datosServicio && datosServicio.imagen))
        };

        if (!payload.nombre || !payload.categoria || !payload.descripcion || !payload.imagen_url) {
            throw new Error('Todos los campos del servicio son obligatorios.');
        }

        if (!Number.isFinite(payload.precio) || payload.precio <= 0) {
            throw new Error('El precio debe ser un numero mayor a cero.');
        }

        return payload;
    }

    return {
        /**
         * Obtiene todos los servicios de la base de datos y los normaliza.
         * @returns {Promise<Array>} Array de objetos de servicio limpios.
         */
        // Consulta todos los servicios en la base de datos
        // y los devuelve con un formato consistente.
        obtenerServicios: async function() {
            try {
                const supabaseClient = await getSupabaseClient();
                
                // Realizar consulta a la base de datos
                const { data, error } = await supabaseClient
                    .from('servicios')
                    .select('*')
                    .order('id_servicio', { ascending: true });

                if (error) {
                    throw error;
                }

                if (!Array.isArray(data)) {
                    throw new Error("Formato de respuesta inválido de Supabase.");
                }

                // Normalización estricta de datos para la vista
                return data.map(servicio => ({
                    id: servicio.id_servicio || servicio.id, // Soportar ambos nombres comunes
                    nombre: servicio.nombre || servicio.titulo || 'Servicio sin nombre',
                    descripcion: servicio.descripcion || servicio.detalle || 'Sin descripción disponible',
                    precio: Number(servicio.precio || servicio.costo) || 0,
                    categoria: servicio.categoria || 'General',
                    ideal_para: Array.isArray(servicio.ideal) ? servicio.ideal : (servicio.ideal ? [servicio.ideal] : ['Eventos Generales']),
                    imagen_url: servicio.imagen_url || servicio.imagen || 'img/placeholder.jpg',
                    popularidad: Number(servicio.popularidad) || 0
                }));
                
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
                        imagen_url: payload.imagen_url
                    }])
                    .select('id_servicio, nombre, descripcion, precio, categoria, imagen_url')
                    .single();

                if (error) {
                    throw error;
                }

                return data;
            } catch (error) {
                console.error("Error en ServicioController.crearServicio:", error);
                throw error;
            }
        }
    };
})();
