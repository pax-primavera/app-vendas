import React, { useState, useEffect, useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, BackHandler } from 'react-native';
import { executarSQL } from '../services/database/index.js';
import { ScrollView, Image, Center, HStack, VStack, Icon, Heading, Text, Container, Pressable, useToast } from "native-base";
import colors from '../utils/styles/colors.js';
import { textCenter } from '../utils/styles/index';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from "../components/views/loading/index";
import api from "../utils/config/axios/public.js";
import moment from 'moment/moment.js';
import NetInfo from "@react-native-community/netinfo";

function Home({ navigation }) {
    const toast = useToast();
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [usuario, setUsuario] = useState('Usuário não encontrado!');
    const [avisos, setAvisos] = useState(false);
    const [avisosVendas, setVendas] = useState(false);

    const setup = async () => {
        NetInfo.refresh().then(async (state) => {
            if (state.isConnected) {
                let date = moment().format('d');
                let time = moment().format('HH:mm');
                if (date == 1 && time >= '07:30' && time <= '08:00') {
                    setCarregamentoTela(true)
                    await executarSQL(`DELETE from dependente where titular_id IN (SELECT id FROM titular where status = 3)`);
                    await executarSQL(`DELETE from titular WHERE status = 3`);
                    setCarregamentoTela(false)
                    return toast.show({
                        placement: "top",
                        render: () => {
                            return (
                                <ComponentToast
                                    message={`Conexão estabelecida com sucesso. Contratos Sincronizados`}
                                />
                            );
                        },
                    });
                }
            }
        });

        // try {
        //     const response = await axiosAuth.get(`/avisos`);
        //     setAvisos(response.data.avisos[0].ativo)
        // } catch (e) {
        //   return toast.show({
        //     placement: "top",
        //     render: () => {
        //       return <ComponentToast message={`Não foi possivel carregar informações dos avisos, contate o suporte: ${e.toString()}`} />
        //     }
        //   });
        // };
        // setup();
    }

    const backAction = () => {
        Alert.alert("Atenção!", "Tem certeza que deseja sair?", [
            {
                text: "Cancelar",
                onPress: () => null,
                style: "cancel"
            },
            {
                text: "SIM",
                onPress: () => BackHandler.exitApp()
            }
        ]);
        return true;
    };

    async function getUsuario() {
        setCarregamentoTela(true)
        //setup();
        const logado = await executarSQL(`select * from login`);

        if (logado._array && logado._array.length > 0) {
            setCarregamentoTela(false)
            return setUsuario(logado._array[0].nome);

        }

        return navigation.navigate("Login");
    }

    const sincronismo = async () => {
        setCarregamentoTela(true)
        try {
            const logado = await executarSQL(`select * from login`);
            const token = await executarSQL(`select token from login`);
            const contrato = await executarSQL(`select id,
        envioToken ,
        dataContrato,
        nomeTitular,
        rgTitular,
        cpfTitular,
        dataNascTitular,
        estadoCivilTitular,
        nacionalidadeTitular,
        naturalidadeTitular,
        religiaoTitular ,
        email1,
        email2,
        telefone1,
        telefone2,
        sexoTitular,
        isCremado,
        profissaoTitular,
        tipoLogradouroResidencial,
        nomeLogradouroResidencial,
        numeroResidencial,
        quadraResidencial,
        loteResidencial,
        complementoResidencial,
        bairroResidencial,
        cepResidencial,
        cidadeResidencial,
        estadoResidencial,
        tipoLogradouroCobranca,
        nomeLogradouroCobranca,
        numeroCobranca,
        quadraCobranca,
        loteCobranca,
        complementoCobranca,
        bairroCobranca,
        cepCobranca,
        cidadeCobranca,
        estadoCobranca,
        plano,
        enderecoCobrancaIgualResidencial,
        localCobranca,
        tipo,
        empresaAntiga,
        numContratoAntigo,
        dataContratoAntigo,
        diaVencimento,
        dataPrimeiraMensalidade,
        melhorHorario,
        melhorDia,
        is_enviado,
        dataVencimentoAtual,
        dataVencimento,
        status,
        unidadeId, '${logado._array[0].nome}' as "createBy" from titular where status = 1`
            );

            if (contrato._array[0] == null) {
                toast.show({
                    placement: "top",
                    render: () => {
                        return <ComponentToast title="Aviso!" message={"Nenhum contrato finalizado!"} />
                    }
                });
                setCarregamentoTela(false)

            }

            contrato._array.forEach(async item => {
                const dependentes = await executarSQL(`select * from dependente where titular_id = ${item.id}`);
                const contratoBody = new FormData();
                contratoBody.append("contrato", JSON.stringify(item));
                contratoBody.append("dependente", JSON.stringify(dependentes._array));

                const headers = {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${logado._array[0].token}`
                };

                const request = await api.post(`/api/venda/sincronismo`, contratoBody, { headers }
                ).catch((error) => {
                    if (error.response.status == 401) {
                        toast.show({
                            placement: "top",
                            render: () => {
                                return <ComponentToast title="Atenção!" message={"Token Expirado! Logue novamente"} />
                            }
                        });
                        setCarregamentoTela(false)

                    }

                });

                if (request.status == 201 && request.data.status == true) {
                    const anexoBody8 = new FormData();
                    const anexoBody1 = new FormData();
                    const anexoBody2 = new FormData();
                    const anexoBody3 = new FormData();
                    const anexoBody4 = new FormData();
                    const anexoBody5 = new FormData();
                    const anexoBody6 = new FormData();
                    const anexoBody7 = new FormData();

                    let contratoAnexo = await executarSQL(`select ${request.data.novoId} as id, anexo1,  anexo2 ,  anexo3, anexo4, anexo5, anexo6, anexo7, anexo8 from titular where id = ${request.data.id}`);

                    anexoBody8.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo8: contratoAnexo._array[0].anexo8 }))
                    anexoBody1.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo1: contratoAnexo._array[0].anexo1 }))

                    anexoBody2.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo2: contratoAnexo._array[0].anexo2 }))
                    anexoBody3.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo3: contratoAnexo._array[0].anexo3 }))
                    anexoBody4.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo4: contratoAnexo._array[0].anexo4 }))
                    anexoBody5.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo5: contratoAnexo._array[0].anexo5 }))
                    anexoBody6.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo6: contratoAnexo._array[0].anexo6 }))
                    anexoBody7.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo7: contratoAnexo._array[0].anexo7 }))
                    await api.post(`/api/venda/sincronismoanexo`, anexoBody8, { headers }).then(async () => {
                        await api.post(`/api/venda/sincronismoanexo`, anexoBody1, { headers }).then(async () => {
                            await api.post(`/api/venda/sincronismoanexo`, anexoBody2, { headers }).then(async () => {
                                await api.post(`/api/venda/sincronismoanexo`, anexoBody3, { headers }).then(async () => {
                                    await api.post(`/api/venda/sincronismoanexo`, anexoBody4, { headers }).then(async () => {
                                        await api.post(`/api/venda/sincronismoanexo`, anexoBody5, { headers }).then(async () => {
                                            await api.post(`/api/venda/sincronismoanexo`, anexoBody6, { headers }).then(async () => {
                                                await api.post(`/api/venda/sincronismoanexo`, anexoBody7, { headers }).then(async () => {
                                                    await executarSQL(`UPDATE titular SET status = 3 where id = ${request.data.id}`);
                                                }).catch((err) => {
                                                    alert(err)
                                                });
                                            }).catch((err) => {
                                                alert(err)
                                            });
                                        }).catch((err) => {
                                            alert(err)
                                        });
                                    }).catch((err) => {
                                        alert(err)
                                    });
                                }).catch((err) => {
                                    alert(err)
                                });
                            }).catch((err) => {
                                alert(err)
                            });
                        }).catch((err) => {
                            alert(err)
                        });
                    }).catch((err) => {
                        alert(err)
                    });
                    // await executarSQL(`
                    //     DELETE from dependente where titular_id = ${request.data.id}`
                    // );
                    // await executarSQL(`
                    //     DELETE from titular WHERE id = ${request.data.id}`
                    // );
                    toast.show({
                        placement: "top",
                        render: () => {
                            return <ComponentToast title="Sucesso!" message={"Contratos enviados com sucesso!"} />
                        }
                    });
                    setCarregamentoTela(false)

                } else {
                    toast.show({
                        placement: "top",
                        render: () => {
                            return <ComponentToast title="Falha!" message={"Não foi possivel enviar contrato! Revise as Vendas Concluidas"} />
                        }
                    });
                    setCarregamentoTela(false)
                }
            });
        } catch (e) {
            toast.show({
                placement: "top",
                render: () => {
                    return <ComponentToast message={`Não foi possivel enviar os contratos, contate o suporte: ${e.toString()}`} />
                }
            });
        }
    }

    const sincronizar = () => {
        Alert.alert(
            "Aviso.",
            "Deseja abrir 'Sincronizar todos os contratos'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        sincronismo()
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const finalizarSessao = async () => {
        Alert.alert(
            "Finalizar sessão!",
            "Deseja sair do aplicativo?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: async () => {
                        //await executarSQL(`delete from login`);
                        return navigation.navigate("Login");
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirNovoContrato = () => {
        Alert.alert(
            "Aviso.",
            "Deseja cadastrar um 'NOVO CONTRATO'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        return navigation.navigate("ContratoInicial", { pet: false })
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirAdicionalPAX = () => {
        Alert.alert(
            "Aviso.",
            "Deseja cadastrar um 'TERMO DE INCLUSÃO DE DEPENDENTE PAX'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        navigation.navigate("ContratoInicial", { pet: false, hum: true })
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirAdicionalPET = () => {
        Alert.alert(
            "Aviso.",
            "Deseja cadastrar um 'TERMO DE INCLUSÃO/EXCLUSÃO DE DEPENDENTE PET'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        navigation.navigate("ContratoInicial", { pet: true })
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirVendasPendentes = () => {
        Alert.alert(
            "Aviso.",
            "Deseja abrir 'VENDAS CONCLUIDAS E PENDENTES'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        navigation.navigate("VendasPendentes")
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirAlterarVencimento = () => {
        Alert.alert(
            "Aviso.",
            "Deseja iniciar 'Solicitação de Mudança de Data de Vencimento do Plano'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        navigation.navigate("ContratoInicial", { pet: false, hum: false, plano: true })
                    },
                },
            ],
            { cancelable: false }
        );
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => finalizarSessao()}>
                    <Text left="1" fontWeight="bold">Sair</Text>
                    <Center>
                        <Icon as={MaterialCommunityIcons} size="8" name="exit-to-app" color={colors.COLORS.PAXCOLOR_1} />
                    </Center>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={() => sincronizar()}>
                    <Text fontWeight="bold">Sincronizar</Text>
                    <Center>
                        <Icon as={MaterialCommunityIcons} size="8" name="cloud-sync-outline" color={colors.COLORS.PAXCOLOR_1} />
                    </Center>
                </TouchableOpacity>
            )
        });
    }, [navigation, MaterialCommunityIcons]);

    useEffect(() => {
        setup();
        getUsuario();
        setCarregamentoTela(true)

        BackHandler.addEventListener("hardwareBackPress", backAction);

        return () =>
            BackHandler.removeEventListener("hardwareBackPress", backAction);
    }, []);

    return (
        <ScrollView h="100%">
            {carregamentoTela ? (
                <ComponentLoading mensagem="Carregando informações" />
            ) : (
                <VStack space={1} mt="1" m="2">
                    <Container mt="2" w="100%" ml="3" >
                        <Heading mb="5">
                            <Text color={colors.COLORS.PAXCOLOR_1}>Pax Vendedor</Text>
                        </Heading>
                        <Text mt="2" fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1} fontWeight="bold">Bem Vindo(a): </Text><Text fontWeight="bold">{usuario}</Text>
                        </Text>
                        <Text mt="1" fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1} >'Novo Contrato'</Text> - Cadastrar novo contrato com seus dependente(s) e filial.
                        </Text>
                        <Text fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1} >'Inclusão ou Exclusão de Dependente Pax'</Text> - Cadastrar Termo de Inclusão ou Exclusão de Dependente PAX à um contrato existente. (Até 4 dependentes).
                        </Text>
                        <Text fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1} >'Inclusão ou Exclusão de Dependente PET'</Text> - Cadastrar Termo de Inclusão ou Exclusão de Adicional PET à um contrato existente no Plano Pax.
                        </Text>
                        <Text fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1}>'Planos'</Text> - Lista todos planos disponiveis em determinada filial escolhida.
                        </Text>
                        <Text fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1}>'Vendas Concluidas'</Text> - Lista vendas finalizadas e não sincronizadas.
                        </Text>
                        {/* <Text mt="1" fontWeight="medium" style={textCenter}>
                    <Text color={colors.COLORS.PAXCOLOR_1}>'Avisos'</Text> - Atualizações e Avisos sobre o sistema.
                </Text> */}
                        <Text fontWeight="medium" style={textCenter}>
                            <Text color={colors.COLORS.PAXCOLOR_1}>'Sincronizar'</Text> - Envia todos os contratos finalizados para o setor de Cadastro.
                        </Text>
                    </Container>
                    <Center mt="5" ml="5" mr="5">
                        <HStack space={2} justifyContent="center">
                            <Pressable onPress={abrirNovoContrato} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="file-check-outline" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Novo Contrato
                                    </Heading>
                                </Center>
                            </Pressable>
                            <Pressable onPress={() => navigation.navigate("Planos")} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="book-open-outline" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Planos
                                    </Heading>
                                </Center>
                            </Pressable>
                            <Pressable onPress={abrirVendasPendentes} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="file-clock-outline" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading textAlign="center" size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Vendas Concluídas
                                    </Heading>
                                </Center>
                            </Pressable>
                        </HStack>
                        <HStack mt="2" space={2} justifyContent="center">
                            <Pressable onPress={abrirAdicionalPET} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="paw" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading textAlign="center" size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Dependente PET
                                    </Heading>
                                </Center>
                            </Pressable>
                            <Pressable onPress={abrirAdicionalPAX} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="account" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading textAlign="center" size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Dependente PAX
                                    </Heading>
                                </Center>
                            </Pressable>
                            <Pressable onPress={abrirAlterarVencimento} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="calendar-refresh" color={colors.COLORS.PAXCOLOR_1} />
                                    <Center>
                                        <Heading textAlign="center" size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                            Data de Vencimento do Plano
                                        </Heading>
                                    </Center>
                                </Center>
                            </Pressable>
                        </HStack>
                        {/* <HStack mt="2" space={2} justifyContent="center">
                            <Pressable onPress={sincronizar} w="33%" bg="white" rounded="md" shadow={3}>
                                <Center h="40">
                                    <Icon as={MaterialCommunityIcons} size="20" name="reload" color={colors.COLORS.PAXCOLOR_1} />
                                    <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Sincronizar
                                    </Heading>
                                </Center>
                            </Pressable>
                        </HStack> */}
                        <HStack mt="2" space={2} justifyContent="center">

                        </HStack>
                        <VStack mt="5%" m="10">
                            {/* <HStack space={2} justifyContent="center">
                <Pressable onPress={() => navigation.navigate("avisos")} w="50%" bg="white" rounded="md" shadow={5}>    
                    <HStack space={3} justifyContent="center">  
                        <Icon as={MaterialCommunityIcons} size="10" name="alert" color={colors.COLORS.PAXCOLOR_1} />
                            <Center mr="3">
                            <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                Avisos
                            </Heading>                 
                            </Center>
                        {
                            avisos == 0 ? ''
                            : <Icon as={MaterialCommunityIcons} size="8" name="numeric-1-circle" color={colors.COLORS.PAXCOLOR_1} />
                        }
                        </HStack>
                </Pressable>  
                </HStack> */}
                        </VStack>
                    </Center>
                </VStack >)}
        </ScrollView>
    );
}
export { Home };
