import Cotizacion from '../models/Cotizacion.js';
import DetalleCotizacion from '../models/DetalleCotizacion.js';
import { supabase } from '../config/DatabaseConfig.js'; // Asumiendo que exportas tu cliente de Supabase desde aquí

export const guardarCotizacion = async (req, res) => {
    const db = supabase;

    // recibir datos del formulario
    const id_cliente = req.body.id_cliente;
    const id_servicio = req.body.id_servicio;
    const cantidad = req.body.cantidad;

    // ==========================
    // 1. CREAR COTIZACION
    // ==========================
    const cotizacion = new Cotizacion(db);

    cotizacion.id_cliente = id_cliente;
    // Formatear la fecha actual a "YYYY-MM-DD"
    cotizacion.fecha_cotizacion = new Date().toISOString().split('T')[0];
    cotizacion.total = 0;
    cotizacion.estado = "pendiente";

    // guardar cotizacion
    const id_cotizacion = await cotizacion.crear();

    // ==========================
    // 2. CREAR DETALLE
    // ==========================
    const detalle = new DetalleCotizacion(db);

    detalle.id_cotizacion = id_cotizacion;
    detalle.id_servicio = id_servicio;
    detalle.cantidad = cantidad;

    // calcular subtotal dinamico
    const subtotal = await detalle.calcularSubtotal();
    detalle.subtotal = subtotal;

    // guardar detalle
    await detalle.crear();

    // ==========================
    // 3. ACTUALIZAR TOTAL
    // ==========================
    cotizacion.id_cotizacion = id_cotizacion;
    const total = await cotizacion.calcularTotal();

    cotizacion.total = total;

    // actualizar total en BD usando sintaxis de Supabase
    const { error } = await db
        .from('cotizaciones')
        .update({ total: total })
        .eq('id_cotizacion', id_cotizacion);

    if (error) {
        return res.status(500).send("Error al actualizar la cotización");
    }

    res.send("Cotizacion guardada correctamente. Total: " + total);
};