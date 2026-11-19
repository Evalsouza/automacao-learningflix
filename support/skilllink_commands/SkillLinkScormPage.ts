import { Locator, Page } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

export type AtividadeScorm = { cmid: number; nome: string; cursoId: number; curso: string; categoria: string };

export type ResultadoGeracao = {
  // Competências na lista do SCORM depois de clicar no botão
  quantidade: number;
  // Mensagem do Skill Link na seção (sucesso ou erro)
  mensagem: string;
  creditosEsgotados: boolean;
};

// Edição da atividade SCORM (/course/modedit.php?update=<cmid>) → seção "Skill Link" → botão
// "Gerar competências com o Skill Link". O botão chama local_skillbox_start_scorm_extraction e acompanha a geração
// (até 75 tentativas de 4 s); as competências entram na lista da seção e só ficam gravadas ao salvar a atividade.
// Cada geração consome créditos do Skill Link (≈ 1 crédito por SCORM em 11/2026). Mapeada no QA em 16/11/2026
export class SkillLinkScormPage extends PaginaBase {
  readonly botaoGerar: Locator;
  readonly competencias: Locator;
  readonly mensagens: Locator;
  readonly salvarEVoltar: Locator;

  constructor(page: Page) {
    super(page);
    this.botaoGerar = page.locator('#scorm-ai-button');
    this.competencias = page.locator('#addscormskill option');
    this.mensagens = page.locator('#skillbox-scorm-notifications');
    this.salvarEVoltar = page.locator('#id_submitbutton2');
  }

  // Qualquer página do Moodle serve para ter o sesskey das chamadas AJAX
  async abrirPlataforma() {
    await this.abrir('/local/skillbox/tokens.php');
  }

  // Cursos com SCORM (busca do Moodle por módulo) e as atividades SCORM de cada um
  async listarScorms(): Promise<AtividadeScorm[]> {
    return this.page.evaluate(async () => {
      const M = (window as unknown as { M: { cfg: { sesskey: string } } }).M;
      const chamar = async (metodo: string, args: object) => {
        const r = await fetch(`/lib/ajax/service.php?sesskey=${M.cfg.sesskey}&info=${metodo}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ index: 0, methodname: metodo, args }]),
        });
        const j = (await r.json())[0];
        if (j.error) throw new Error(`${metodo}: ${j.exception?.message}`);
        return j.data;
      };
      const { courses } = await chamar('core_course_search_courses', {
        criterianame: 'modulelist',
        criteriavalue: 'scorm',
        page: 0,
        perpage: 1000,
      });
      const atividades: { cmid: number; nome: string; cursoId: number; curso: string; categoria: string }[] = [];
      for (let i = 0; i < courses.length; i += 10)
        await Promise.all(
          courses.slice(i, i + 10).map(async (c: { id: number; fullname: string; categoryname: string }) => {
            const estado = JSON.parse(await chamar('core_courseformat_get_state', { courseid: c.id }));
            for (const cm of estado.cm.filter((x: { module: string }) => x.module === 'scorm'))
              atividades.push({ cmid: Number(cm.id), nome: cm.name, cursoId: c.id, curso: c.fullname, categoria: c.categoryname });
          }),
        );
      return atividades.sort((a, b) => a.cursoId - b.cursoId || a.cmid - b.cmid);
    });
  }

  // Quantas competências o SCORM já tem, lendo o formulário sem abrir a página — só leitura.
  // null = o formulário não tem a seção do Skill Link
  async competenciasSalvas(cmid: number): Promise<number | null> {
    return this.page.evaluate(async (cmid) => {
      const html = await (await fetch(`/course/modedit.php?update=${cmid}`, { credentials: 'include' })).text();
      if (!html.includes('scorm-ai-button')) return null;
      const lista = html.match(/id="addscormskill"[\s\S]*?<\/select>/)?.[0] ?? '';
      return (lista.match(/<option/g) ?? []).length;
    }, cmid);
  }

  async abrirEdicao(cmid: number) {
    await this.abrir(`/course/modedit.php?update=${cmid}`);
    await this.botaoGerar.waitFor();
    // O botão aparece antes de o script do Skill Link iniciar: sem esperar, o clique não faz nada (16/11/2026)
    await this.page
      .waitForFunction(() => !(window as unknown as { M?: { util?: { pending_js?: unknown[] } } }).M?.util?.pending_js?.length, null, {
        timeout: 60_000,
      })
      .catch(() => {});
  }

  // Clica no botão, confirma que a geração começou ("Gerando competências...") — senão clica de novo — e espera
  // terminar: o botão volta ao texto original (ou fica bloqueado sem créditos)
  async gerar(): Promise<ResultadoGeracao> {
    const antes = await this.competencias.count();
    const gerando = this.botaoGerar.filter({ hasText: 'Gerando' });
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      await this.botaoGerar.click();
      if (
        await gerando.waitFor({ timeout: 15_000 }).then(
          () => true,
          () => false,
        )
      )
        break;
      // Geração rápida pode terminar antes de o "Gerando" ser visto: com competências novas ou mensagem, não clica de novo
      // (cada clique gasta crédito)
      const mensagem = (await this.mensagens.innerText().catch(() => '')).trim();
      if ((await this.competencias.count()) > antes || mensagem) break;
      if (tentativa === 3) throw new Error('O botão "Gerar competências com o Skill Link" não iniciou a geração');
    }
    await this.page.waitForFunction(
      () => {
        const b = document.querySelector<HTMLButtonElement>('#scorm-ai-button');
        return !!b && !b.textContent?.includes('Gerando') && (!b.disabled || b.title.includes('esgotados'));
      },
      null,
      { timeout: 6 * 60_000, polling: 2_000 },
    );
    // Sem o "× Ignorar essa notificação" do botão de fechar
    const mensagem = ((await this.mensagens.innerText().catch(() => '')) || '')
      .replace(/×?\s*Ignorar essa notificação/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const titulo = (await this.botaoGerar.getAttribute('title')) ?? '';
    return { quantidade: (await this.competencias.count()) - antes, mensagem, creditosEsgotados: titulo.includes('esgotados') };
  }

  // "Salvar e voltar ao curso". Se o Moodle recusar o formulário, a página continua na edição: devolve as mensagens
  async salvar(): Promise<string | null> {
    await this.salvarEVoltar.click();
    await this.page.waitForURL((url) => !url.pathname.startsWith('/course/modedit.php'), { timeout: 120_000 }).catch(() => {});
    if (!new URL(this.page.url()).pathname.startsWith('/course/modedit.php')) return null;
    const erros = await this.page.locator('.invalid-feedback:visible, .error:visible').allInnerTexts();
    return erros.join('; ') || 'o formulário não foi salvo';
  }
}
