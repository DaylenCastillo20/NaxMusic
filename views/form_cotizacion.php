<!DOCTYPE html>
<html>
<head>
    <title>Crear Cotizacion</title>
</head>
<body>

<h2>Formulario Cotizacion</h2>

<form action="../controllers/guardar_cotizacion.php" method="POST">

    
    <label>ID Cliente:</label><br>
        <input type="number" name="id_cliente" required><br><br>

        <label>Servicio:</label><br>
        <select name="id_servicio">
            <option value="1">Sonido</option>
            <option value="2">Luces</option>
        </select><br><br>

        <label>Cantidad:</label><br>
        <input type="number" name="cantidad" required><br><br>

        <button type="submit">Guardar</button>


</form>

</body>
</html>
