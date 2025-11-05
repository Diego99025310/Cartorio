# 🏛️ Sistema de Escrituras - Cartório Torresan (Node.js)

## 📖 Descrição
O **Sistema de Escrituras do Cartório Torresan** é uma aplicação local desenvolvida em **Node.js (Express)** com **banco de dados SQLite**, criada para gerenciar **tipos de escritura**, **cláusulas** e **declarações** utilizadas em escrituras públicas.

O sistema será executado **localmente no servidor interno do cartório**, podendo ser acessado pela rede via o **Corridor de DNS**, garantindo integração com outros sistemas já existentes no ambiente.

---

## 🧠 Estrutura lógica
TIPO DE ESCRITURA → CLÁUSULA → DECLARAÇÃO

yaml
Copiar código

### Exemplo:
- Tipo de Escritura: Compra e Venda  
  - Cláusula: Pagamento  
    - Declaração: Pagamento em cheque  
    - Declaração: Pagamento parcelado  

- Tipo de Escritura: Doação  
  - Cláusula: Disposições Gerais  
    - Declaração: O donatário aceita as condições da doação

---

## 👥 Usuários

| Tipo | Função | Permissões |
|------|---------|-------------|
| **Master** | Administrador | Pode cadastrar tipos de escritura, cláusulas e declarações |
| **Usuário comum** | Operador | Pode apenas visualizar as declarações cadastradas pelo master |

---

## 🧩 Estrutura do banco de dados (SQLite)

### Tabelas
#### `users`
| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id | INTEGER | Identificador |
| username | TEXT | Nome do usuário |
| password | TEXT | Senha (hash) |
| is_master | INTEGER | 1 = master, 0 = comum |

#### `escrituras`
| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id | INTEGER | Identificador |
| nome | TEXT | Tipo de escritura (ex: Compra e Venda) |
| criado_por | INTEGER | ID do usuário criador |

#### `clausulas`
| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id | INTEGER | Identificador |
| escritura_id | INTEGER | Relaciona com o tipo de escritura |
| nome | TEXT | Nome da cláusula |
| criado_por | INTEGER | ID do usuário criador |

#### `declaracoes`
| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id | INTEGER | Identificador |
| clausula_id | INTEGER | Relaciona com a cláusula |
| texto | TEXT | Texto da declaração |
| criado_por | INTEGER | ID do usuário criador |

---

## ⚙️ Funcionalidades principais

### 🔐 Autenticação
- Login de usuário master e comum.
- Sessões locais simples (sem dependência de rede externa).
- Controle de acesso: apenas master pode cadastrar.

### 🧱 Cadastros
- **Tipos de Escritura** (Compra e Venda, Doação, etc.)
- **Cláusulas** dentro de cada tipo de escritura.
- **Declarações** dentro de cada cláusula.

### 🔎 Consultas
- Filtros hierárquicos:
  - Tipo de Escritura → Cláusula → Declarações
- Apenas registros criados pelo **master** são visíveis aos usuários comuns.

---

## 🗂️ Estrutura de diretórios sugerida

Cartorio/
│
├── app.js # Servidor principal Express
├── database.db # Banco SQLite
│
├── src/
│ ├── routes/ # Rotas (auth, escrituras, clausulas, declaracoes)
│ ├── controllers/ # Lógica das rotas
│ ├── models/ # Classes e acesso ao banco SQLite
│ └── middlewares/ # Autenticação, validações etc.
│
├── public/
│ ├── css/
│ ├── js/
│ └── img/
│
├── views/ # Páginas HTML (EJS)
│ ├── layout.ejs # Layout base (Bootstrap)
│ ├── login.ejs
│ ├── home.ejs
│ ├── escrituras.ejs
│ ├── clausulas.ejs
│ └── declaracoes.ejs
│
├── iniciar_servidor.bat # Script para iniciar o servidor local
│
├── package.json
└── README.md

yaml
Copiar código

---

## 🧰 Tecnologias

- **Node.js 18+**
- **Express.js**
- **SQLite3** (ou **better-sqlite3**)
- **EJS** (para renderização HTML)
- **Bootstrap 5**
- **bcrypt** (hash de senha)
- **express-session** (controle de login)

---

## 🚀 Como rodar localmente

### 1️⃣ Instalar dependências
```bash
npm install
2️⃣ Executar servidor
bash
Copiar código
npm start
ou

bash
Copiar código
node app.js
3️⃣ Acessar no navegador
arduino
Copiar código
http://localhost:5000
🌐 Execução via Corridor de DNS (recomendada)
O sistema pode ser executado sob o Corridor de DNS do Cartório Torresan.

Configuração:
Configure o serviço Corridor para mapear:

perl
Copiar código
http://escrituras.cartorio.local → http://127.0.0.1:5000
Inicie o servidor Node:

bash
Copiar código
node app.js
Acesse:

arduino
Copiar código
http://escrituras.cartorio.local
Isso mantém o mesmo padrão dos demais sistemas internos e garante integração e segurança na rede local.

🧱 Tarefas que o Codex deve gerar a partir deste README
Criar o projeto Node.js com package.json e dependências.

Configurar o servidor Express com EJS e SQLite.

Criar modelos (users, escrituras, clausulas, declaracoes).

Criar rotas e controladores para CRUD completo.

Implementar login e controle de acesso.

Criar as páginas EJS com layout Bootstrap.

Adicionar o script .bat para iniciar o servidor local.

Preparar o sistema para rodar sob o Corridor de DNS (porta 5000).

