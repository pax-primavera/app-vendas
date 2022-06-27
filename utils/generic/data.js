const rotas = [
    '/lista-estado-civil', // Tipo(1)
    '/lista-religioes', // Tipo(2)
    '/lista-logradouros', // Tipo(3)
    '/lista-locais-cobranca', // Tipo(4)
    '/lista-unidades-usuario' // Tipo(5)
];

const sexo = [
    {
        id: 1,
        descricao: 'Masculino'
    },
    {
        id: 2,
        descricao: 'Feminino'
    }
];

const especies = [
    {
        id: 1,
        descricao: 'Canina'
    },
    {
        id: 2,
        descricao: 'Felina'
    },
    {
        id: 3,
        descricao: 'Outros'
    }
];

const cores = [
    {
        id: 1,
        descricao: 'Branco'
    },
    {
        id: 2,
        descricao: 'Preto'
    },
    {
        id: 3,
        descricao: 'Pardo'
    },
    {
        id: 4,
        descricao: 'Preto e Branco '
    }
];

const portes = [
    {
        id: 1,
        descricao: 'P'
    },
    {
        id: 2,
        descricao: 'M'
    },
    {
        id: 3,
        descricao: 'G'
    },
    {
        id: 4,
        descricao: 'GG'
    }
];

const tiposContratos = [
    {
        id: 0,
        descricao: 'Novo'
    },
    {
        id: 1,
        descricao: 'Transferência'
    },
];

export {
    sexo,
    especies,
    cores,
    portes,
    rotas,
    tiposContratos
};