

/**
 * Clase Usuario
 * Maneja la autenticacion y datos basicos del usuario.
 */
class Usuario {

    constructor(db) {
        this.conn = db;
        this.tabla = "usuarios";

        this.id_usuario = null;
        this.tipo_usuario = null;
        this.nombre = null;
        this.email = null;
        this.password = null;
    }

    /**
     * Autentica un usuario con email y contrasena
     */
    async autenticar(email, password) {

        // Buscar usuario por correo
        const { data: user, error } = await this.conn
            .from(this.tabla)
            .select('*')
            .eq('email', email)
            .limit(1)
            .single();

        if (error || !user) {
            return false;
        }

        /**
         * Verificación de contraseña:
         * En entornos de producción con JS debes cambiar la línea de abajo usando bcrypt:
         * const passwordCorrecto = await bcrypt.compare(password, user.password);
         */
        const passwordCorrecto = password === user.password;

        if (passwordCorrecto) {
            return user;
        }

        return false;
    }

    /**
     * Retorna el nombre del usuario
     */
    getNombre() {
        return this.nombre;
    }
}

export default Usuario;