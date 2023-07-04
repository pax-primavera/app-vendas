import { DatabaseConnection } from '../../database/connection.js';

import {
    Alert
} from "react-native";

const table = "titular";
const tabela = "dependente";
const tabelaAviso = "avisos";
const tabelaClientes = "clientes";

const db = DatabaseConnection.getConnection();

export const executarSQL = (sql) => {

    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(sql, [], (_, { rows }) => {
            resolve(rows)

        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }, (txError) => {
        Alert.alert('Erro ao executar SQL', txError.toString());
    }))

}

export const insertIdSQL = (sql) => {
    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(sql, [], (_, { insertId }) => {
            resolve(insertId)
        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }))
}

export const executarListSQL = () => {

    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(`select * from ${table} ORDER BY ${table}.dataContrato ASC `, [], (_, { rows }) => {
            resolve(rows)

        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }, (txError) => {
        Alert.alert('Erro ao executar SQL', txError.toString());
    }))

}

export const executarListVendas = () => {

    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(`select * from ${tabelaClientes} WHERE finalizada != ${1}`, [], (_, { rows }) => {
            resolve(rows)

        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }, (txError) => {
        Alert.alert('Erro ao executar SQL', txError.toString());
    }))

}

export const executarListIDSQL = (data) => {

    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(`select * from ${table} WHERE id=${data}`, [], (_, { rows }) => {
            resolve(rows)
        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }, (txError) => {
        Alert.alert('Erro ao executar SQL', txError.toString());
    }))

}

export const executarListDependenteIDSQL = (data) => {

    return new Promise((resolve, reject) => db.transaction(tx => {
        tx.executeSql(`select * from ${tabela} WHERE titular_id=${data}`, [], (_, { rows }) => {
            resolve(rows)
        }), (sqlError) => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }, (txError) => {
        Alert.alert('Erro ao executar SQL', txError.toString());
    }))

}