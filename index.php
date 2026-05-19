<?php
session_start();
include "views/header.php";
?>

<div class="app-container">

    <!-- SIDEBAR -->
    <aside class="sidebar">

        <div class="sidebar-header">
            <div class="admin-info">

                <div class="admin-avatar">
                    <?php echo isset($_SESSION['nombre']) 
                        ? strtoupper(substr($_SESSION['nombre'], 0, 2)) 
                        : "NM"; ?>
                </div>

                <div class="admin-text">
                    <h4><?php echo $_SESSION['nombre'] ?? "NaxMusic"; ?></h4>
                    <p><?php echo $_SESSION['rol'] ?? "Invitado"; ?></p>
                </div>

            </div>
        </div>

        <!-- MENU -->
        <nav>
            <a href="#"><span>📊</span> <span>Dashboard</span></a>
            <a href="#"><span>📋</span> <span>Cotizaciones</span></a>
            <a href="#"><span>🎛️</span> <span>Servicios</span></a>
            <a href="#"><span>🛒</span> <span>Carrito</span></a>

            <?php if (isset($_SESSION['nombre'])) { ?>
                <a href="controllers/logout.php">
                    <span>🚪</span> <span>Cerrar sesion</span>
                </a>
            <?php } else { ?>
                <a href="view/login.php">
                    <span>🔐</span> <span>Iniciar sesion</span>
                </a>
            <?php } ?>
        </nav>

    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">

        <!-- HERO (SOLO ESTO ARRIBA) -->
        <div class="hero-card">

            <div class="hero-text">
                <h1>HACEMOS QUE TU EVENTO</h1>
                <h2>SUENE EPICO</h2>

                <p>
                    Soluciones profesionales en sonido,
                    iluminacion y DJ
                </p>
            </div>

            <div class="hero-action">
                <a href="#" class="btn">Cotizar ahora →</a>
            </div>

        </div>

        <!-- SERVICIOS (SEPARADO DEL HERO) -->
        <h2 class="section-title">SERVICIOS DESTACADOS</h2>

        <div class="servicios-grid">

            <div class="servicio-card">
                <h3>Sonido Profesional</h3>
                <p>Audio para eventos</p>
            </div>

            <div class="servicio-card">
                <h3>Iluminacion LED</h3>
                <p>Ambientacion moderna</p>
            </div>

            <div class="servicio-card">
                <h3>DJ Profesional</h3>
                <p>Musica para eventos</p>
            </div>

        </div>

        <!-- ESTADISTICAS -->
        <div class="stats-grid">

            <div class="stat-card">
                <div class="stat-number">+500</div>
                <div class="stat-label">Eventos</div>
            </div>

            <div class="stat-card">
                <div class="stat-number">+300</div>
                <div class="stat-label">Clientes</div>
            </div>

            <div class="stat-card">
                <div class="stat-number">8+</div>
                <div class="stat-label">Años</div>
            </div>

        </div>

    </main>

</div>

<?php include "views/footer.php"; ?>