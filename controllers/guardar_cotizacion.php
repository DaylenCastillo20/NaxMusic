<?php

date_default_timezone_set("America/Bogota");

require_once "../config/Database.php";
require_once "../models/Cotizacion.php";
require_once "../models/DetalleCotizacion.php";

// conexion BD
$db = (new Database())->conectar();

// recibir datos del formulario
$id_cliente = $_POST['id_cliente'];
$id_servicio = $_POST['id_servicio'];
$cantidad = $_POST['cantidad'];

// ==========================
// 1. CREAR COTIZACION
// ==========================

$cotizacion = new Cotizacion($db);

$cotizacion->id_cliente = $id_cliente;
$cotizacion->fecha_cotizacion = date("Y-m-d");
$cotizacion->total = 0;
$cotizacion->estado = "pendiente";

// guardar cotizacion
$id_cotizacion = $cotizacion->crear();

// ==========================
// 2. CREAR DETALLE
// ==========================

$detalle = new DetalleCotizacion($db);

$detalle->id_cotizacion = $id_cotizacion;
$detalle->id_servicio = $id_servicio;
$detalle->cantidad = $cantidad;

// calcular subtotal dinamico
$subtotal = $detalle->calcularSubtotal();
$detalle->subtotal = $subtotal;

// guardar detalle
$detalle->crear();

// ==========================
// 3. ACTUALIZAR TOTAL
// ==========================

$total = $cotizacion->calcularTotal();

$cotizacion->id_cotizacion = $id_cotizacion;
$cotizacion->total = $total;

// actualizar total en BD
$query = "UPDATE cotizaciones SET total=:total WHERE id_cotizacion=:id";
$stmt = $db->prepare($query);
$stmt->bindParam(":total", $total);
$stmt->bindParam(":id", $id_cotizacion);
$stmt->execute();

echo "Cotizacion guardada correctamente. Total: " . $total;

?>