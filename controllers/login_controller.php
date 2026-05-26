<?php
session_start();

// Evitar que el navegador guarde la pagina en el historial de cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

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
    header("Location: ../index.php?error=login");
    exit();
}