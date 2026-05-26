<?php
$bodyClass = "body-auth";
include "header.php";

// evitar cache del navegador
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");


require_once "../config/Database.php";
require_once "../models/Usuario.php";
?>



<body class="body-auth login-bg">

<div class="contenedor contenedor-registro">

    <img src="../img/logo.jpeg" alt="Logo" class="logo-registro">

    <h2>Crear cuenta</h2>

    <p class="subtexto">
        Unete a <span>NaxMusic</span> y comienza a cotizar tus servicios
    </p>

    <form action="../controllers/registro_controller.php" method="POST">

        <input type="text" name="nombre" placeholder="Nombre completo" required>

        <input type="email" name="email" placeholder="Correo electronico" required>

        <input type="password" name="password" placeholder="Contrasena" required>

        <input type="password" name="confirmar" placeholder="Confirmar contrasena" required>

        <button type="submit">Registrarse</button>

    </form>

    <div class="linea"></div>

    <p class="texto-login">
        ¿Ya tienes cuenta? 
        <a href="login.php">Iniciar sesion</a>
    </p>

</div>


<?php
    if (isset($_GET['error'])) {

        if ($_GET['error'] == 'existe') {
            echo "<script>alert('Este usuario ya está registrado')</script>";
            
        }

        if ($_GET['error'] == 'pass') {
            echo "<script>alert('Las contraseñas no coinciden')</script>";
            
        }
    }
?>

    



