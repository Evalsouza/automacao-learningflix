import { faker } from '../faker';

export const redefinicao = {
  identificacaoInexistente: () => `qa.inexistente.${faker.string.alphanumeric(8).toLowerCase()}`,
  // Data no formato d/m/Y, garantidamente diferente da informada
  dataDiferente: (correta: string) => {
    for (;;) {
      const data = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
      const texto = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
      if (texto !== correta) return texto;
    }
  },
  cidade: () => faker.location.city(),
  // Primeira opção da lista diferente do valor correto
  opcaoDiferente: (opcoes: string[], correta: string) =>
    opcoes.find((o) => o && o !== correta && !/^Nenhum|^Nenhuma|^Selecione/.test(o)) ?? '',
};
