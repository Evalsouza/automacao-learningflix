import { Page, Locator } from '@playwright/test';

type DadosNovaConta = {
  identificacao: string;
  senha: string;
  email: string;
  nome: string;
  sobrenome: string;
  dataNascimento: { dia: string; mes: string; ano: string };
};

// Fluxo "Criar uma conta": Verificação de idade e localização → Nova conta
export class CriarContaPage {
  readonly page: Page;
  readonly linkCriarConta: Locator;
  readonly tituloVerificacao: Locator;
  readonly campoIdade: Locator;
  readonly campoPaisVerificacao: Locator;
  readonly botaoContinuar: Locator;
  readonly botaoCancelar: Locator;
  readonly tituloNovaConta: Locator;
  readonly campoIdentificacao: Locator;
  readonly campoSenha: Locator;
  readonly campoConfirmarSenha: Locator;
  readonly campoEmail: Locator;
  readonly campoConfirmarEmail: Locator;
  readonly campoNome: Locator;
  readonly campoSobrenome: Locator;
  readonly campoCargo: Locator;
  readonly entradaCargo: Locator;
  readonly selectCargo: Locator;
  readonly botaoCriarMinhaConta: Locator;
  readonly mensagemMenorDigital: Locator;

  constructor(page: Page) {
    this.page = page;
    this.linkCriarConta = page.getByRole('link', { name: 'Criar uma conta' });
    this.tituloVerificacao = page.getByRole('heading', { name: 'Verificação de idade e localização' });
    this.campoIdade = page.getByRole('textbox', { name: 'Qual é a sua idade?' });
    this.campoPaisVerificacao = page.getByRole('combobox', { name: 'Em qual país você vive?' });
    this.botaoContinuar = page.getByRole('button', { name: 'Continuar' });
    this.botaoCancelar = page.getByRole('button', { name: 'Cancelar' });
    this.tituloNovaConta = page.getByRole('heading', { name: 'Nova conta', level: 1 });
    this.campoIdentificacao = page.getByRole('textbox', { name: /^Identificação de usuário/ });
    this.campoSenha = page.getByRole('textbox', { name: /^Senha\./ });
    this.campoConfirmarSenha = page.getByRole('textbox', { name: 'Confirme a senha.' });
    this.campoEmail = page.getByRole('textbox', { name: 'Endereço de e-mail', exact: true });
    this.campoConfirmarEmail = page.getByRole('textbox', { name: 'Confirmar endereço de e-mail' });
    this.campoNome = page.getByRole('textbox', { name: 'Nome', exact: true });
    this.campoSobrenome = page.getByRole('textbox', { name: 'Sobrenome', exact: true });
    // Cargo é um autocomplete: o select real fica oculto e a digitação acontece no campo de busca ao lado
    this.campoCargo = page.locator('#fitem_id_profile_field_position');
    this.entradaCargo = this.campoCargo.locator('input[type=text]');
    this.selectCargo = this.campoCargo.locator('select');
    this.botaoCriarMinhaConta = page.getByRole('button', { name: 'Criar minha conta' });
    // Página "Menor digital": exibida quando a idade informada é menor que a idade mínima
    this.mensagemMenorDigital = page.getByText('Você é muito jovem para criar uma conta neste site.');
  }

  async acessarPeloLogin() {
    await this.page.goto('/login/index.php');
    await this.linkCriarConta.click();
  }

  async verificarIdadeELocalizacao(idade: string, pais: string) {
    await this.campoIdade.fill(idade);
    await this.campoPaisVerificacao.selectOption({ label: pais });
    await this.botaoContinuar.click();
  }

  async selecionarCargo(cargo: string) {
    await this.entradaCargo.click();
    await this.entradaCargo.fill(cargo);
    await this.page.getByRole('option', { name: cargo, exact: true }).click();
  }

  // Cada campo do formulário fica num bloco "fitem_<id>" com a marca de obrigatório e a mensagem de erro
  marcaObrigatorio(bloco: string): Locator {
    return this.page.locator(`#${bloco}`).getByTitle('Obrigatório', { exact: true }).first();
  }

  mensagemDoCampo(bloco: string): Locator {
    return this.page.locator(`#${bloco} .form-control-feedback`).first();
  }

  async cargosDisponiveis(): Promise<string[]> {
    const opcoes = await this.selectCargo.locator('option').allInnerTexts();
    return opcoes.map((o) => o.trim()).filter((o) => o && o !== 'Nenhum cargo selecionado');
  }

  async preencherNovaConta(dados: DadosNovaConta) {
    await this.campoIdentificacao.fill(dados.identificacao);
    await this.campoSenha.fill(dados.senha);
    await this.campoConfirmarSenha.fill(dados.senha);
    await this.campoEmail.fill(dados.email);
    await this.campoConfirmarEmail.fill(dados.email);
    await this.campoNome.fill(dados.nome);
    await this.campoSobrenome.fill(dados.sobrenome);
    const nascimento = this.page.getByRole('group', { name: 'Data de Nascimento' });
    await nascimento.getByRole('combobox', { name: 'Dia' }).selectOption(dados.dataNascimento.dia);
    await nascimento.getByRole('combobox', { name: 'Mês' }).selectOption(dados.dataNascimento.mes);
    await nascimento.getByRole('combobox', { name: 'Ano' }).selectOption(dados.dataNascimento.ano);
  }
}
