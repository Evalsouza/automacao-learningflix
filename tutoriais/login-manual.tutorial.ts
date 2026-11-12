import { test } from '@playwright/test';
import { SESSAO_TUTORIAL, SESSAO_TUTORIAL_CLIENTE, SESSAO_TUTORIAL_USUARIO } from './caminhos';

// PERFIL=cliente salva a sessão do Adm Cliente; PERFIL=usuario, a do usuário final; sem PERFIL, a do Administrador
const PERFIL = process.env.PERFIL;
const ROTULO = PERFIL === 'cliente' ? 'Adm Cliente' : PERFIL === 'usuario' ? 'usuário final (eva.souza)' : 'Administrador';
const ARQUIVO = PERFIL === 'cliente' ? SESSAO_TUTORIAL_CLIENTE : PERFIL === 'usuario' ? SESSAO_TUTORIAL_USUARIO : SESSAO_TUTORIAL;

// A QA digita usuário e senha no navegador aberto — o script não lê nem preenche credenciais.
// Quando a página de login é deixada, a sessão (cookies) é salva em .auth/tutorial-administrador.json (no .gitignore).
test(`login manual do ${ROTULO} para os prints`, async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await page.goto('/login/index.php');
  console.log(`>> Faça o login como ${ROTULO} no navegador aberto. Você tem até 9 minutos.`);
  await page.waitForURL((url) => !/\/login\//.test(url.pathname), { timeout: 9 * 60_000, waitUntil: 'commit' });
  await page.context().storageState({ path: ARQUIVO });
  console.log('>> Sessão salva. Pode fechar o navegador.');
});
