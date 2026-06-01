/**
 * Clase Servicio
 * Maneja los servicios del sistema (CRUD y precio)
 */
class Servicio {

    constructor(db) {
        this.conn = db;
        this.tabla = "servicios";

        this.id_servicio = null;
        this.nombre = null;
        this.descripcion = null;
        this.precio = null;
    }

    /**
     * Crear nuevo servicio
     */
    async crear() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    nombre: this.nombre,
                    descripcion: this.descripcion,
                    precio: this.precio
                }
            ]);

        return !error;
    }

    /**
     * Obtener todos los servicios
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
     * Actualizar servicio
     */
    async actualizar() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .update({
                nombre: this.nombre,
                descripcion: this.descripcion,
                precio: this.precio
            })
            .eq('id_servicio', this.id_servicio);

        return !error;
    }

    /**
     * Eliminar servicio
     */
    async eliminar() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .delete()
            .eq('id_servicio', this.id_servicio);

        return !error;
    }

    /**
     * Actualizar solo el precio
     */
    async actualizarPrecio(nuevoPrecio) {
        this.precio = nuevoPrecio;

        const { data, error } = await this.conn
            .from(this.tabla)
            .update({ precio: this.precio })
            .eq('id_servicio', this.id_servicio);

        return !error;
    }

    /**
     * Obtener precio del servicio
     */
    getPrecio() {
        return this.precio;
    }
}

export default Servicio;