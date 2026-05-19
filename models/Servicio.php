<?php

/**
 * Clase Servicio
 * Maneja los servicios del sistema (CRUD y precio)
 */
class Servicio {

    private $conn;
    private $tabla = "servicios";

    public $id_servicio;
    public $nombre;
    public $descripcion;
    public $precio;

    // Constructor: recibe la conexion
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Crear nuevo servicio
     */
    public function crear() {

        $query = "INSERT INTO ".$this->tabla."
                  SET nombre=:nombre, descripcion=:descripcion, precio=:precio";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":precio", $this->precio);

        return $stmt->execute();
    }

    /**
     * Obtener todos los servicios
     */
    public function leer() {

        $stmt = $this->conn->prepare("SELECT * FROM ".$this->tabla);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Actualizar servicio
     */
    public function actualizar() {

        $query = "UPDATE ".$this->tabla."
                  SET nombre=:nombre, descripcion=:descripcion, precio=:precio
                  WHERE id_servicio=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":precio", $this->precio);
        $stmt->bindParam(":id", $this->id_servicio);

        return $stmt->execute();
    }

    /**
     * Eliminar servicio
     */
    public function eliminar() {

        $stmt = $this->conn->prepare(
            "DELETE FROM ".$this->tabla." WHERE id_servicio=:id"
        );

        $stmt->bindParam(":id", $this->id_servicio);

        return $stmt->execute();
    }

    /**
     * Actualizar solo el precio
     */
    public function actualizarPrecio($nuevoPrecio) {

        $this->precio = $nuevoPrecio;

        $query = "UPDATE ".$this->tabla."
                  SET precio=:precio WHERE id_servicio=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":precio", $this->precio);
        $stmt->bindParam(":id", $this->id_servicio);

        return $stmt->execute();
    }

    /**
     * Obtener precio del servicio
     */
    public function getPrecio() {
        return $this->precio;
    }

}
?>