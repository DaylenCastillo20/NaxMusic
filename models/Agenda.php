<?php

/**
 * Clase Agenda
 * Maneja la programacion y gestion de citas/eventos
 */
class Agenda {

    private $conn;
    private $tabla = "agenda";

    public $id_agenda; 
    public $id_cliente;
    public $fecha;
    public $hora_inicio;
    public $hora_fin;
    public $estado;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Crear nueva agenda
     */
    public function agendar() {

        $query = "INSERT INTO ".$this->tabla."
                  SET id_cliente=:cliente, fecha=:fecha, hora_inicio=:ini, hora_fin=:fin, estado=:estado";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":cliente", $this->id_cliente);
        $stmt->bindParam(":fecha", $this->fecha);
        $stmt->bindParam(":ini", $this->hora_inicio);
        $stmt->bindParam(":fin", $this->hora_fin);
        $stmt->bindParam(":estado", $this->estado);

        return $stmt->execute();
    }


    /**
     * Cancelar agenda cambiando estado
     */
    public function cancelar() {

        $query = "UPDATE ".$this->tabla."
                  SET estado='cancelada' 
                  WHERE id_agenda=:id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_agenda);

        return $stmt->execute();
    }

}
?>