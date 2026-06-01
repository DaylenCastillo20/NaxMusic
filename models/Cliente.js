/**
 * Clase Cliente
 * Maneja el registro y gestion de datos del cliente
 */
class Cliente {

    constructor(db) {
        this.conn = db;
        this.tabla = "cliente";

        this.id_cliente = null;
        this.nombre = null;
        this.telefono = null;
        this.email = null;
    }

    /**
     * Registra nuevo cliente en la BD
     */
    async registrar() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .insert([
                {
                    nombre: this.nombre,
                    telefono: this.telefono,
                    email: this.email
                }
            ]);

        return !error;
    }

    /**
     * Actualizar datos del cliente
     */
    async actualizarDatos() {
        const { data, error } = await this.conn
            .from(this.tabla)
            .update({
                nombre: this.nombre,
                telefono: this.telefono,
                email: this.email
            })
            .eq('id_cliente', this.id_cliente);

        return !error;
    }

    /**
     * Obtener cotizaciones del cliente
     */
    async getCotizaciones() {
        const { data, error } = await this.conn
            .from('cotizaciones')
            .select('*')
            .eq('id_cliente', this.id_cliente);

        if (error) {
            return [];
        }

        return data; // Retorna un array de objetos (equivalente a FETCH_ASSOC)
    }
}

export default Cliente;