/**
 * Clase DetalleCotizacion
 * Maneja los servicios incluidos en una cotizacion
 */
class DetalleCotizacion {

    constructor(db) {
        this.conn = db;
        this.tabla = "detalle_cotizacion";

        this.id_cotizacion = null;
        this.id_servicio = null;
        this.cantidad = null;
        this.subtotal = null;
    }

    /**
     * Crear detalle de cotizacion
     */
    async crear() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    id_cotizacion: this.id_cotizacion,
                    id_servicio: this.id_servicio,
                    cantidad: this.cantidad,
                    subtotal: this.subtotal
                }
            ]);

        return !error;
    }

    /**
     * Calcular subtotal basado en el precio del servicio
     */
    async calcularSubtotal() {
        if (this.cantidad <= 0) {
            return false;
        }

        // Obtener precio de la tabla servicios
        const { data: servicio, error } = await this.conn
            .from('servicios')
            .select('precio')
            .eq('id_servicio', this.id_servicio)
            .single();

        if (error || !servicio) {
            return false;
        }

        this.subtotal = servicio.precio * this.cantidad;

        return this.subtotal;
    }
}

export default DetalleCotizacion;