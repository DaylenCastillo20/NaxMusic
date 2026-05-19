<?php

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
    
    echo "<script>
        alert('Este usuario ya está registrado');
        window.location.href = '../views/registro.php';
    </script>";
    exit();

}

// validar contraseñas
if ($password !== $confirmar) {
    echo "❌ Las contraseñas no coinciden";
    return;
}

// encriptar contraseña
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// insertar usuario
$query = "INSERT INTO usuarios (tipo_usuario, nombre, email, password)
          VALUES ('Cliente', :nombre, :email, :password)";

$stmt = $db->prepare($query);

$stmt->bindParam(":nombre", $nombre);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":password", $passwordHash);


if ($stmt->execute()) {

    // redirigir al index
    header("Location: ../views/login.php");
    exit();

} else {
    echo "Error al registrar";
}
``
?>