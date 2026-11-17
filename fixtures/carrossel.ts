// DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial

// Mensagens copiadas do DT/EVT
export const mensagensCarrossel = {
  gravadas: 'Mudanças gravadas',
  novoSlide: 'Um novo slide foi adicionado ao carrossel da Página inicial.',
  erroGeral: 'Algumas configurações não mudaram devido a um erro.',
  erroDimensao: 'Erro de dimensão: A imagem enviada possui 940x627 px, enquanto que no mínimo ela deve ter 1280x720 px.',
  confirmarRemocao: (n: number) =>
    `Você tem certeza que quer remover o slide ${n} do carrossel da Página inicial? Esta ação removerá a imagem do slide do moodledata.`,
  slideRemovido: (n: number) => `O slide ${n} do carrossel foi removido com sucesso.`,
  confirmarExclusaoArquivo: 'Você tem certeza que quer excluir este arquivo?',
};

// Campos de cada slide, como aparecem na aba "Carrossel da Página Inicial" — o DT/EVT pede que não exista "Alinhamento"
export const camposDoSlide = ['Título', 'Cor do título', 'Texto', 'Idioma', 'URL', 'Imagem'];

// Slide de teste criado pela suíte de configuração e removido ao final — os slides existentes nunca são alterados
export const slideDeTeste = {
  titulo: 'TESTE AUTOMAÇÃO CARROSSEL',
  corDoTitulo: '#FFFFFF',
  // Valor do campo "Idioma" — o texto da opção tem caracteres invisíveis, por isso o teste usa o código
  idioma: 'pt_br',
  idiomaDiferente: 'en',
  url: 'https://somosrevvo.com.br/',
};

// Idiomas da plataforma e do campo "Idioma" do slide (mapeados em 17/11) — cada slide aparece só para quem
// está com a plataforma no mesmo idioma; não existe a opção "Todos os idiomas"
export const idiomasDaPlataforma = [
  { id: 'CR06.1', codigo: 'pt_br', nome: 'Português - Brasil' },
  { id: 'CR06.2', codigo: 'en', nome: 'English' },
  { id: 'CR06.3', codigo: 'es', nome: 'Español - Internacional' },
];

// Intervalo usado no teste de troca — CT 2 do DT/EVT
export const intervaloDeTeste = 5;

// Cor da Marca do CT 1 do DT/EVT — aplicada no tema e restaurada ao final
export const corDaMarcaDeTeste = '#AD1400';

// Vídeo enviado pela QA para o slide de vídeo; sem ele o teste fica pendente
export const videoDeTeste = 'fixtures/arquivos/carrossel/video.mp4';
