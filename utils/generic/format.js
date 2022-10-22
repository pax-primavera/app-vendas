import moment from "moment";
moment.locale('pt-br');

const cpfMask = value => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

const timeMask = value => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1:$2')
    .replace(/(\d{2})(\d)/, '$1:$2');
}

const foneMask = value => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

const dataMaskEUA = value => {
  return moment(moment(value, "DD/MM/YYYY")).format("YYYY-MM-DD");
}

const isBoolean = value => {
  return ['true', true, 1].includes(value) ? 1 : 0;
}

const dataMask = value => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{4})\d+?$/, '$1')
}

const cepMask = value => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1-$2")
    .replace(/(\d{3})\d+?$/, '$1');
  }

const isRepeatingNumber = str => /^(\d)(\1){10}$/.test(str);

const validarCPF = input => {
  const cpf = input.replace(/\D/g, '');

  if (
    cpf === '' ||
    cpf.length !== 11 ||
    !/^\d{11}$/.test(cpf) ||
    isRepeatingNumber(cpf)
  ) {
    return false;
  }

  const digits = cpf.split('').map(x => parseInt(x));

  for (let j = 0; j < 2; j++) {
    let sum = 0;

    for (let i = 0; i < 9 + j; i++) {
      sum += digits[i] * (10 + j - i);
    }

    let checkDigit = 11 - (sum % 11);

    if (checkDigit === 10 || checkDigit === 11) {
      checkDigit = 0;
    }

    if (checkDigit !== digits[9 + j]) {
      return false;
    }
  }

  return true;
};

const moedaMask = value => {
  return value
    .toFixed(2)
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

const validarEmail = email => {
  const valida = /\S+@\S+\.\S+/; 

  if (valida.test(email)) {
    return true;
  }
  return false;
}

export { cpfMask, timeMask, foneMask, dataMask, cepMask, moedaMask, dataMaskEUA, isBoolean, validarCPF, validarEmail }