import bcrypt from 'bcrypt';
import { supabase } from '../config/DatabaseConfig.js';

// Registra un nuevo usuario en la base de datos
// validando sus datos y encriptando su contraseña.
export const registroController = async (req, res) => {
    // Evitar que el navegador guarde la pagina en el historial de cache
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
    });

    const db = supabase;

    // recibir datos
    const nombre = req.body.nombre;
    const email = req.body.email;
    const password = req.body.password;
    const confirmar = req.body.confirmar;

    // verificar si el email ya existe (Equivalente al SELECT con Supabase)
    const { data: stmtCheck, error: checkError } = await db
        .from('usuarios')
        .select('id_usuario')
        .eq('email', email);

    // rowCount() > 0 se traduce en verificar si el array tiene elementos
    if (stmtCheck && stmtCheck.length > 0) {
        return res.redirect('../index.html?error=registro_pass');
    }

    // validar contrasenas
    if (password !== confirmar) {
        return res.redirect('../index.html?error=registro_pass');
    }

    // encriptar contrasena (Equivalente a PASSWORD_DEFAULT de PHP)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // insertar usuario (Equivalente al INSERT)
    const { error: insertError } = await db
        .from('usuarios')
        .insert([
            {
                tipo_usuario: 'Cliente',
                nombre: nombre,
                email: email,
                password: passwordHash
            }
        ]);

    if (!insertError) {
        // redirigir al login
        return res.redirect('../index.html?login=1');
    } else {
        return res.redirect('../index.html?error=registro_pass');
    }
};