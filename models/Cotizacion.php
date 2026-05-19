<?php

/**
 * Clase Cotizacion
 * Maneja la creacion, consulta y calculo de cotizaciones
 */
class Cotizacion {

    private $conn;
    private $tabla = "cotizaciones";

    public $id_cotizacion;
    public $id_cliente;
    public $fecha_cotizacion;
    public $total;
    public $estado;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Crear nueva cotizacion
     */
    public function crear() {

        $query = "INSERT INTO ".$this->tabla."
                  SET id_cliente=:cliente, fecha_cotizacion=:fecha, total=:total, estado=:estado";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":cliente", $this->id_cliente);
        $stmt->bindParam(":fecha", $this->fecha_cotizacion);
        $stmt->bindParam(":total", $this->total);
        $stmt->bindParam(":estado", $this->estado);

        // Retorna el id generado
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Obtener todas las cotizaciones
     */
    public function leer() {

        $stmt = $this->conn->prepare("SELECT * FROM ".$this->tabla);
        $stmt->execute();

        return $stmt;
    }

    public function calcularTotal() {

    $query = "SELECT SUM(subtotal) as total 
              FROM detalle_cotizacion 
              WHERE id_cotizacion=:id";

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":id", $this->id_cotizacion);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row['total'] ?? 0;
    }

    /**
     * Cambiar estado de la cotizacion
     */
    public function cambiarEstado($estado) {

        $query = "UPDATE ".$this->tabla."
                  SET estado=:estado 
                  WHERE id_cotizacion=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":estado", $estado);
        $stmt->bindParam(":id", $this->id_cotizacion);

        return $stmt->execute();
    }

    /**
     * Obtener detalles de la cotizacion
     */
    public function getDetalles() {

        $query = "SELECT * FROM detalle_cotizacion WHERE id_cotizacion=:id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cotizacion);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

}
?>
