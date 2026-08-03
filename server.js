const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'sua_chave_secreta_aqui';

// CONEXÃO COM O BANCO
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'palestrante_db',
    password: 'johncunha12', // ← SUA SENHA
    port: 5432,
});

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// TESTAR CONEXÃO
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.stack);
    } else {
        console.log('✅ Conectado ao PostgreSQL com sucesso!');
        release();
    }
});

// ============================================
// ROTA DE LOGIN
// ============================================
app.post('/login', async (req, res) => {
    console.log('🔵 Tentativa de login:', req.body);
    
    const { email, senha } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM usuarios_admin WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            console.log('❌ Usuário não encontrado');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const usuario = result.rows[0];
        console.log('🔵 Usuário encontrado:', usuario.email);
        
        if (senha === 'admin123') {
            console.log('✅ Senha correta!');
            
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email, nome: usuario.nome },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return res.json({
                message: 'Login realizado com sucesso',
                token: token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });
        } else {
            console.log('❌ Senha incorreta');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
}

// ============================================
// ROTAS PÚBLICAS DA API
// ============================================
app.get('/api/eventos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eventos ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

app.get('/api/produtos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

app.get('/api/depoimentos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM depoimentos ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar depoimentos' });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;
        const result = await pool.query(
            'INSERT INTO leads (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, telefone]
        );
        res.status(201).json({ message: 'Lead cadastrado com sucesso!', lead: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar lead' });
    }
});

// ============================================
// ROTAS PROTEGIDAS (ADMIN)
// ============================================

// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }
        res.json({ message: 'Lead deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar lead' });
    }
});

// EVENTOS (CRUD)
app.post('/api/eventos', authenticateToken, async (req, res) => {
    try {
        const { titulo, subtitulo, descricao, cidade, local, data, horario, valor, banner } = req.body;
        const result = await pool.query(
            `INSERT INTO eventos (titulo, subtitulo, descricao, cidade, local, data, horario, valor, banner) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [titulo, subtitulo, descricao, cidade, local, data, horario, valor, banner]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar evento' });
    }
});

app.put('/api/eventos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, subtitulo, descricao, cidade, local, data, horario, valor, banner } = req.body;
        const result = await pool.query(
            `UPDATE eventos 
             SET titulo = $1, subtitulo = $2, descricao = $3, cidade = $4, local = $5, 
                 data = $6, horario = $7, valor = $8, banner = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 
             RETURNING *`,
            [titulo, subtitulo, descricao, cidade, local, data, horario, valor, banner, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
});

app.delete('/api/eventos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM eventos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        res.json({ message: 'Evento deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar evento' });
    }
});

// PRODUTOS (CRUD)
app.post('/api/produtos', authenticateToken, async (req, res) => {
    try {
        const { nome, descricao, preco, imagem, categoria, link } = req.body;
        const result = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco, imagem, categoria, link) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [nome, descricao, preco, imagem, categoria, link]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

app.put('/api/produtos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, imagem, categoria, link } = req.body;
        const result = await pool.query(
            `UPDATE produtos 
             SET nome = $1, descricao = $2, preco = $3, imagem = $4, categoria = $5, link = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 
             RETURNING *`,
            [nome, descricao, preco, imagem, categoria, link, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

app.delete('/api/produtos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// DEPOIMENTOS (CRUD) - COM AVALIACAO
app.post('/api/depoimentos', authenticateToken, async (req, res) => {
    try {
        const { nome, foto, texto, avaliacao } = req.body;
        const result = await pool.query(
            `INSERT INTO depoimentos (nome, foto, texto, avaliacao) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [nome, foto, texto, avaliacao || 5]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar depoimento' });
    }
});

app.put('/api/depoimentos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, foto, texto, avaliacao } = req.body;
        const result = await pool.query(
            `UPDATE depoimentos 
             SET nome = $1, foto = $2, texto = $3, avaliacao = $4
             WHERE id = $5 
             RETURNING *`,
            [nome, foto, texto, avaliacao || 5, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Depoimento não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar depoimento' });
    }
});

app.delete('/api/depoimentos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM depoimentos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Depoimento não encontrado' });
        }
        res.json({ message: 'Depoimento deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar depoimento' });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('📝 Acesse:');
    console.log(`   - Site: http://localhost:${PORT}`);
    console.log(`   - Login: http://localhost:${PORT}/login.html`);
    console.log(`   - Admin: http://localhost:${PORT}/admin.html`);
    console.log('='.repeat(50));
    console.log('🔑 Credenciais: admin@palestrante.com / admin123');
    console.log('='.repeat(50));
});