import { test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { sessoes, comSessao } from './sessoes';
import { ConfiguracaoAssistentePage } from './judy_commands/ConfiguracaoAssistentePage';
import { ESTADO_JUDY, CHAT_CENTRALIZADO, BOTAO_FLUTUANTE } from './judy_commands/estado';

// Judy em "Chat centralizado" cobre botões das janelas: antes dos testes passa para "Botão Flutuante".
// O valor encontrado fica em .estado/judy.json; o judy.teardown.ts o restaura ao final — decisão da QA (13/11/2026).
// Este passo nunca falha: se a tela não responder, os testes rodam assim mesmo, com recolherJudy() como reserva —
// um setup com falha pularia a rodada inteira
setup('Judy em "Botão flutuante" durante os testes', async ({ browser }) => {
  setup.setTimeout(180_000);
  try {
    await comSessao(browser, sessoes.administrador, async (pagina) => {
      const config = new ConfiguracaoAssistentePage(pagina);
      const original = await config.temaAtual();
      mkdirSync(dirname(ESTADO_JUDY), { recursive: true });
      // Só restaura o que a automação mudou: se já não estava centralizada, não mexe e não restaura
      writeFileSync(ESTADO_JUDY, JSON.stringify({ original, alterado: original === CHAT_CENTRALIZADO }), 'utf8');
      if (original === CHAT_CENTRALIZADO) await config.definirTema(BOTAO_FLUTUANTE);
      setup.info().annotations.push({ type: 'Judy', description: `Tema encontrado: ${original}` });
    });
  } catch (erro) {
    setup.info().annotations.push({ type: 'Judy', description: `Tema não alterado: ${String(erro).split('\n')[0]}` });
  }
});
