<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro</title>

    <style>
        body {
            margin: 0;
            font-family: Arial;
            background: #000;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .contenedor {
            background: rgba(0, 0, 0, 0.85);
            padding: 30px;
            border-radius: 15px;
            width: 350px;
            text-align: center;
        }

        .contenedor img {
            width: 100px;
            margin-bottom: 10px;
        }

        input {
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            border-radius: 5px;
            border: none;
            outline: none;
        }

        button {
            width: 100%;
            padding: 12px;
            background: red;
            border: none;
            color: white;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
        }

        button:hover {
            background: #cc0000;
        }

        a {
            color: red;
            text-decoration: none;
        }
    </style>

</head>

<body>

<div class="contenedor">

    <img src="../img/logo.jpeg" alt="Logo">

    <h2>Crear cuenta</h2>

    <form action="../controllers/registro_controller.php" method="POST">

        <input type="text" name="nombre" placeholder="Nombre completo" required>

        <input type="email" name="email" placeholder="Correo electronico" required>

        <input type="password" name="password" placeholder="Contraseña" required>

        <input type="password" name="confirmar" placeholder="Confirmar contraseña" required>

        <button type="submit">Registrarse</button>

    </form>

    <p>¿Ya tienes cuenta? 
        <a href="login.php">Iniciar sesion</a>
    </p>

</div>

</body>
</html>
``