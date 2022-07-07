import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select, Radio } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { tiposContratos } from '../utils/generic/data';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { timeMask, dataMask, dataMaskEUA } from "../utils/generic/format";
import { fieldDatas, fieldTimes } from '../utils/generic/field.mask'
import { executarSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';

function ContratoContentTermoAdesao({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Arrays
    const [planos, setPlanos] = useState([]);
    const [locaisCobrancas, setLocaisCobrancas] = useState([]);
    /// Booleanos
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    /// Objects
    const [contrato, setContrato] = useState(
        {
            plano: null,
            diaVencimento: null,
            dataPrimeiraMensalidade: null,
            melhorDia: null,
            melhorHorario: null,
            localCobranca: null,
            tipo: null,
            empresaAntiga: null,
            numContratoAntigo: null
        }
    );

    const treatment = (label, labelValue) => {
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        if (fieldTimes.includes(label)) return timeMask(labelValue);
        return labelValue;
    }

    const changeInput = async (value, column) => {
        let valueInput = treatment(column, value);

        setContrato(prev => {
            return {
                ...prev,
                [column]: valueInput
            }
        })

        if (value != null) {
            await executarSQL(`
                UPDATE titulares
                SET ${column} = '${valueInput}'
                WHERE id = ${contratoID}`
            );
        };
    }

    const setup = async () => {
        setCarregamentoTela(true);

        Promise.all([
            `lista-planos/unidade-id=${unidadeID}`,
            `/lista-locais-cobranca`
        ].map((endpoint) => axiosAuth.get(endpoint))).then((
            [
                { data: planos },
                { data: locaisCobranca }
            ]
        ) => {
            if (planos && planos.planos.length > 0) {
                setPlanos(planos.planos);
            }
            if (locaisCobranca && locaisCobranca.locaisCobranca.length > 0) {
                setLocaisCobrancas(locaisCobranca.locaisCobranca);
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

    const proximoPasso = () => {
        Alert.alert(
            "ATENÇÃO!",
            "Deseja Prosseguir para proxima 'ETAPA'? Verifique os dados só por garantia!",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: () => {
                        setCarregamentoButton(true);

                        if (contrato && new Date(contrato.dataPrimeiraMensalidade) == 'Invalid Date') {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="Data Primeira mensalidade inválida!" />
                                }
                            });
                        }

                        if (dataMaskEUA(contrato.dataPrimeiraMensalidade) < dataMaskEUA(new Date())) {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="Data Primeira mensalidade inválida, não pode ser menor que a data atual!" />
                                }
                            });
                        }

                        if (!contrato.plano ||
                            !contrato.diaVencimento ||
                            !contrato.dataPrimeiraMensalidade ||
                            !contrato.localCobranca
                        ) {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="Preencha todos os campos obrigatórios para prosseguir!" />
                                }
                            });
                        }

                        setCarregamentoButton(false);

                        return navigation.navigate("contratoContentDependentes", { contratoID, unidadeID });
                    }
                },
            ],
            { cancelable: false }
        );
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
                                Termo de Adesão
                            </Heading>
                            <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>

                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Planos:</FormControl.Label>
                                        <Select _focus={styleInputFocus} selectedValue={contrato.plano} onValueChange={async (e) => await
                                            changeInput(e, 'plano')}
                                            accessibilityLabel="Plano:"
                                            placeholder="Plano:"
                                        >
                                            {planos.map((item) =>
                                                <Select.Item key={item['nome']} label={item['nome']} value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Dia Vencimento:</FormControl.Label>
                                        <Input placeholder='Digite o dia de vencimento:' value={contrato.diaVencimento} keyboardType='numeric'
                                            onChangeText={async (e) => await changeInput(e, 'diaVencimento')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Data Mensalidade:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Digite Data da Primeira Mensalidade:'
                                            value={contrato.dataPrimeiraMensalidade} onChangeText={async (e) => await changeInput(e, 'dataPrimeiraMensalidade')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Dia para cobrança:</FormControl.Label>
                                        <Input placeholder='Melhor dia para cobrança:' value={contrato.melhorDia} keyboardType='numeric'
                                            onChangeText={async (e) => await changeInput(e, 'melhorDia')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Horário para cobrança:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Melhor horário para cobrança:' value={contrato.melhorHorario}
                                            onChangeText={async (e) => await changeInput(e, 'melhorHorario')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Local de Cobrança:</FormControl.Label>
                                        <Radio.Group defaultValue={contrato.localCobranca} onChange={async (e) => await changeInput(e, 'localCobranca')}
                                            name="localCobranca"
                                        >
                                            {locaisCobrancas.map((item) => <Radio colorScheme="emerald" key={item.id}
                                                value={item.id}>{item['nome_cobranca']}</Radio>
                                            )}
                                        </Radio.Group>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Tipo de contrato:</FormControl.Label>
                                        <Radio.Group defaultValue={contrato.tipo} onChange={async (e) => await changeInput(e, 'tipo')}
                                            name="tipo"
                                        >
                                            {tiposContratos.map((item) => <Radio colorScheme="emerald" key={item['descricao']} value={item.id}>
                                                {item['descricao']}</Radio>
                                            )}
                                        </Radio.Group>
                                    </FormControl>
                                </Center>
                            </HStack>
                            {
                                contrato && contrato.tipo === 1 ?
                                    <HStack space={2} justifyContent="center">
                                        <Center w="50%" rounded="md">
                                            <FormControl isRequired>
                                                <FormControl.Label>Número do contrato:</FormControl.Label>
                                                <Input placeholder='Número do contrato:' value={contrato.numContratoAntigo} onChangeText={async (e) =>
                                                    await changeInput(e, 'numContratoAntigo')}
                                                    _focus={styleInputFocus}
                                                />
                                            </FormControl>
                                        </Center>
                                        <Center w="50%" rounded="md">
                                            <FormControl>
                                                <FormControl.Label>Nome da Empresa:</FormControl.Label>
                                                <Input placeholder='Nome da Empresa:' value={contrato.empresaAntiga} onChangeText={async (e) => await
                                                    changeInput(e, 'empresaAntiga')}
                                                    _focus={styleInputFocus}
                                                />
                                            </FormControl>
                                        </Center>
                                    </HStack>
                                    : <></>
                            }
                            <Button
                                mt="6"
                                mb="4"
                                size="lg"
                                _text={styleButtonText}
                                _light={styleButton}
                                isLoading={carregamentoButton}
                                onPress={proximoPasso}
                            >
                                Prosseguir
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentTermoAdesao }
