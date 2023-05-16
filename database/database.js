import { DatabaseConnection } from './connection.js';

var db = null;

export default class DatabaseInit {
    constructor() {
        db = DatabaseConnection.getConnection();

        db.exec([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () =>
            console.log('Foreign keys turned on')
        )

        this.Init()
    }

    Init() {

        var sql = [
            `create table if not exists adicional(
                id integer,
                descricao text,
                valorAdesao decimal(10,2),
                valorMensalidade decimal(10,2),
                pet int default 0,
                porte text,
                carenciaNovo integer,
                carenciaAtraso integer,
                ativo int default 1,
                resgate int default 1,
                unidadeId integer
            );`,
            `create table if not exists especie(
                id integer PRIMARY KEY,
                descricao text,
                ativo int default 1
            );`,
            `create table if not exists parentesco(
                id integer,
                descricao text,
                adicional int default 0,
                ativo int default 1,
                unidadeId integer
            );`,
            `create table if not exists plano(
                id integer,
                descricao text,
                valorAdesao decimal(10,2),
                valorMensalidade decimal(10,2),
                valorAdicional decimal(10,2),
                carenciaNovo integer,
                carenciaAtraso integer,
                valorAdesaoTransferencia integer,
                ativo int default 1,
                limiteDependente int,
                unidadeId integer
            );`,
            `create table if not exists raca(
                id integer PRIMARY KEY,
                descricao text,
                ativo int default 1
            );`,
            `create table if not exists unidade(
                id integer,
                descricao text,
                cnpj text,
                razaoSocial text,
                telefone text,
                numero text,
                rua text,
                bairro text,
                municipio text,
                uf text,
                regiao text,
                ativo int default 1
            );`,
            `create table  if not exists login(
                id integer PRIMARY KEY,
                nome text,
                cpf text,
                token text,
                senha text,
                sincronismo text
            );`,

            `create table if not exists titular(
                id integer PRIMARY KEY AUTOINCREMENT,
                envioToken int default 1,
                dataContrato text,
                nomeTitular text,
                rgTitular text,
                cpfTitular text,
                dataNascTitular text,
                estadoCivilTitular text,
                nacionalidadeTitular text,
                naturalidadeTitular text,
                religiaoTitular text,
                email1 text,
                email2 text,
                telefone1 text,
                telefone2 text,
                sexoTitular text,
                isCremado int default 0,
                profissaoTitular text,
                tipoLogradouroResidencial text,
                nomeLogradouroResidencial text,
                numeroResidencial text,
                quadraResidencial text,
                loteResidencial text,
                complementoResidencial text,
                bairroResidencial text,
                cepResidencial text,
                cidadeResidencial text,
                estadoResidencial text,
                tipoLogradouroCobranca text,
                nomeLogradouroCobranca text,
                numeroCobranca text,
                quadraCobranca text,
                loteCobranca text,
                complementoCobranca text,
                bairroCobranca text,
                cepCobranca text,
                cidadeCobranca text,
                estadoCobranca text,
                plano text,
                enderecoCobrancaIgualResidencial int,
                localCobranca text,
                tipo text,
                empresaAntiga text,
                numContratoAntigo text,
                dataContratoAntigo text,
                diaVencimento int,
                dataPrimeiraMensalidade text,
                melhorHorario time,
                melhorDia int,
                is_enviado int default 0,
                anexo1 text,
                anexo2 text,
                anexo3 text,
                anexo4 text,
                anexo5 text,
                anexo6 text,
                anexo7 text,
                anexo8 text,
                dataVencimentoAtual text,   
                dataVencimento text,
                status int default 0,
                unidadeId integer
            );`,

            `create table if not exists dependente(
                id integer PRIMARY KEY AUTOINCREMENT,
                nome text,
                parentesco text,
                is_pet int,
                cpfDependente text,
                dataNascimento text,
                cremacao int default 0,
                especie int,
                porte text,
                resgate int default 1,
                raca text,
                altura decimal(10,5),
                peso decimal(10,5),
                cor text,
                titular_id integer,
                adicionalId integer,
                FOREIGN KEY (titular_id)
                    REFERENCES titular(id)
            );`,

        ];

        db.transaction(
            tx => {
                for (var i = 0; i < sql.length; i++) {
                    tx.executeSql(sql[i]);
                }
            }, (error) => {
                console.log(error);
            }, () => {
                console.log("Tabelas criadas com sucesso!");
            }
        );
    }
}
