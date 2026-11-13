import { test as teardown } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'fs';
import { sessoes, comSessao } from './sessoes';
import { ConfiguracaoAssistentePage } from './judy_commands/ConfiguracaoAssistentePage';
import { ESTADO_JUDY } from './judy_commands/estado';

// Depois de todos os testes, mesmo com falhas: volta o "Tema da assistente" para o valor encontrado no início
teardown('Judy de volta ao tema original', async ({ browser }) => {
  teardown.setTimeout(180_000);
  teardown.skip(!existsSync(ESTADO_JUDY), 'O setup da Judy não registrou o tema original');
  const { original, alterado } = JSON.parse(readFileSync(ESTADO_JUDY, 'utf8')) as { original: string; alterado: boolean };
  if (alterado) await comSessao(browser, sessoes.administrador, (pagina) => new ConfiguracaoAssistentePage(pagina).definirTema(original));
  rmSync(ESTADO_JUDY);
});
