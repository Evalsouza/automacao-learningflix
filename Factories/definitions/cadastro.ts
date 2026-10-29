import { faker } from '../faker';

export const cadastro = {
  idadeAdulta: () => String(faker.number.int({ min: 18, max: 60 })),
  // Atende à política: 8+ caracteres, dígito, minúscula, maiúscula e caractere especial
  senhaValida: () => `Qa@${faker.string.alphanumeric(6)}${faker.number.int({ min: 10, max: 99 })}a`,
  dataNascimentoAdulta: () => {
    const data = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
    return { dia: String(data.getDate()), mes: String(data.getMonth() + 1), ano: String(data.getFullYear()) };
  },
};
