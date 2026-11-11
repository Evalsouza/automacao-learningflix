import path from 'path';

// Sessão do Administrador salva pelo login manual (npm run tutorial:login) — .auth/ está no .gitignore
export const SESSAO_TUTORIAL = path.join(__dirname, '..', '.auth', 'tutorial-administrador.json');

// Sessão do Adm Cliente (npm run tutorial:login:cliente) — perfil do cliente, usado nas seções 2 a 6
export const SESSAO_TUTORIAL_CLIENTE = path.join(__dirname, '..', '.auth', 'tutorial-adm-cliente.json');

// Sessão do usuário final eva.souza (npm run tutorial:login:usuario) — seção 6
export const SESSAO_TUTORIAL_USUARIO = path.join(__dirname, '..', '.auth', 'tutorial-usuario-final.json');

// PNGs da seção 1 do "Tutorial Skill Link" (print-01.png … print-08.png)
export const PASTA_PRINTS_SKILL_LINK = path.join(__dirname, 'skill-link', 'prints');

// PNGs do "Tutorial competências com a Judy" (página 5949030403)
export const PASTA_PRINTS_JUDY = path.join(__dirname, 'judy', 'prints');
