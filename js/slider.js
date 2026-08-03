// ============================================
// CARROSSEL DE DEPOIMENTOS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('slider');
    
    if (!slider) return;
    
    const container = slider.querySelector('.slider__container');
    const cards = container ? container.querySelectorAll('.depoimento-card') : [];
    const prevBtn = slider.querySelector('.slider__prev');
    const nextBtn = slider.querySelector('.slider__next');
    const dotsContainer = slider.querySelector('.slider__dots');
    
    if (cards.length === 0) return;
    
    let currentIndex = 0;
    const totalCards = cards.length;
    let autoplayInterval = null;
    let isTransitioning = false;
    
    // Criar dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('span');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.dataset.index = i;
            dot.addEventListener('click', () => {
                if (!isTransitioning) goToSlide(i);
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        if (index < 0) index = totalCards - 1;
        if (index >= totalCards) index = 0;
        
        currentIndex = index;
        const translateX = -index * 100;
        
        if (container) {
            container.style.transition = 'transform 0.5s ease';
            container.style.transform = `translateX(${translateX}%)`;
        }
        
        // Atualizar dots
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
        
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }
    
    function nextSlide() {
        if (!isTransitioning) goToSlide(currentIndex + 1);
    }
    
    function prevSlide() {
        if (!isTransitioning) goToSlide(currentIndex - 1);
    }
    
    // Event listeners dos botões
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            clearInterval(autoplayInterval);
            nextSlide();
            startAutoplay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            clearInterval(autoplayInterval);
            prevSlide();
            startAutoplay();
        });
    }
    
    // Autoplay
    function startAutoplay() {
        clearInterval(autoplayInterval);
        if (totalCards > 1) {
            autoplayInterval = setInterval(nextSlide, 5000);
        }
    }
    
    // Pausar autoplay no hover
    slider.addEventListener('mouseenter', () => {
        clearInterval(autoplayInterval);
    });
    
    slider.addEventListener('mouseleave', () => {
        if (totalCards > 1) {
            startAutoplay();
        }
    });
    
    // Touch suporte para mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        clearInterval(autoplayInterval);
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Só navega se o movimento for mais horizontal que vertical
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            if (diffX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        
        startAutoplay();
    }, { passive: true });
    
    // Iniciar autoplay
    if (totalCards > 1) {
        startAutoplay();
    }
    
    // Navegação com teclado (acessibilidade)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
    
    // Expor funções para debug
    window.sliderGoTo = goToSlide;
    window.sliderNext = nextSlide;
    window.sliderPrev = prevSlide;
});