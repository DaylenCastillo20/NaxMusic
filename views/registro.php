<?php
$bodyClass = "body-auth";
include "header.php";
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

        <input type="password" name="password" placeholder="Contraseña" required>

        <input type="password" name="confirmar" placeholder="Confirmar contraseña" required>

        <button type="submit">Registrarse</button>

    </form>

    <div class="linea"></div>

    <p class="texto-login">
        ¿Ya tienes cuenta? 
        <a href="login.php">Iniciar sesion</a>
    </p>

</div>

