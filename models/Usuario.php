<?php

/**
 * Clase Usuario
 * Maneja la autenticacion y datos basicos del usuario.
 */
class Usuario {

    private $conn;
    private $tabla = "usuarios";

    public $id_usuario;
    public $tipo_usuario;
    public $nombre;
    public $email;
    public $password;

    // Constructor: recibe la conexion a la BD
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Autentica un usuario con email y contrasena
     */
    public function autenticar($email, $password) {

        // Buscar usuario por correo
        $query = "SELECT * FROM usuarios WHERE email=:email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificar contrasena
        if ($user && password_verify($password, $user['password'])) {
            return $user;
        }

        return false;
    }

    /**
     * Retorna el nombre del usuario
     */
    public function getNombre() {
        return $this->nombre;
    }

}
?>