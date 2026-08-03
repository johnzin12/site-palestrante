// ============================================
// FORMULÁRIO DE LEADS (Landing Page)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Desabilitar botão
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            
            const formData = {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefone: document.getElementById('whatsapp').value.trim()
            };
            
            // Validação
            if (!formData.nome || !formData.email || !formData.telefone) {
                showToast('Por favor, preencha todos os campos!', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showToast('Por favor, insira um e-mail válido!', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            try {
                const response = await fetch('/api/leads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast('✅ Inscrição realizada com sucesso!', 'success');
                    form.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'obrigado.html';
                    }, 2000);
                } else {
                    showToast(`❌ ${data.error || 'Erro ao cadastrar. Tente novamente.'}`, 'error');
                }
            } catch (error) {
                console.error('Erro:', error);
                showToast('❌ Erro de conexão. Verifique sua internet.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ============================================
// VALIDAÇÃO EM TEMPO REAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Máscara de telefone
    const telefoneInput = document.getElementById('whatsapp');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length <= 2) {
                value = value.replace(/^(\d{0,2})/, '($1');
            } else if (value.length <= 7) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
            
            e.target.value = value;
        });
    }
    
    // Validar email enquanto digita
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.style.borderColor = '#EF4444';
                let errorMsg = this.parentElement.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('span');
                    errorMsg.className = 'error-message';
                    errorMsg.style.cssText = 'color: #EF4444; font-size: 12px; margin-top: 4px; display: block;';
                    errorMsg.textContent = 'Digite um e-mail válido';
                    this.parentElement.appendChild(errorMsg);
                }
            } else {
                this.style.borderColor = '#10B981';
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
    }
});

// ============================================
// TOAST (SISTEMA DE MENSAGENS)
// ============================================
function showToast(message, type = 'success') {
    // Remove toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast__icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="toast__message">${message}</div>
        <button class="toast__close">&times;</button>
    `;
    
    // Estilos inline para garantir
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: #fff;
        padding: 16px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.5s ease;
        min-width: 300px;
        max-width: 500px;
        font-family: 'Segoe UI', sans-serif;
        border-left: 4px solid ${type === 'success' ? '#059669' : '#DC2626'};
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 500);
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Exportar para global
window.showToast = showToast;