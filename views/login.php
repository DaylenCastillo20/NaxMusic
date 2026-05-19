<?php
$bodyClass = "body-auth";
include "header.php";
?>

<body class="body-auth login-bg">

<div class="contenedor contenedor-registro">

    <img src="../img/logo.jpeg" class="logo-registro">

    <h2>Iniciar Sesion</h2>

    <p class="subtexto">
        Bienvenido de nuevo a <span>NAXMUSIC</span>
    </p>

    <form action="../controllers/login_controller.php" method="POST">

    
        <input type="email" name="email" placeholder="Ingresa tu correo electronico" required>

        
        <input type="password" name="password" placeholder="Ingresa tu contraseña" required>

        

        <button type="submit">Iniciar Sesion</button>

    </form>

    <div class="linea"></div>

    <p class="texto-login">
        ¿No tienes cuenta? 
        <a href="registro.php">Registrate aqui</a>
    </p>

</div>

