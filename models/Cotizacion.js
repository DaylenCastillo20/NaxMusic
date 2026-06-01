/**
 * Clase Cotizacion
 * Maneja la creacion, consulta y calculo de cotizaciones
 */
class Cotizacion {

    constructor(db) {
        this.conn = db;
        this.tabla = "cotizaciones";

        this.id_cotizacion = null;
        this.id_cliente = null;
        this.fecha_cotizacion = null;
        this.total = null;
        this.estado = null;
    }

    async crearDesdeFormulario(datosEvento) {
        try {
            const fechaHoy = this.obtenerFechaActual();

            const { error } = await this.conn
                .from(this.tabla)
                .insert([
                    {
                        id_cliente: datosEvento.id_cliente,
                        nombre_cliente: datosEvento.nombre_cliente,
                        nombre_evento: datosEvento.nombre_evento,
                        fecha_evento: datosEvento.fecha_evento,
                        hora_evento: datosEvento.hora_evento,
                        lugar: datosEvento.lugar,
                        cantidad_asistentes: datosEvento.cantidad_asistentes,
                        tipo_evento: datosEvento.tipo_evento,
                        descripcion: datosEvento.descripcion,
                        fecha_cotizacion: fechaHoy,
                        estado: 'Pendiente'
                    }
                ]);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error en Cotizacion.crearDesdeFormulario:', error);
            throw error;
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
                    id_cliente: this.id_cliente,
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
