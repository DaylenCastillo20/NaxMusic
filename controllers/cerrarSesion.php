<?php
session_start();

// destruir todas las variables de sesion
session_unset();

// destruir la sesion
session_destroy();

// redirigir al inicio
header("Location: ../index.php");
exit();
?>