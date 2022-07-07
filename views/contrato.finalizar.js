import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Radio, Checkbox } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { executarSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';

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
    /// Objects
    const [contrato, setContrato] = useState(
        {
            sendByWhatsApp: null,
            envioToken: null
        }
    );

    const changeInput = async (value, column) => {
        setContrato(prev => {
            return {
                ...prev,
                [column]: value
            }
        })

        if (value != null) {
            await executarSQL(`
                UPDATE titulares
                SET ${column} = '${value}'
                WHERE id = ${contratoID}`
            );
        };
    }

    const finalizarContrato = async () => {
        setCarregamentoButton(true);

        try {
            if (!templateID) {
                return toast.show({
                    placement: "bottom",
                    render: () => {
                        return <ComponentToast title="ATENÇÃO!" message="Selecione um template!" />
                    }
                });
            }

            const contrato = await executarSQL(`select * from titulares where id = '${contratoID}'`);

            if (!contrato) {
                return toast.show({
                    placement: "bottom",
                    render: () => {
                        return <ComponentToast title="ATENÇÃO!" message="Contrato não localizado!" />
                    }
                });
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

            const contratoCliente = {
                ...contrato._array[0],
                dependentesPets: dependentesPets._array,
                dependentes: dependentesHumanos._array
            }

            let contratoBody = new FormData();

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
                    placement: "bottom",
                    render: () => {
                        return <ComponentToast title="Realizado!" message={"Contrato enviado com sucesso!"} />
                    }
                });

                return navigation.navigate("contratoContentAssinatura", request.data.assinatura);
            }

            toast.show({
                placement: "bottom",
                render: () => {
                    return <ComponentToast title="Falha!" message={"Não foi possivel enviar contrato!"} />
                }
            });

            setCarregamentoButton(false);

        } catch (e) {
            setCarregamentoButton(false);

            if (e.response && e.response.data && e.response.data.error) {
                toast.show({
                    placement: "bottom",
                    render: () => {
                        return <ComponentToast title="ATENÇÃO!" message={e.response.data.error} />
                    }
                });
                return;
            }

            toast.show({
                placement: "bottom",
                render: () => {
                    return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel enviar contrato, contate o suporte: ${e.toString()}`} />
                }
            });
        }
    }

    const setup = async () => {
        setCarregamentoTela(true);

        Promise.all([
            `lista-templates/unidade-id=${unidadeID}`
        ].map((endpoint) => axiosAuth.get(endpoint))).then((
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
                placement: "bottom",
                render: () => {
                    return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
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
                    <VStack m="1">
                        <Box key="2" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                Finalização Contrato
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
                            <Center w="100%" rounded="md" mt="2">
                                <FormControl>
                                    <FormControl.Label>Selecione as opções:</FormControl.Label>
                                    <HStack>
                                        <Checkbox
                                            isDisabled={carregamentoButton}
                                            colorScheme="emerald"
                                            value={contrato.sendByWhatsApp}
                                            onChange={async (e) => await changeInput(e, 'sendByWhatsApp')}
                                            key="sendByWhatsApp"
                                        >
                                            Enviar contrato por WhatsApp?
                                        </Checkbox>
                                    </HStack>
                                    <HStack>
                                        <Checkbox
                                            isDisabled={carregamentoButton}
                                            colorScheme="emerald"
                                            value={contrato.envioToken}
                                            onChange={async (e) => await changeInput(e, 'envioToken')}
                                            key="envioToken"
                                        >
                                            Token por WhatsApp?
                                        </Checkbox>
                                    </HStack>
                                    <HStack>
                                        <Checkbox
                                            isDisabled={carregamentoButton}
                                            colorScheme="emerald"
                                            value={isAceitoTermo}
                                            onChange={setisAceitoTermo}
                                            key="isAceitoTermo"
                                        >
                                            Cliente concorda e aceita os termos?
                                        </Checkbox>
                                    </HStack>
                                </FormControl>
                            </Center>

                            <Button
                                mt="6"
                                mb="4"
                                size="lg"
                                _text={styleButtonText}
                                isDisabled={!isAceitoTermo}
                                isLoading={carregamentoButton}
                                _light={styleButton}
                                onPress={finalizarContrato}
                            >
                                Finalizar
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentFinalizar }
