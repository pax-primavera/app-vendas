import { DatabaseConnection } from './Connection.js';

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
                envioToken int,
                dataContrato date,
                nomeTitular text,
                rgTitular text,
                cpfTitular text,
                dataNascTitular date,
                estadoCivilTitular text,
                nacionalidadeTitular text,
                naturalidadeTitular text,
                religiaoTitular text,
                sexoTitular text,
                isCremado text,
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
                tipo int,
                empresaAntiga text,
                numContratoAntigo text, 
                dataContratoAntigo text, 
                diaVencimento int, 
                dataPrimeiraMensalidade date,
                melhorHorario time,
                melhorDia int,
                isOnline int,
                sendByWhatsApp int,
                is_enviado int default 0
            );`,
            
            `create table if not exists contatos(
                id integer PRIMARY KEY AUTOINCREMENT,
                contato text,
                titular_id integer,
                FOREIGN KEY (titular_id) 
                    REFERENCES titulares(id)
            );`,

            `create table if not exists dependentes(
                id integer PRIMARY KEY AUTOINCREMENT,
                nome text,
                parentesco int,
                is_pet int,
                cpf_dependente text,
                dataNascimento date,
                cremacao int,
                especie int, 
                porte int,
                resgate int,
                raca text,
                altura decimal(10,5),
                peso decimal(10,5),
                cor int,
                titular_id integer,
                FOREIGN KEY (titular_id) 
                    REFERENCES titulares(id)
            );`,

            `create table if not exists selects(
                id integer PRIMARY KEY AUTOINCREMENT,
                descricao text,
                _id integer,
                tipo int,
                unidade_id text
            );`,
            
            `create table if not exists planos(
                id integer PRIMARY KEY AUTOINCREMENT,
                _id integer,
                nome text,
                adesaoValor int,
                mensalidadeValor  int,
                adicionalValor  int,
                unidade_id text
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