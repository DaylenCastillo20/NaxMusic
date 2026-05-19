<?php

/**
 * Clase Cliente
 * Maneja el registro y gestion de datos del cliente
 */
class Cliente {

    private $conn;
    private $tabla = "cliente"; // tabla real en la BD

    public $id_cliente;
    public $nombre;
    public $telefono;
    public $email;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Registra nuevo cliente en la BD
     */
    public function registrar() {

        // Consulta SQL para insertar
        $query = "INSERT INTO ".$this->tabla."
                  SET nombre=:nombre, telefono=:telefono, email=:email";

        $stmt = $this->conn->prepare($query);

        // Vincular parametros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":email", $this->email);

        return $stmt->execute();
    }

    /**
     * Actualizar datos del cliente
     */
    public function actualizarDatos() {

        $query = "UPDATE ".$this->tabla."
                  SET nombre=:nombre, telefono=:telefono, email=:email
                  WHERE id_cliente=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":id", $this->id_cliente);

        return $stmt->execute();
    }

    /**
     * Obtener cotizaciones del cliente
     */
    public function getCotizaciones() {

        $query = "SELECT * FROM cotizaciones WHERE id_cliente=:id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id_cliente);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

}
?>
