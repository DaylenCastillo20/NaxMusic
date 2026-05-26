<?php
session_start();

// Evitar que el navegador guarde la pagina en el historial de cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
$bodyClass = "body-index";
include "views/header.php";
?>

<div class="app-container">

    <!-- SIDEBAR -->
    <aside class="sidebar">

        <div class="sidebar-header">
            <div class="admin-info">

                <div class="admin-avatar">
                    <?php 
                        echo isset($_SESSION['nombre']) 
                        ? strtoupper(substr($_SESSION['nombre'], 0, 2)) 
                        : "NM"; 
                    ?>
                </div>

                <div class="admin-text">
                    <h4><?php echo $_SESSION['nombre'] ?? "NaxMusic"; ?></h4>
                    <p><?php echo $_SESSION['rol'] ?? "Invitado"; ?></p>
                </div>

            </div>
        </div>

        <!-- MENU -->
        <nav>

            <!-- PUBLICO -->
            <a href="#" onclick="cargarContenido('dashboard')">
                <span>Dashboard</span>
            </a>

            <a href="#" onclick="cargarContenido('cotizaciones')">
                <span>Cotizaciones</span>
            </a>

            <a href="#" onclick="cargarContenido('servicios')">
                <span>Servicios</span>
            </a>

            <a href="#" onclick="cargarContenido('carrito')">
                <span>Carrito</span>
            </a>

            <?php if (isset($_SESSION['nombre'])) { ?>

                <!-- CLIENTE -->
                <?php if ($_SESSION['rol'] == 'Cliente') { ?>
                    <a href="#">
                        <span>Mis cotizaciones</span>
                    </a>
                <?php } ?>

                <!-- ADMIN -->
                <?php if ($_SESSION['rol'] == 'Administrador') { ?>
                    <a href="#">
                        <span>Panel Administrador</span>
                    </a>
                <?php } ?>

                <!-- CERRAR SESION -->
                <a href="controllers/cerrarSesion.php">
                    <span>Cerrar sesion</span>
                </a>

            <?php } else { ?>

                <!-- NO LOGUEADO -->
                <a href="#" onclick="cargarContenido('login'); return false">
                    <span>Iniciar sesion</span>
                </a>

            <?php } ?>

        </nav>

        <!-- IMAGEN ABAJO -->
        <div class="sidebar-fondo"></div>

    </aside>


    <!-- CONTENIDO PRINCIPAL -->
   <main class="main-content">

        <div id="errorAlert" class="error-container hidden">
            <svg class="error-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div class="error-content">
                <p id="errorMessage"></p>
            </div>
            <button class="error-close-btn" onclick="document.getElementById('errorAlert').classList.add('hidden')">×</button>
        </div>


        <div id="contenido">

            <!-- CONTENIDO INICIAL -->
            <div id="inicio">
                <div class="hero-card">
                    <div class="hero-text">
                        <h1>HACEMOS QUE TU EVENTO</h1>
                        <h2>SUENE EPICO</h2>
                        <p>Soluciones profesionales en sonido, iluminación y DJ</p>
                    </div>

                    <div class="hero-action">
                        <a href="#" class="btn" onclick="cargarContenido('cotizaciones')">
                            Cotizar ahora →
                        </a>
                    </div>
                </div>

                <h2 class="section-title">SERVICIOS DESTACADOS</h2>
            </div>

        </div>
    <?php include "views/footer.php"; ?>
    </main>



</div>

