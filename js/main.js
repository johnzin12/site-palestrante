// ============================================
// MENU MOBILE E NAVEGAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Menu Mobile
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.header__nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Fechar menu ao clicar em um link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
    
    // Scroll Reveal
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        revealElements.forEach(el => revealObserver.observe(el));
    }
    
    // Scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header com sombra no scroll
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(255,255,255,0.98)';
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                header.style.background = 'rgba(255,255,255,0.95)';
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
            }
        });
    }
});

// ============================================
// FAQ ACCORDION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq__question');
        
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Fechar todos
                faqItems.forEach(i => i.classList.remove('active'));
                
                // Abrir o clicado se estava fechado
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
});

// ============================================
// UTILITÁRIOS
// ============================================
function getToken() {
    return localStorage.getItem('adminToken');
}

function isLoggedIn() {
    return !!getToken();
}

function redirectToLogin() {
    if (!isLoggedIn() && !window.location.pathname.includes('login.html')) {
        window.location.href = '/login.html';
    }
}

// Exportar para global
window.getToken = getToken;
window.isLoggedIn = isLoggedIn;
window.redirectToLogin = redirectToLogin;