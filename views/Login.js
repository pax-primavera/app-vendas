import React, { useState, useEffect } from 'react';
import { cpfMask } from "../utils/generic/format.js";
import { executarSQL } from '../services/database/index.js';
import { styleInputFocus, styleButton, styleButtonText } from '../utils/styles/index.js';
import api from '../utils/config/axios/public.js';
import apiPrivate from '../utils/config/axios/private.js';
import { Center, Box, VStack, FormControl, Button, Input, Heading, useToast } from "native-base";
import { rotas } from '../utils/generic/data';

const Login = ({ navigation }) => {
    const toast = useToast();
    const [cpf, setCpf] = useState(null);
    const [senha, setSenha] = useState(null);
    const [carregamento, setCarregamento] = useState(false);
    const [error, setError] = useState({ errorCPF: false, errorSenha: false });

    const verificarSessao = async () => {
        const logado = await executarSQL(`select * from login`);

        if (logado._array && logado._array.length > 0) {
            return navigation.navigate("Home");
        }
    }

    const estruturarModoOffline = () => {

        const inserirDados = (descricao, id, tipo, unidade = null) => {
            executarSQL(
                `insert into selects(descricao, _id, tipo, unidade_id) values ('${descricao}', '${id}',  '${tipo}',  '${unidade}')`
            );
        }

        const inserirPlanos = (id, nome, adesaoValor, mensalidadeValor, adicionalValor, unidade = null) => {
            executarSQL(
                `insert into planos(_id, nome, adesaoValor, mensalidadeValor, adicionalValor, unidade_id) values ('${id}', '${nome}',  ${adesaoValor}, ${mensalidadeValor}, ${adicionalValor}, '${unidade}')`
            );
        }

        Promise.all(rotas.map((endpoint) => apiPrivate.get(endpoint))).then(([{ data: estadoCivil }, { data: religioes }, { data: logradouros }, { data: locaisCobranca }, { data: unidades }]) => {

            estadoCivil.estadoCivil.map(async (civil) => {
                await inserirDados(civil.nome_estado_civil, civil.id, 1);
            });
            religioes.religioes.map(async (religiao) => {
                await inserirDados(religiao.nome_religiao, religiao.id, 2);
            });
            logradouros.logradouros.map(async (logradouro) => {
                await inserirDados(logradouro.nome_logradouro, logradouro.id, 3);
            });
            locaisCobranca.locaisCobranca.map(async (local) => {
                await inserirDados(local.nome_cobranca, local.id, 4);
            });
            unidades.unidades.map(async (unidade) => {
                await inserirDados(unidade.nome, unidade.id, 5);

                const rotasUniadades = [
                    `lista-planos/unidade-id=${unidade.id}`, // Tabela única,
                    `lista-parentescos/unidade-id=${unidade.id}`, // Tipo(6),
                    `lista-templates/unidade-id=${unidade.id}`, // Tipo(7),
                ];

                Promise.all(rotasUniadades.map((url) => apiPrivate.get(url))).then(([{ data: planos }, { data: parentescos }, { data: templates }]) => {
                    planos.planos.map(async (plano) => {
                        await inserirPlanos(plano.id, plano.nome, plano.adesaoValor, plano.mensalidadeValor, plano.adicionalValor, unidade.id);
                    });

                    parentescos.parentescos.map(async (parentesco) => {
                        await inserirDados(parentesco.nome, parentesco.id, 6, unidade.id);
                    });

                    templates.templates.map(async (template) => {
                        await inserirDados(template.nome, template.id, 7, unidade.id);
                    });
                });
            });
            init();
        });
    }

    const init = () => {
        toast.show({
            title: "(Aviso) - Pax Vendedor",
            description: "Sincronizando informações!",
            placement: "top",
            padding: 20
        });
        setTimeout(() => {
            /// Limpar campos
            setCpf(null);
            setSenha(null);
            setCarregamento(false);
            /// Redirecionar pata tela principal
            return navigation.navigate("Home");
        }, 3000);
    }

    const registrarSessao = async (object) => {
        executarSQL(`delete from login`);

        executarSQL(
            `insert into login(id, usuario, token) values (0, '${object.usuario}', '${object.token}')`
        );
    }

    const logar = async () => {

        if (validateInputs()) {
            return toast.show({
                title: "(Aviso) - Pax Vendedor",
                description: "Preencha os campos corretamente.",
                placement: "top"
            });
        }

        setCarregamento(true);

        try {
            const response = await api.post('/login', { cpf, senha });
            /// Registrar sessão
            registrarSessao(response.data);
            /// Setup sincronização
            estruturarModoOffline();
        } catch (err) {
            if (err.response.data && err.response.data.mensagem) {
                toast.show({
                    title: "(Aviso) - Pax Vendedor",
                    description: err.response.data.mensagem,
                    placement: "top"
                });
            } else {
                toast.show({
                    title: "(Aviso) - Pax Vendedor",
                    description: "Não foi possivel efetuar login! Usuário não encontrado.",
                    placement: "top"
                });
            }
            setCarregamento(false);
        }
    }

    const tratarCPF = (cpf) => {
        if (cpf === null || cpf === '') return setCpf(null);
        setCpf(cpfMask(cpf))
    }

    const validateInputs = () => {
        !cpf ? setError(prev => ({ ...prev, errorCPF: true })) : setError(prev => ({ ...prev, errorCPF: false }));
        !senha ? setError(prev => ({ ...prev, errorSenha: true })) : setError(prev => ({ ...prev, errorSenha: false }));
        return !cpf || !senha ? true : false;
    }

    const changeInput = (campo, value) => {
        // Validar campos
        validateInputs();

        if (campo === 'cpf') {
            return tratarCPF(value);
        }
        return setSenha(value);
    }

    useEffect(() => {
        verificarSessao();
    }, []);

    return (

        <VStack m="2">
            <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={{
                backgroundColor: "gray.50"
            }}
                _web={{
                    shadow: 2,
                    borderWidth: 0
                }} >
                <Center w="100%">
                    <Box safeArea w="100%" pl="10" pr="10" mb="10" >
                        <Heading size="lg" fontWeight="500" color="green.800" >
                            Pax Vendedor
                        </Heading>
                        <Heading mt="1" fontWeight="medium" size="xs">
                            Informe seu 'CPF' e 'Senha':
                        </Heading>

                        <VStack space={3} mt="4">
                            <FormControl isInvalid={error.errorCPF} >
                                <FormControl.Label>CPF:</FormControl.Label>
                                <Input keyboardType='numeric' value={cpf} onChangeText={e => changeInput('cpf', e)} _focus={styleInputFocus} placeholder='Digite seu CPF:' />
                            </FormControl>
                            <FormControl isInvalid={error.errorSenha} >
                                <FormControl.Label>Senha:</FormControl.Label>
                                <Input type="password" value={senha} onChangeText={e => changeInput('senha', e)} _focus={styleInputFocus} placeholder='Digite sua senha:' />
                            </FormControl>
                            <Button mt="2"
                                size="lg"
                                isLoading={carregamento}
                                _text={styleButtonText}
                                _light={styleButton}
                                onPress={() => logar()}
                            >
                                Entrar
                            </Button>
                        </VStack>
                    </Box>
                </Center>
            </Box>
        </VStack>
    );
}

export { Login };