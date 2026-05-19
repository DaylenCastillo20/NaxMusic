<?php

/**
 * Clase DetalleCotizacion
 * Maneja los servicios incluidos en una cotizacion
 */
class DetalleCotizacion {

    private $conn;
    private $tabla = "detalle_cotizacion";

    public $id_cotizacion;
    public $id_servicio;
    public $cantidad;
    public $subtotal;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Crear detalle de cotizacion
     */
    public function crear() {

        $query = "INSERT INTO ".$this->tabla."
                  SET id_cotizacion=:cot, id_servicio=:serv, cantidad=:cant, subtotal=:sub";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":cot", $this->id_cotizacion);
        $stmt->bindParam(":serv", $this->id_servicio);
        $stmt->bindParam(":cant", $this->cantidad);
        $stmt->bindParam(":sub", $this->subtotal);

        return $stmt->execute();
    }

    /**
     * Calcular subtotal basado en el precio del servicio
     */
    public function calcularSubtotal() {

    if ($this->cantidad <= 0) {
        return false;
    }

    $query = "SELECT precio FROM servicios WHERE id_servicio=:id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":id", $this->id_servicio);
    $stmt->execute();

    $servicio = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$servicio) {
        return false;
    }

    $this->subtotal = $servicio['precio'] * $this->cantidad;

    return $this->subtotal;
    }

}
?>
