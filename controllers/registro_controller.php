<?php

require_once "../config/Database.php";

$db = (new Database())->conectar();

// recibir datos
$nombre = $_POST['nombre'];
$email = $_POST['email'];
$password = $_POST['password'];
$confirmar = $_POST['confirmar'];

// validar contraseñas
if ($password !== $confirmar) {
    echo "❌ Las contraseñas no coinciden";
    return;
}

// encriptar contraseña
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// insertar usuario
$query = "INSERT INTO usuarios (tipo_usuario, nombre, email, password)
          VALUES ('cliente', :nombre, :email, :password)";

$stmt = $db->prepare($query);

$stmt->bindParam(":nombre", $nombre);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":password", $passwordHash);


if ($stmt->execute()) {

    // redirigir al login
    header("Location: ../view/login.php");
    exit();

} else {
    echo "Error al registrar";
}
``
?>