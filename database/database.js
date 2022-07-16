import { DatabaseConnection } from './connection.js';

var db = null;

export default class DatabaseInit {
    constructor() {
        db = DatabaseConnection.getConnection();

        db.exec([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () =>
            console.log('Foreign keys turned on')
        );

        this.Init()
    }

    Init() {
        var sql = [
            `create table  if not exists login(
                id integer PRIMARY KEY AUTOINCREMENT,
                usuario text,
                token text
            );`,

            `create table if not exists titulares(
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
                plano int,
                enderecoCobrancaIgualResidencial int,
                localCobranca int,
                tipo int default 0,
                empresaAntiga text,
                numContratoAntigo text,
                dataContratoAntigo text,
                diaVencimento int,
                dataPrimeiraMensalidade text,
                melhorHorario time,
                melhorDia int,
                isOnline int default 1,
                sendByWhatsApp int default 0,
                is_enviado int default 0
            );`,

            `create table if not exists dependentes(
                id integer PRIMARY KEY AUTOINCREMENT,
                nome text,
                parentesco int,
                is_pet int,
                cpf_dependente text,
                dataNascimento text,
                cremacao int default 0,
                especie int,
                porte int,
                resgate int default 1,
                raca text,
                altura decimal(10,5),
                peso decimal(10,5),
                cor int,
                titular_id integer,
                FOREIGN KEY (titular_id)
                    REFERENCES titulares(id)
            );`
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
