import Usuario from '../models/Usuario.js';
import { supabase } from '../config/DatabaseConfig.js';

// Autentica el inicio de sesión del usuario
// y establece las variables de sesión correspondientes.
export const loginController = async (req, res) => {
    // Evitar que el navegador guarde la pagina en el historial de cache
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
    });

    const db = supabase;
    const usuario = new Usuario(db);

    // recibir datos
    const email = req.body.email;
    const password = req.body.password;

    // autenticar
    const user = await usuario.autenticar(email, password);

    if (user) {
        // Asignar variables de sesión (asumiendo express-session)
        req.session.nombre = user.nombre;
        req.session.rol = user.tipo_usuario;

        return res.redirect('../index.html');
    } else {
        return res.redirect('../index.html?error=login');
    }
};