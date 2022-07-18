import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Radio, Text, Switch } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { executarSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';
import { isBoolean } from '../utils/generic/format';

function ContratoContentFinalizar({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Parametros
    const { contratoID, unidadeID, anexos } = route.params;
    const [templateID, setTemplateID] = useState(null);
    /// Arrays
    const [templates, setTemplates] = useState([]);
    /// Booleanos
    const [isAceitoTermo, setisAceitoTermo] = useState(false);
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    /// Fields
    const [sendByWhatsApp, setSendByWhatsApp] = useState(false), [envioToken, setEnvioToken] = useState(false);

    const trimObject = (data) => {
        for (var property in data) {
            if (typeof data[property] === 'string') {
                data[property] = data[property].trim();
            }
        }
        return data;
    }

    const finalizarContrato = async () => {
        setCarregamentoButton(true);

        try {
            if (!templateID) {
                Alert.alert("Aviso.", "Selecione um template!");
                return;
            }

            const contrato = await executarSQL(`select * from titulares where id = '${contratoID}'`);

            if (!contrato) {
                Alert.alert("Aviso.", "Contrato não localizado!");
                return;
            }

            const dependentesHumanos = await executarSQL(`
                select 
                nome,
                dataNascimento,
                parentesco,
                cpf_dependente,
                cremacao  
                from dependentes 
                where titular_id = '${contratoID}'
                and is_pet = 0
          `);

            const dependentesPets = await executarSQL(`
                select 
                nome,
                especie,
                porte,
                resgate,
                dataNascimento,
                raca,
                altura,
                peso,
                cor
                from dependentes 
                where titular_id = '${contratoID}'
                and is_pet = 1
          `);

            const contratoTratado = trimObject(contrato._array[0]);

            const contratoCliente = {
                ...contratoTratado,
                dependentesPets: dependentesPets._array,
                dependentes: dependentesHumanos._array
            }

            const contratoBody = new FormData();

            contratoBody.append("anexos[]", anexos[0]);
            contratoBody.append("anexos[]", anexos[1]);
            contratoBody.append("anexos[]", anexos[2]);
            contratoBody.append("body", JSON.stringify(contratoCliente));

            const request = await axiosAuth.post(`/cadastro-contrato/unidade-id=${unidadeID}/templeate-id=${templateID}`,
                contratoBody,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            if (request.data && request.data.assinatura) {
                toast.show({
                    placement: "top",
                    render: () => {
                        return <ComponentToast title="Realizado!" message={"Contrato enviado com sucesso!"} />
                    }
                });

                return navigation.navigate("contratoContentAssinatura", request.data.assinatura);
            }

            toast.show({
                placement: "top",
                render: () => {
                    return <ComponentToast title="Falha!" message={"Não foi possivel enviar contrato!"} />
                }
            });

            setCarregamentoButton(false);

        } catch (e) {
            setCarregamentoButton(false);

            if (e.response && e.response.data && e.response.data.error) {
                toast.show({
                    placement: "top",
                    render: () => {
                        return <ComponentToast message={e.response.data.error} />
                    }
                });
                return;
            }

            toast.show({
                placement: "top",
                render: () => {
                    return <ComponentToast message={`Não foi possivel enviar contrato, contate o suporte: ${e.toString()}`} />
                }
            });
        }
    }

    const isEnvioToken = (e) => {
        return e ? 2 : 1
    }

    const finalizar = async () => {
        Alert.alert(
            "Aviso.",
            "Deseja PROSSEGUIR para proxima 'ETAPA'? Verifique os dados só por garantia!",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: async () => {
                        await executarSQL(`
                            UPDATE titulares
                            SET envioToken = ${isEnvioToken(envioToken)},
                            sendByWhatsApp = ${isBoolean(sendByWhatsApp)}
                            WHERE id = ${contratoID} `
                        );

                        finalizarContrato()
                    }
                },
            ],
            { cancelable: false }
        );
    }

    const setup = async () => {
        setCarregamentoTela(true);

        const urls = [`lista-templates/unidade-id=${unidadeID}`];

        Promise.all(urls.map((endpoint) => axiosAuth.get(endpoint))).then((
            [
                { data: templates }
            ]
        ) => {
            if (templates && templates.templates.length > 0) {
                setTemplates(templates.templates);
            }
            setCarregamentoTela(false);
        }).catch((e) => {
            toast.show({
                placement: "top",
                render: () => {
                    return <ComponentToast message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()} `} />
                }
            });
        });
    }

    useEffect(() => {
        setup();
    }, []);

    return (
        <ScrollView h="100%">
            {
                carregamentoTela
                    ?
                    <ComponentLoading mensagem="Carregando informações" />
                    :
                    <VStack m="2">
                        <Box key="1" safeArea w="100%" pl="5" pr="5" mb="2" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                Informações Finais
                            </Heading>
                            <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Selecione um template:</FormControl.Label>
                                        <Radio.Group
                                            isDisabled={carregamentoButton}
                                            defaultValue={templateID}
                                            onChange={(e) => setTemplateID(e)}
                                            name="templateID"
                                        >
                                            {templates.map((item) => <Radio
                                                colorScheme="emerald"
                                                key={item['nome']}
                                                value={item.id}>{item['nome']}</Radio>
                                            )}
                                        </Radio.Group>
                                    </FormControl>
                                </Center>
                            </HStack>
                        </Box>
                        <Box key="2" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Center w="100%" rounded="md">
                                <FormControl>
                                    <FormControl.Label>Selecione as opções:</FormControl.Label>
                                    <HStack alignItems="center">
                                        <Switch
                                            size="lg"
                                            value={sendByWhatsApp}
                                            colorScheme="emerald"
                                            onValueChange={(e) => setSendByWhatsApp(e)}
                                        />
                                        <Text> Enviar contrato por WhatsApp?</Text>
                                    </HStack>
                                    <HStack alignItems="center">
                                        <Switch
                                            size="lg"
                                            value={envioToken}
                                            colorScheme="emerald"
                                            onValueChange={(e) => setEnvioToken(e)}
                                        />
                                        <Text> Token por WhatsApp?</Text>
                                    </HStack>
                                    <HStack alignItems="center">
                                        <Switch
                                            size="lg"
                                            value={isAceitoTermo}
                                            colorScheme="emerald"
                                            onValueChange={(e) => setisAceitoTermo(e)}
                                        />
                                        <Text> Cliente concorda e aceita os termos?</Text>
                                    </HStack>
                                </FormControl>
                            </Center>
                            <Button
                                mt="6"
                                mb="2"
                                size="lg"
                                _text={styleButtonText}
                                isDisabled={!isAceitoTermo}
                                isLoading={carregamentoButton}
                                isLoadingText="Enviando"
                                _light={styleButton}
                                onPress={finalizar}
                            >
                                FINALIZAR
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentFinalizar }
