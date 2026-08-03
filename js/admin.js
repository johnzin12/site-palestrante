// ============================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return token;
}

// ============================================
// FUNÇÕES GLOBAIS
// ============================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast__icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="toast__message">${message}</div>
        <button class="toast__close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    const term = searchTerm.toLowerCase();
    
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().includes(term)) {
                found = true;
                break;
            }
        }
        rows[i].style.display = found ? '' : 'none';
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    const token = checkAuth();
    if (!token) return;
    
    try {
        const [eventos, produtos, depoimentos, leads] = await Promise.all([
            fetch('/api/eventos', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/produtos', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/depoimentos', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);
        
        const totalEventos = document.getElementById('totalEventos');
        const totalProdutos = document.getElementById('totalProdutos');
        const totalDepoimentos = document.getElementById('totalDepoimentos');
        const totalLeads = document.getElementById('totalLeads');
        
        if (totalEventos) totalEventos.textContent = eventos.length || 0;
        if (totalProdutos) totalProdutos.textContent = produtos.length || 0;
        if (totalDepoimentos) totalDepoimentos.textContent = depoimentos.length || 0;
        if (totalLeads) totalLeads.textContent = leads.length || 0;
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast('Erro ao carregar dados', 'error');
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login.html';
    }
}

// ============================================
// CARREGAR DADOS DO USUÁRIO
// ============================================
function loadUserInfo() {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
        const user = JSON.parse(userData);
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = user.nome || user.email;
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatar) userAvatar.textContent = (user.nome || user.email)[0].toUpperCase();
    }
}

// ============================================
// EVENTOS (CRUD)
// ============================================
async function loadEventos() {
    const token = checkAuth();
    if (!token) return;
    
    try {
        const response = await fetch('/api/eventos?_=' + new Date().getTime(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
            return;
        }
        
        const eventos = await response.json();
        const tbody = document.getElementById('eventosTable');
        
        if (!tbody) return;
        
        if (eventos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--cinza);">Nenhum evento cadastrado</td></tr>`;
            return;
        }
        
        tbody.innerHTML = eventos.map(evento => `
            <tr>
                <td>${evento.id}</td>
                <td><strong>${evento.titulo}</strong></td>
                <td>${evento.cidade || '-'}</td>
                <td>${evento.data ? new Date(evento.data).toLocaleDateString('pt-BR') : '-'}</td>
                <td>R$ ${evento.valor ? Number(evento.valor).toFixed(2) : '0,00'}</td>
                <td>
                    <div class="actions">
                        <button class="btn-edit" onclick="editEvento(${evento.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="deleteEvento(${evento.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar eventos', 'error');
    }
}

function openModalEvento(evento = null) {
    const modal = document.getElementById('modalEvento');
    const title = document.getElementById('modalEventoTitle');
    const form = document.getElementById('formEvento');
    
    if (!modal) return;
    
    if (evento) {
        title.textContent = 'Editar Evento';
        document.getElementById('evento_id').value = evento.id;
        document.getElementById('evento_titulo').value = evento.titulo || '';
        document.getElementById('evento_subtitulo').value = evento.subtitulo || '';
        document.getElementById('evento_descricao').value = evento.descricao || '';
        document.getElementById('evento_cidade').value = evento.cidade || '';
        document.getElementById('evento_local').value = evento.local || '';
        document.getElementById('evento_data').value = evento.data ? evento.data.split('T')[0] : '';
        document.getElementById('evento_horario').value = evento.horario || '';
        document.getElementById('evento_valor').value = evento.valor || '';
        document.getElementById('evento_banner').value = evento.banner || '';
    } else {
        title.textContent = 'Novo Evento';
        if (form) form.reset();
        document.getElementById('evento_id').value = '';
    }
    
    modal.classList.add('active');
}

function closeModalEvento() {
    const modal = document.getElementById('modalEvento');
    if (modal) modal.classList.remove('active');
}

async function saveEvento(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showToast('Você não está logado!', 'error');
        window.location.href = '/login.html';
        return;
    }
    
    const id = document.getElementById('evento_id').value;
    const data = {
        titulo: document.getElementById('evento_titulo').value,
        subtitulo: document.getElementById('evento_subtitulo').value,
        descricao: document.getElementById('evento_descricao').value,
        cidade: document.getElementById('evento_cidade').value,
        local: document.getElementById('evento_local').value,
        data: document.getElementById('evento_data').value,
        horario: document.getElementById('evento_horario').value,
        valor: parseFloat(document.getElementById('evento_valor').value) || 0,
        banner: document.getElementById('evento_banner').value || ''
    };
    
    const btn = e.target.querySelector('.btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    try {
        const url = id ? `/api/eventos/${id}` : '/api/eventos';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(id ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!', 'success');
            closeModalEvento();
            loadEventos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast(result.error || 'Erro ao salvar evento', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Salvar';
    }
}

async function deleteEvento(id) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/eventos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Evento excluído com sucesso!', 'success');
            loadEventos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast('Erro ao excluir evento', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    }
}

async function editEvento(id) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/eventos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const evento = await response.json();
        openModalEvento(evento);
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar evento', 'error');
    }
}

// ============================================
// PRODUTOS (CRUD)
// ============================================
async function loadProdutos() {
    const token = checkAuth();
    if (!token) return;
    
    try {
        const response = await fetch('/api/produtos?_=' + new Date().getTime(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
            return;
        }
        
        const produtos = await response.json();
        const tbody = document.getElementById('produtosTable');
        
        if (!tbody) return;
        
        if (produtos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--cinza);">Nenhum produto cadastrado</td></tr>`;
            return;
        }
        
        tbody.innerHTML = produtos.map(produto => `
            <tr>
                <td>${produto.id}</td>
                <td><strong>${produto.nome}</strong></td>
                <td>${produto.categoria || '-'}</td>
                <td>R$ ${produto.preco ? Number(produto.preco).toFixed(2) : '0,00'}</td>
                <td><span class="status-active">Ativo</span></td>
                <td>
                    <div class="actions">
                        <button class="btn-edit" onclick="editProduto(${produto.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="deleteProduto(${produto.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar produtos', 'error');
    }
}

function openModalProduto(produto = null) {
    const modal = document.getElementById('modalProduto');
    const title = document.getElementById('modalProdutoTitle');
    const form = document.getElementById('formProduto');
    
    if (!modal) return;
    
    if (produto) {
        title.textContent = 'Editar Produto';
        document.getElementById('produto_id').value = produto.id;
        document.getElementById('produto_nome').value = produto.nome || '';
        document.getElementById('produto_descricao').value = produto.descricao || '';
        document.getElementById('produto_preco').value = produto.preco || '';
        document.getElementById('produto_categoria').value = produto.categoria || '';
        document.getElementById('produto_link').value = produto.link || '';
        document.getElementById('produto_imagem').value = produto.imagem || '';
    } else {
        title.textContent = 'Novo Produto';
        if (form) form.reset();
        document.getElementById('produto_id').value = '';
    }
    
    modal.classList.add('active');
}

function closeModalProduto() {
    const modal = document.getElementById('modalProduto');
    if (modal) modal.classList.remove('active');
}

async function saveProduto(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showToast('Você não está logado!', 'error');
        window.location.href = '/login.html';
        return;
    }
    
    const id = document.getElementById('produto_id').value;
    const data = {
        nome: document.getElementById('produto_nome').value,
        descricao: document.getElementById('produto_descricao').value,
        preco: parseFloat(document.getElementById('produto_preco').value) || 0,
        categoria: document.getElementById('produto_categoria').value,
        link: document.getElementById('produto_link').value,
        imagem: document.getElementById('produto_imagem').value || ''
    };
    
    const btn = e.target.querySelector('.btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    try {
        const url = id ? `/api/produtos/${id}` : '/api/produtos';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!', 'success');
            closeModalProduto();
            loadProdutos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast(result.error || 'Erro ao salvar produto', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Salvar';
    }
}

async function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Produto excluído com sucesso!', 'success');
            loadProdutos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast('Erro ao excluir produto', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    }
}

async function editProduto(id) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/produtos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const produto = await response.json();
        openModalProduto(produto);
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar produto', 'error');
    }
}

// ============================================
// DEPOIMENTOS (CRUD) - COM ESTRELAS
// ============================================
async function loadDepoimentos() {
    const token = checkAuth();
    if (!token) return;
    
    try {
        console.log('🔵 Carregando depoimentos...');
        
        const response = await fetch('/api/depoimentos?_=' + new Date().getTime(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
            return;
        }
        
        const depoimentos = await response.json();
        console.log('🔵 Depoimentos:', depoimentos);
        
        const tbody = document.getElementById('depoimentosTable');
        if (!tbody) return;
        
        if (depoimentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--cinza);">Nenhum depoimento cadastrado</td></tr>`;
            return;
        }
        
        tbody.innerHTML = depoimentos.map(depoimento => {
            const estrelas = '⭐'.repeat(depoimento.avaliacao || 5) + '☆'.repeat(5 - (depoimento.avaliacao || 5));
            return `
                <tr>
                    <td>${depoimento.id}</td>
                    <td><strong>${depoimento.nome}</strong></td>
                    <td>${depoimento.texto ? depoimento.texto.substring(0, 50) + '...' : '-'}</td>
                    <td>${estrelas}</td>
                    <td>${depoimento.foto ? '✅' : '❌'}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-edit" onclick="editDepoimento(${depoimento.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteDepoimento(${depoimento.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar depoimentos:', error);
        showToast('Erro ao carregar depoimentos', 'error');
        const tbody = document.getElementById('depoimentosTable');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#EF4444;">Erro ao carregar dados. Verifique o console.</td></tr>`;
        }
    }
}

function openModalDepoimento(depoimento = null) {
    const modal = document.getElementById('modalDepoimento');
    const title = document.getElementById('modalDepoimentoTitle');
    const form = document.getElementById('formDepoimento');
    
    if (!modal) return;
    
    if (depoimento) {
        title.textContent = 'Editar Depoimento';
        document.getElementById('depoimento_id').value = depoimento.id;
        document.getElementById('depoimento_nome').value = depoimento.nome || '';
        document.getElementById('depoimento_texto').value = depoimento.texto || '';
        document.getElementById('depoimento_avaliacao').value = depoimento.avaliacao || 5;
        document.getElementById('depoimento_foto').value = depoimento.foto || '';
    } else {
        title.textContent = 'Novo Depoimento';
        if (form) form.reset();
        document.getElementById('depoimento_id').value = '';
        document.getElementById('depoimento_avaliacao').value = 5;
    }
    
    modal.classList.add('active');
}

function closeModalDepoimento() {
    const modal = document.getElementById('modalDepoimento');
    if (modal) modal.classList.remove('active');
}

async function saveDepoimento(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showToast('Você não está logado!', 'error');
        window.location.href = '/login.html';
        return;
    }
    
    const id = document.getElementById('depoimento_id').value;
    const data = {
        nome: document.getElementById('depoimento_nome').value,
        texto: document.getElementById('depoimento_texto').value,
        avaliacao: parseInt(document.getElementById('depoimento_avaliacao').value) || 5,
        foto: document.getElementById('depoimento_foto').value || ''
    };
    
    const btn = e.target.querySelector('.btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    try {
        const url = id ? `/api/depoimentos/${id}` : '/api/depoimentos';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(id ? 'Depoimento atualizado com sucesso!' : 'Depoimento criado com sucesso!', 'success');
            closeModalDepoimento();
            loadDepoimentos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast(result.error || 'Erro ao salvar depoimento', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Salvar';
    }
}

async function deleteDepoimento(id) {
    if (!confirm('Tem certeza que deseja excluir este depoimento?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/depoimentos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Depoimento excluído com sucesso!', 'success');
            loadDepoimentos();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast('Erro ao excluir depoimento', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    }
}

async function editDepoimento(id) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/depoimentos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const depoimento = await response.json();
        openModalDepoimento(depoimento);
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar depoimento', 'error');
    }
}

// ============================================
// LEADS
// ============================================
async function loadLeads() {
    const token = checkAuth();
    if (!token) return;
    
    try {
        const response = await fetch('/api/leads?_=' + new Date().getTime(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
            return;
        }
        
        const leads = await response.json();
        const tbody = document.getElementById('leadsTable');
        
        if (!tbody) return;
        
        if (leads.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--cinza);">Nenhum lead cadastrado</td></tr>`;
            return;
        }
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td>${lead.id}</td>
                <td><strong>${lead.nome}</strong></td>
                <td>${lead.email}</td>
                <td>${lead.telefone || '-'}</td>
                <td>${lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteLead(${lead.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar leads', 'error');
    }
}

async function deleteLead(id) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/leads/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Lead excluído com sucesso!', 'success');
            loadLeads();
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            showToast('Erro ao excluir lead', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro de conexão!', 'error');
    }
}

// ============================================
// EXPORTAR FUNÇÕES PARA GLOBAL
// ============================================
window.loadDashboard = loadDashboard;
window.loadEventos = loadEventos;
window.loadProdutos = loadProdutos;
window.loadDepoimentos = loadDepoimentos;
window.loadLeads = loadLeads;

window.openModalEvento = openModalEvento;
window.openModalProduto = openModalProduto;
window.openModalDepoimento = openModalDepoimento;

window.closeModalEvento = closeModalEvento;
window.closeModalProduto = closeModalProduto;
window.closeModalDepoimento = closeModalDepoimento;

window.saveEvento = saveEvento;
window.saveProduto = saveProduto;
window.saveDepoimento = saveDepoimento;

window.deleteEvento = deleteEvento;
window.deleteProduto = deleteProduto;
window.deleteDepoimento = deleteDepoimento;
window.deleteLead = deleteLead;

window.editEvento = editEvento;
window.editProduto = editProduto;
window.editDepoimento = editDepoimento;

window.logout = logout;
window.showToast = showToast;
window.filterTable = filterTable;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
        return;
    }
    
    loadUserInfo();
    
    const btnToggle = document.getElementById('btnToggleSidebar');
    if (btnToggle) {
        btnToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const btn = document.getElementById('btnToggleSidebar');
        if (window.innerWidth <= 768) {
            if (sidebar && !sidebar.contains(e.target) && btn && !btn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});