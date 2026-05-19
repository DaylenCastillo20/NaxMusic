<?php

/**
 * Clase DetalleAgenda
 * Maneja los servicios asociados a una agenda
 */
class DetalleAgenda {

    private $conn;
    private $tabla = "detalle_agenda";

    public $id_detalle_agenda; 
    public $id_agenda;
    public $id_servicio;
    public $observaciones;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Crear detalle de agenda
     */
    public function crear() {

        $query = "INSERT INTO ".$this->tabla."
                  SET id_agenda=:agenda, id_servicio=:servicio, observaciones=:obs";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":agenda", $this->id_agenda);
        $stmt->bindParam(":servicio", $this->id_servicio);
        $stmt->bindParam(":obs", $this->observaciones);

        return $stmt->execute();
    }

    /**
     * Agregar o actualizar observacion
     */
    public function agregarObservacion($obs) {

        $this->observaciones = $obs;

        $query = "UPDATE ".$this->tabla."
                  SET observaciones=:obs
                  WHERE id_detalle_agenda=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":obs", $this->observaciones);
        $stmt->bindParam(":id", $this->id_detalle_agenda);

        return $stmt->execute();
    }

}
?>