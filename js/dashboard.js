// ==========================================
// Lógica del Carrusel Interactivo NaxMusic
// ==========================================

// Inicializa y controla el comportamiento
// automático e interactivo del carrusel principal.
(function initNaxCarousel() {
    const track = document.getElementById('nmCarouselTrack');
    const slides = Array.from(document.querySelectorAll('.nm-carousel-slide'));
    const btnNext = document.getElementById('nmBtnNext');
    const btnPrev = document.getElementById('nmBtnPrev');
    const dotsContainer = document.getElementById('nmCarouselDots');
    
    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoplayInterval;

    // Generar o vincular botones de puntos (dots)
    const dots = Array.from(dotsContainer.querySelectorAll('button'));

    // Aplica las transformaciones y estilos
    // correspondientes a la diapositiva actual.
    function updateCarousel() {
        // Mover el track horizontalmente
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Actualizar clases activas en los slides para animaciones internas
        slides.forEach((slide, index) => {
            if (index === currentIndex) {
                slide.classList.add('is-active');
            } else {
                slide.classList.remove('is-active');
            }
        });

        // Actualizar puntos (dots)
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.className = 'w-3 h-3 rounded-full transition-all bg-[#e50914] ring-2 ring-white/50 w-6';
            } else {
                dot.className = 'w-3 h-3 rounded-full transition-all bg-white/40 hover:bg-white/80';
            }
        });
    }

    // Avanza el carrusel a la siguiente
    // diapositiva disponible.
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }

    // Retrocede el carrusel a la
    // diapositiva inmediatamente anterior.
    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    // Limpiar autoplay al interactuar manualmente
    // Reinicia el temporizador de reproducción
    // automática tras una interacción del usuario.
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Eventos de botones Next/Prev
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });
    }

    // Eventos de los puntos (dots)
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
            resetAutoplay();
        });
    });

    // Iniciar Autoplay
    // Configura el intervalo de avance
    // automático para el carrusel.
    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000); // Cambia cada 5 segundos
    }

    // Inicializar carrusel
    updateCarousel();
    startAutoplay();

    // Pausar autoplay si el mouse está sobre el carrusel
    const container = document.querySelector('.nm-carousel-container');
    if (container) {
        container.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
        container.addEventListener('mouseleave', startAutoplay);
    }
})();
