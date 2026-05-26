<?php

session_start();

// Evitar que el navegador guarde la pagina en el historial de cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require_once "../config/Database.php";


$db = (new Database())->conectar();

// recibir datos
$nombre = $_POST['nombre'];
$email = $_POST['email'];
$password = $_POST['password'];
$confirmar = $_POST['confirmar'];


// verificar si el email ya existe
$queryCheck = "SELECT id_usuario FROM usuarios WHERE email = :email";
$stmtCheck = $db->prepare($queryCheck);
$stmtCheck->bindParam(":email", $email);
$stmtCheck->execute();

if ($stmtCheck->rowCount() > 0) {
    
    header("Location: ../index.php?error=registro_pass");
    exit();

}

// validar contrasenas
if ($password !== $confirmar) {
    
    header("Location: ../index.php?error=registro_pass");
    exit();

}

// encriptar contrasena
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// insertar usuario
$query = "INSERT INTO usuarios (tipo_usuario, nombre, email, password)
          VALUES ('Cliente', :nombre, :email, :password)";

$stmt = $db->prepare($query);

$stmt->bindParam(":nombre", $nombre);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":password", $passwordHash);


if ($stmt->execute()) {

    // redirigir al login
    header("Location: ../index.php?login=1");
    exit();


} else {
    header("Location: ../index.php?error=registro_pass");
    exit();
}

?>