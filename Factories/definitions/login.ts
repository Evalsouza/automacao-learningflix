import { faker } from '../faker';

export const login = {
  usuarioNaoCadastrado: () => `qa.inexistente.${faker.string.alphanumeric(8).toLowerCase()}`,
  senhaInvalida: () => faker.internet.password({ length: 12 }),
  // Fictícia: com a senha visível, vídeo, trace e screenshot gravariam uma senha real
  senhaParaExibir: () => faker.internet.password({ length: 12, prefix: 'Qa@' }),
};
