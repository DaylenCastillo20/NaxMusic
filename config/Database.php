<?php

/**
 * Clase Database
 * Maneja la conexion a la base de datos
 */
class Database {

    private $host = "localhost";
    private $db_name = "naxmusic_bd";
    private $username = "root";
    private $password = "";
    public $conn;

    /**
     * Conectar a la BD
     */
    public function conectar() {

        $this->conn = null;

        try {
            // Crear conexion PDO
            $this->conn = new PDO(
                "mysql:host=".$this->host.";dbname=".$this->db_name,
                $this->username,
                $this->password
            );

            // Configuracion de caracteres
            $this->conn->exec("set names utf8");

        } catch(PDOException $e) {

            // Mostrar error si falla conexion
            echo "Error: " . $e->getMessage();
        }

        return $this->conn;
    }

}
?>