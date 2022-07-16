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
    /// Fields
    const [plano, setPlano] = useState(null),
        [diaVencimento, setDiaVencimento] = useState(null),
        [dataPrimeiraMensalidade, setDataPrimeiraMensalidade] = useState(null),
        [melhorDia, setMelhorDia] = useState(null),
        [melhorHorario, setMelhorHorario] = useState(null),
        [localCobranca, setLocalCobranca] = useState(null),
        [tipo, setTipo] = useState(null),
        [empresaAntiga, setEmpresaAntiga] = useState(null),
        [numContratoAntigo, setNumContratoAntigo] = useState(null);

    const changeInput = (labelValue, label) => {
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        if (fieldTimes.includes(label)) return timeMask(labelValue);
        return labelValue;
    }

    const setup = async () => {
        setCarregamentoTela(true);

        const urls = [`lista-planos/unidade-id=${unidadeID}`, `/lista-locais-cobranca`];

        Promise.all(urls.map((endpoint) => axiosAuth.get(endpoint))).then((
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
                placement: "top",
                render: () => {
                    return <ComponentToast message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
                }
            });
        });
    }

    const PROSSEGUIR = async () => {
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
                        if (dataMaskEUA(dataPrimeiraMensalidade) == 'Invalid date') {
                            Alert.alert("Aviso.", "Data Primeira mensalidade inválida!");
                            return;
                        }

                        if (!dataPrimeiraMensalidade) {
                            Alert.alert("Aviso.", "Data primeira mensalidade é obrigatório!");
                            return;
                        }

                        if (dataMaskEUA(dataPrimeiraMensalidade) < dataMaskEUA(new Date())) {
                            Alert.alert("Aviso.", "Data Primeira mensalidade inválida, não pode ser menor que a data atual!");
                            return;
                        }

                        if (![0, 1].includes(tipo)) {
                            Alert.alert("Aviso.", "Tipo de contrato não selecionado!");
                            return;
                        }

                        if (!plano) {
                            Alert.alert("Aviso.", "Plano não selecionado!");
                            return;
                        }

                        if (!diaVencimento) {
                            Alert.alert("Aviso.", "Dia de vencimento é obrigatório!");
                            return;
                        }

                        if (localCobranca === undefined) {
                            Alert.alert("Aviso.", "Local de cobrança não selecionado!");
                            return;
                        }

                        if (tipo === 1) {
                            if (!numContratoAntigo) {
                                Alert.alert("Aviso.", "Informe o número do contrato antigo!");
                                return;
                            }

                            if (!empresaAntiga) {
                                Alert.alert("Aviso.", "Informe o nome da empresa anterior aonde o cliente tinha vinculo!");
                                return;
                            }
                        }

                        await executarSQL(`
                            UPDATE titulares
                            SET dataPrimeiraMensalidade = '${dataPrimeiraMensalidade}',
                            tipo = ${tipo},
                            plano = ${plano},
                            diaVencimento = '${diaVencimento}',
                            melhorDia = '${melhorDia}',
                            melhorHorario = '${melhorHorario}',
                            localCobranca = '${localCobranca}',
                            empresaAntiga = '${empresaAntiga}',
                            numContratoAntigo = '${numContratoAntigo}'
                            WHERE id = ${contratoID}`
                        );
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
                    <VStack m="2">
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
                                        <Select _focus={styleInputFocus} selectedValue={plano} onValueChange={(e) => setPlano(changeInput(e, 'plano'))}
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
                                        <Input placeholder='Digite o dia de vencimento:' value={diaVencimento} keyboardType='numeric'
                                            onChangeText={(e) => setDiaVencimento(changeInput(e, 'diaVencimento'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Data Mensalidade:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Digite Data da Primeira Mensalidade:'
                                            value={dataPrimeiraMensalidade} onChangeText={(e) => setDataPrimeiraMensalidade(changeInput(e, 'dataPrimeiraMensalidade'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Dia para cobrança:</FormControl.Label>
                                        <Input placeholder='Melhor dia para cobrança:' value={melhorDia} keyboardType='numeric'
                                            onChangeText={(e) => setMelhorDia(changeInput(e, 'melhorDia'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Horário para cobrança:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Melhor horário para cobrança:' value={melhorHorario}
                                            onChangeText={(e) => setMelhorHorario(changeInput(e, 'melhorHorario'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Local de Cobrança:</FormControl.Label>
                                        <Radio.Group defaultValue={localCobranca} onChange={(e) => setLocalCobranca(changeInput(e, 'localCobranca'))}
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
                                        <Radio.Group defaultValue={tipo} onChange={(e) => setTipo(changeInput(e, 'tipo'))}
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
                                tipo === 1 ?
                                    <HStack space={2} justifyContent="center">
                                        <Center w="50%" rounded="md">
                                            <FormControl isRequired>
                                                <FormControl.Label>Número do contrato:</FormControl.Label>
                                                <Input placeholder='Número do contrato:'
                                                    value={numContratoAntigo}
                                                    onChangeText={(e) => setNumContratoAntigo(changeInput(e, 'numContratoAntigo'))}
                                                    _focus={styleInputFocus}
                                                />
                                            </FormControl>
                                        </Center>
                                        <Center w="50%" rounded="md">
                                            <FormControl>
                                                <FormControl.Label>Nome da Empresa:</FormControl.Label>
                                                <Input placeholder='Nome da Empresa:'
                                                    value={empresaAntiga}
                                                    onChangeText={(e) => setEmpresaAntiga(changeInput(e, 'empresaAntiga'))}
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
                                onPress={PROSSEGUIR}
                            >
                                PROSSEGUIR
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentTermoAdesao }
