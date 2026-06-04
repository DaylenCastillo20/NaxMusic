/**
 * Clase Cotizacion
 * Maneja la creacion, consulta y calculo de cotizaciones
 */
class Cotizacion {

    constructor(db) {
        this.conn = db;
        this.tabla = "cotizaciones";

        this.id_cotizacion = null;
        this.id_usuario = null;
        this.id_cliente = null;
        this.fecha_cotizacion = null;
        this.total = null;
        this.estado = null;
    }

    async crearDesdeFormulario(datosEvento) {
        try {
            const fechaHoy = this.obtenerFechaActual();

            const { data, error } = await this.conn
                .from(this.tabla)
                .insert([
                    {
                        id_usuario: this.normalizarEntero(datosEvento.id_usuario ?? datosEvento.id_cliente),
                        nombre_cliente: datosEvento.nombre_cliente,
                        nombre_evento: datosEvento.nombre_evento,
                        fecha_evento: datosEvento.fecha_evento,
                        hora_evento: datosEvento.hora_evento,
                        lugar: datosEvento.lugar,
                        cantidad_asistentes: datosEvento.cantidad_asistentes,
                        tipo_evento: datosEvento.tipo_evento,
                        descripcion: datosEvento.descripcion,
                        fecha_cotizacion: fechaHoy,
                        total: Number(datosEvento.total || 0),
                        estado: 'Pendiente'
                    }
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error en Cotizacion.crearDesdeFormulario:', error);
            throw error;
        }
    }

    async crearConDetalles({ evento, servicios, totales, usuario }) {
        let cotizacionCreada = null;

        try {
            if (!evento) {
                throw new Error('No se recibieron los datos del evento.');
            }

            if (!Array.isArray(servicios) || servicios.length === 0) {
                throw new Error('Agrega al menos un servicio antes de generar la cotizacion.');
            }

            const total = Number(totales?.total ?? servicios.reduce((acc, servicio) => {
                return acc + Number(servicio.subtotal || (servicio.precio * servicio.cantidad) || 0);
            }, 0));

            const { data, error } = await this.conn
                .from(this.tabla)
                .insert([
                    {
                        id_usuario: this.normalizarEntero(usuario?.id_usuario ?? evento.id_usuario ?? evento.id_cliente),
                        fecha_cotizacion: this.obtenerFechaActual(),
                        total,
                        estado: 'Pendiente',
                        nombre_cliente: evento.nombre_cliente || usuario?.nombre || usuario?.email || null,
                        lugar: evento.lugar,
                        tipo_evento: evento.tipo_evento,
                        cantidad_asistentes: Number(evento.cantidad_asistentes),
                        nombre_evento: evento.nombre_evento,
                        fecha_evento: evento.fecha_evento,
                        hora_evento: evento.hora_evento,
                        descripcion: evento.descripcion
                    }
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            cotizacionCreada = data;

            const detalles = servicios.map((servicio) => this.prepararDetalleCotizacion(servicio, data.id_cotizacion));
            const { error: detalleError } = await this.conn
                .from('detalle_cotizacion')
                .insert(detalles);

            if (detalleError) {
                throw detalleError;
            }

            return {
                ...data,
                detalles
            };
        } catch (error) {
            if (cotizacionCreada?.id_cotizacion) {
                await this.eliminarCotizacionIncompleta(cotizacionCreada.id_cotizacion);
            }

            console.error('Error en Cotizacion.crearConDetalles:', error);
            throw error;
        }
    }

    prepararDetalleCotizacion(servicio, idCotizacion) {
        const idServicio = this.normalizarEntero(servicio.id_servicio);
        const cantidad = Number(servicio.cantidad || 0);
        const subtotal = Number(servicio.subtotal || (Number(servicio.precio || 0) * cantidad));

        if (!idServicio) {
            throw new Error(`El servicio "${servicio.titulo || servicio.nombre || 'sin nombre'}" no tiene un id_servicio valido.`);
        }

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error(`La cantidad del servicio "${servicio.titulo || servicio.nombre || idServicio}" no es valida.`);
        }

        return {
            id_cotizacion: idCotizacion,
            id_servicio: idServicio,
            cantidad,
            subtotal
        };
    }

    normalizarEntero(valor) {
        if (valor === null || valor === undefined || valor === '') {
            return null;
        }

        const numero = Number(valor);
        return Number.isInteger(numero) && numero > 0 ? numero : null;
    }

    async eliminarCotizacionIncompleta(idCotizacion) {
        const { error } = await this.conn
            .from(this.tabla)
            .delete()
            .eq('id_cotizacion', idCotizacion);

        if (error) {
            console.warn('No se pudo revertir la cotizacion incompleta:', error);
        }
    }

    obtenerFechaActual() {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    /**
     * Crear nueva cotizacion
     */
    async crear() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    id_usuario: this.normalizarEntero(this.id_usuario ?? this.id_cliente),
                    fecha_cotizacion: this.fecha_cotizacion,
                    total: this.total,
                    estado: this.estado
                }
            ])
            .select('id_cotizacion')
            .single(); // Devuelve directamente el registro creado para emular lastInsertId

        if (error || !data) {
            return false;
        }

        return data.id_cotizacion;
    }

    /**
     * Obtener todas las cotizaciones
     */
    async leer() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .select('*');

        if (error) {
            return [];
        }

        return data;
    }

    /**
     * Calcular total sumando los subtotales de los detalles
     */
    async calcularTotal() {
        const { data, error } = await this.conn
            .from('detalle_cotizacion')
            .select('subtotal')
            .eq('id_cotizacion', this.id_cotizacion);

        if (error || !data) {
            return 0;
        }

        // Sumariza el campo subtotal emulando el SUM() de SQL en cliente de forma óptima
        const totalCalculado = data.reduce((acc, row) => acc + Number(row.subtotal || 0), 0);

        return totalCalculado;
    }

    /**
     * Cambiar estado de la cotizacion
     */
    async cambiarEstado(estado) {
        const { data, error } = await this.conn
            .from(this.tabla)
            .update({ estado: estado })
            .eq('id_cotizacion', this.id_cotizacion);

        return !error;
    }

    /**
     * Obtener detalles de la cotizacion
     */
    async getDetalles() {
        const { data, error } = await this.conn
            .from('detalle_cotizacion')
            .select('*')
            .eq('id_cotizacion', this.id_cotizacion);

        if (error) {
            return [];
        }

        return data;
    }
}

export default Cotizacion;
