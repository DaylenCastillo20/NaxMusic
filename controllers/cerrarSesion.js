export const cerrarSesion = async (req, res) => {
    // destruir la sesion (asumiendo el uso de express-session)
    if (req.session) {
        req.session.destroy();
    }

    /* * NOTA PARA SUPABASE: Si en el futuro usas la autenticación nativa de Supabase, 
     * deberás descomentar la siguiente línea:
     * await supabase.auth.signOut();
     */

    // redirigir al inicio (en JS usamos res.redirect en lugar de header("Location: ..."))
    return res.redirect('../index.html');
};