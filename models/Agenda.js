/**
 * Clase Agenda
 * Maneja la programacion y gestion de citas/eventos
 */
class Agenda {

    constructor(db) {
        this.conn = db; // Instancia del cliente de Supabase
        this.tabla = "agenda";

        this.id_agenda = null;
        this.id_cliente = null;
        this.fecha = null;
        this.hora_inicio = null;
        this.hora_fin = null;
        this.estado = null;
    }

    /**
     * Crear nueva agenda
     */
    async agendar() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    id_cliente: this.id_cliente,
                    fecha: this.fecha,
                    hora_inicio: this.hora_inicio,
                    hora_fin: this.hora_fin,
                    estado: this.estado
                }
            ]);

        return !error;
    }

    /**
     * Cancelar agenda cambiando estado
     */
    async cancelar() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .update({ estado: 'cancelada' })
            .eq('id_agenda', this.id_agenda);

        return !error;
    }
}

export default Agenda;