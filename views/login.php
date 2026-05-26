<?php
$bodyClass = "body-auth";
include "header.php";

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");


require_once "../config/Database.php";
require_once "../models/Usuario.php";
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

<?php
if (isset($_GET['error']) && $_GET['error'] == 'existe') {
    echo "<div class='mensaje-error'>Correo o contrañera incorrectos</div>";
}
?>
