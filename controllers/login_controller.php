<?php
session_start();

require_once "../config/Database.php";
require_once "../models/Usuario.php";

$db = (new Database())->conectar();

$usuario = new Usuario($db);

// recibir datos
$email = $_POST['email'];
$password = $_POST['password'];

// autenticar
$user = $usuario->autenticar($email, $password);

if ($user) {

    $_SESSION['nombre'] = $user['nombre'];
    $_SESSION['rol'] = $user['tipo_usuario'];

    header("Location: ../index.php");
    exit();

} else {
    echo "Correo o contraseña incorrectos";
}