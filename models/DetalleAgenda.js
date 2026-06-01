/**
 * Clase DetalleAgenda
 * Maneja los servicios asociados a una agenda
 */
class DetalleAgenda {

    constructor(db) {
        this.conn = db;
        this.tabla = "detalle_agenda";

        this.id_detalle_agenda = null;
        this.id_agenda = null;
        this.id_servicio = null;
        this.observaciones = null;
    }

    /**
     * Crear detalle de agenda
     */
    async crear() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    id_agenda: this.id_agenda,
                    id_servicio: this.id_servicio,
                    observaciones: this.observaciones
                }
            ]);

        return !error;
    }

    /**
     * Agregar o actualizar observacion
     */
    async agregarObservacion(obs) {
        this.observaciones = obs;

        const { data, error } = await this.conn
            .from(this.tabla)
            .update({ observaciones: this.observaciones })
            .eq('id_detalle_agenda', this.id_detalle_agenda);

        return !error;
    }
}

export default DetalleAgenda;