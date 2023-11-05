import React, { useEffect, useState } from 'react';
import { Text, Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select, Radio, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus, containerFoto, styleButtonAdd, styleButtonTextAdd } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { tiposContratos, tiposContratosPR, tiposContratosGO, locaisCobrancas, tiposContratosMT } from '../utils/generic/data';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { timeMask, dataMask, dataMaskEUA } from "../utils/generic/format";
import { fieldDatas, fieldTimes } from '../utils/generic/field.mask'
import { executarSQL, executarListIDSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";

function ContratoContentTermoAdesaoOff({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    const [data, setData] = useState([]);
    const id = route.params.id;
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Arrays
    const [planos, setPlanos] = useState([]);
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
        [dataContratoAntigo, setDataContratoAntigo] = useState(null),
        [numContratoAntigo, setNumContratoAntigo] = useState(null);
    const [anexo1, setAnexo1] = useState(null);
    const [anexo2, setAnexo2] = useState(null);
    const [anexo3, setAnexo3] = useState(null);
    const [anexo4, setAnexo4] = useState(null);
    const [tipos, setTipos] = useState([]);

    const tratamentoImagem = async (foto, column) => {
        if (!foto) return null;

        let fileExtension = foto.uri.substr(foto.uri.lastIndexOf(".") + 1);

        let nameArquivo = foto.uri.substr(
            foto.uri.lastIndexOf("ImagePicker/") + 12
        );

        var anexo = {
            type: `image/${fileExtension}`,
            uri: foto.uri,
            name: `anexo_${nameArquivo}`,
        }

        var stringObj = JSON.stringify(anexo);

        await executarSQL(`
            UPDATE titular SET 
            ${column} = '${(stringObj)}'
            WHERE id = ${id}`
        );
    }

    const pickImage = async (tipo = 'camera', numeroAnexo = 1) => {
        try {
            let permissionResult = tipo == 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Aviso,", "Permissão de câmera é requerida!");
                return;
            }

            let pickerResult = tipo == 'camera'
                ? await ImagePicker.launchCameraAsync({
                    base64: true,
                    allowsEditing: false,
                    aspect: [4, 3],
                })
                : await ImagePicker.launchImageLibraryAsync({
                    base64: true,
                    allowsEditing: false,
                    aspect: [4, 3],
                });

            if (!pickerResult.cancelled) {
                if (numeroAnexo === 1) {
                    setAnexo1(pickerResult.base64);
                }
                if (numeroAnexo === 2) {
                    setAnexo2(pickerResult.base64);
                }
                if (numeroAnexo === 3) {
                    setAnexo3(pickerResult.base64);
                }
                if (numeroAnexo === 4) {
                    setAnexo4(pickerResult.base64);
                }
            }
        } catch (e) {
            Alert.alert("Aviso", e.toString())
        }
    };

    const uploadImage = (numeroAnexo = 1) => {
        return Alert.alert(
            "Aviso.",
            "Para fazer upload de uma imagem, escolha uma opção:",
            [
                {
                    text: "CANCELAR",
                    style: "cancel",
                },
                {
                    text: "ABRIR CÂMERA",
                    onPress: async () => {
                        return await pickImage('camera', numeroAnexo);
                    }
                },
                {
                    text: "ABRIR GALERIA",
                    onPress: async () => {
                        return await pickImage('galeria', numeroAnexo);
                    }
                },
            ],
            { cancelable: false }
        );
    }

    const changeInput = (labelValue, label) => {
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        if (fieldTimes.includes(label)) return timeMask(labelValue);
        return labelValue;
    }


    const setup = async () => {
        setCarregamentoTela(true);
        executarSQL(`select id,descricao from plano where unidadeId = ${unidadeID}`).then((response) => {
            setPlanos(response._array)
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }

        executarSQL(`select regiao, uf from unidade where id = ${unidadeID}`).then((response) => {
            if (response._array[0].uf == 'MT') {
                setTipos(tiposContratosMT)
            } else if (response._array[0].uf == 'PR') {
                setTipos(tiposContratosPR)
            } else if (response._array[0].uf == 'MS' && response._array[0].regiao == 1) {
                setTipos(tiposContratosPR)
            } else if (response._array[0].uf == 'MS') {
                setTipos(tiposContratos)
            } else {
                setTipos(tiposContratosGO)
            }
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }

        await executarListIDSQL(id).then((response) => {
            setPlano(Number(response._array[0].plano));
            setDiaVencimento(String(response._array[0].diaVencimento) == 'null' ? null : String(response._array[0].diaVencimento));
            setDataPrimeiraMensalidade(response._array[0].dataPrimeiraMensalidade == 'null' ? null : response._array[0].dataPrimeiraMensalidade)
            setMelhorDia(Number(response._array[0].melhorDia) == 'null' ? null : String(response._array[0].melhorDia));
            setMelhorHorario(response._array[0].melhorHorario == 'null' ? null : response._array[0].melhorHorario);
            setLocalCobranca(response._array[0].localCobranca)
            setTipo(response._array[0].tipo)
            setEmpresaAntiga(response._array[0].empresaAntiga == 'null' ? null : response._array[0].empresaAntiga)
            setNumContratoAntigo(response._array[0].numContratoAntigo == 'null' ? null : response._array[0].numContratoAntigo);
            setDataContratoAntigo(response._array[0].dataContratoAntigo == 'null' ? null : response._array[0].dataContratoAntigo)
            setAnexo1(response._array[0].anexo4)
            setAnexo2(response._array[0].anexo5)
            setAnexo3(response._array[0].anexo6)
            setAnexo4(response._array[0].anexo7)
            setCarregamentoTela(false);
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
            setCarregamentoTela(false);
        }

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

                        var date = moment().add(1, 'month').endOf('month').format('DD-MM-YYYY')
                        if (dataMaskEUA(dataPrimeiraMensalidade) > dataMaskEUA(date)) {
                            Alert.alert("Aviso.", "Data Primeira mensalidade inválida!");
                            return;
                        }

                        if (!melhorHorario) {
                            Alert.alert("Aviso.", "Horário para cobrança é obrigatório!");
                            return;
                        }


                        if (!plano) {
                            Alert.alert("Aviso.", "Plano não selecionado!");
                            return;
                        }

                        const verificaPlano = await executarSQL(`select descricao from plano where id  = "${plano}" and unidadeId = ${unidadeID}`);

                        //faz o usuario selecionar o plano correto dependendo do tipo de contrato
                        const tipoContrato = tipo;
                        const result = tiposContratos.find(tipo => tipo.descricao === tipoContrato);
                        if (verificaPlano._array[0].descricao === "PLANO BASICO" && 3 && result.id == 1) {
                            Alert.alert("Aviso.", "Plano Basico não permitido para Contrato Novo!");
                            return;
                        } else if (verificaPlano._array[0].descricao === "PLANO BASICO" && result.id > 3) {
                            Alert.alert("Aviso.", "Ação não permitida! Selecione o plano correto.");
                            return;
                        }
                        if (verificaPlano._array[0].descricao === "PLANO SUPER LUXO" && result.id == 4) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        } else if (verificaPlano._array[0].descricao === "PLANO SUPER LUXO" && result.id == 5) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        } else if (verificaPlano._array[0].descricao === "PLANO SUPER LUXO" && result.id == 9) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        }
                        if (verificaPlano._array[0].descricao === "PLANO LUXO" && result.id == 6) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        } else if (verificaPlano._array[0].descricao === "PLANO LUXO" && result.id == 7) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        } else if (verificaPlano._array[0].descricao === "PLANO LUXO" && result.id == 8) {
                            Alert.alert("Aviso.", "Ação não permitida!  Selecione o plano correto.");
                            return;
                        }

                        if (dataMaskEUA(dataPrimeiraMensalidade) == "Invalid date") {
                            Alert.alert("Aviso.", "Data Primeira mensalidade inválida!");
                            return;
                        }

                        if (!dataPrimeiraMensalidade) {
                            Alert.alert("Aviso.", "Data primeira mensalidade é obrigatório!");
                            return;
                        }

                        if (!diaVencimento) {
                            Alert.alert("Aviso.", "Dia do Pagamento é obrigatório!");
                            return;
                        }

                        if (diaVencimento > 31 || diaVencimento < 1) {
                            Alert.alert(
                                "Aviso.",
                                "Dia de pagamento 'NÃO' pode ser 'MENOR' que 1 e 'MAIOR' que 31 dias!"
                            );
                            return;
                        }

                        if (!melhorHorario) {
                            Alert.alert(
                                "Aviso.",
                                "Horario da cobrança é obrigatório!"
                            );
                            return;
                        }

                        if (!diaVencimento) {
                            Alert.alert("Aviso.", "Dia de pagamento é obrigatório!");
                            return;
                        }

                        if (diaVencimento > 31) {
                            Alert.alert("Aviso.", "Dia de pagamento 'NÃO' pode ser superior a 31 dias!");
                            return;
                        }

                        if (localCobranca === undefined) {
                            Alert.alert("Aviso.", "Local de cobrança não selecionado!");
                            return;
                        }

                        if (tipo !== "Contrato Novo") {
                            if (!numContratoAntigo) {
                                Alert.alert("Aviso.", "Informe o número do contrato antigo!");
                                return;
                            }

                            if (!empresaAntiga) {
                                Alert.alert("Aviso.", "Informe o nome da empresa anterior aonde o cliente tinha vinculo!");
                                return;
                            }

                            if (!anexo1 || !anexo2 || !anexo3) {
                                Alert.alert("Aviso.", "Envie todos os anexos, está faltando arquivo(s)!");
                                return;
                            }
                        }

                        if (tipo == "Transferência de Titularidade (Com Obito)") {
                            if (!anexo4) {
                                Alert.alert("Aviso.", "A certidão/atestado de obito é obrigatório!");
                                return;
                            }
                        }

                        await executarSQL(`
                            UPDATE titular
                            SET dataPrimeiraMensalidade = '${dataPrimeiraMensalidade}',
                            tipo = '${tipo}',
                            plano = '${plano}',
                            diaVencimento = '${diaVencimento}',
                            melhorDia = ${diaVencimento},
                            melhorHorario = '${melhorHorario}',
                            localCobranca = '${localCobranca}',
                            empresaAntiga = '${empresaAntiga}',
                            numContratoAntigo = '${numContratoAntigo}',
                            dataContratoAntigo = '${dataContratoAntigo}',
                            anexo4 = '${anexo1}',
                            anexo5 = '${anexo2}',
                            anexo6 = '${anexo3}',
                            anexo7 = '${anexo4}'
                            WHERE id = ${id}`
                        );
                        return navigation.navigate("contratoContentDependentesOff", {
                            id: id,
                            anexos: [
                                anexo1, 'anexo4',
                                anexo2, 'anexo5',
                                anexo3, 'anexo6',
                                anexo4, 'anexo7',
                            ],
                            unidadeID,
                            contratoID
                        });
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
                        <Box key="1" safeArea w="100%" pl="5" pr="5" mb="1" pb="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                Termo de Adesão
                            </Heading>
                            <Heading mt="2" mb="2" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <HStack mb="1" space={1} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Planos:</FormControl.Label>
                                        <Select _focus={styleInputFocus} selectedValue={plano} onValueChange={(e) => setPlano(changeInput(e, 'plano'))}
                                            accessibilityLabel="Plano:"
                                            placeholder="Plano:"
                                        >
                                            {planos.map((item) =>
                                                <Select.Item
                                                    key={item.id}
                                                    label={item['descricao']}
                                                    value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mb="1" m="1" space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Dia de Pagamento:</FormControl.Label>
                                        <Input placeholder='Digite o dia de pagamento:' value={diaVencimento}
                                            keyboardType='numeric'
                                            onChangeText={(e) => setDiaVencimento(changeInput(e, 'diaVencimento'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Horário para Cobrança:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Melhor horário para cobrança:' value={melhorHorario}
                                            onChangeText={(e) => setMelhorHorario(changeInput(e, 'melhorHorario'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mb="1" space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Data da Primeira Mensalidade</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Digite Data da Primeira Mensalidade:'
                                            value={dataPrimeiraMensalidade} onChangeText={(e) => setDataPrimeiraMensalidade(changeInput(e, 'dataPrimeiraMensalidade'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mt="2" space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Local de Cobrança:</FormControl.Label>
                                        <Radio.Group
                                            defaultValue={localCobranca}
                                            onValueChange={(e) => {
                                                return setLocalCobranca(e);
                                            }}
                                            name="localCobranca"
                                        >
                                            {locaisCobrancas.map((item) =>
                                                <Radio
                                                    colorScheme="emerald"
                                                    key={item['nome_cobranca']}
                                                    value={item['nome_cobranca']}>
                                                    {item['nome_cobranca']}
                                                </Radio>
                                            )}
                                        </Radio.Group>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mt="2" space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Tipo de contrato:</FormControl.Label>
                                        <Radio.Group defaultValue={tipo} onChange={(e) => setTipo(changeInput(e, 'tipo'))}
                                            name="tipo"
                                        >
                                            {tipos.map((item) =>
                                                <Radio
                                                    colorScheme="emerald"
                                                    key={item['descricao']}
                                                    value={item['descricao']}>
                                                    {item['descricao']}</Radio>
                                            )}
                                        </Radio.Group>
                                    </FormControl>
                                </Center>
                            </HStack>
                            {tipo !== "Contrato Novo" ?
                                <><HStack space={2} justifyContent="center">
                                    <Center w="30%" rounded="md">
                                        <FormControl isRequired>
                                            <FormControl.Label>Número do contrato:</FormControl.Label>
                                            <Input placeholder='Número do contrato:'
                                                value={numContratoAntigo}
                                                type="numeric"
                                                onChangeText={(e) => setNumContratoAntigo(changeInput(e, 'numContratoAntigo'))}
                                                _focus={styleInputFocus} />
                                        </FormControl>
                                    </Center>
                                    <Center w="30%" rounded="md">
                                        <FormControl isRequired>
                                            <FormControl.Label>Data de Assinatura do Contrato Anterior:</FormControl.Label>
                                            <Input keyboardType='numeric'
                                                placeholder='Data de Assinatura do Contrato Anterior'
                                                value={dataContratoAntigo}
                                                onChangeText={(e) => setDataContratoAntigo(changeInput(e, 'dataContratoAntigo'))}
                                                _focus={styleInputFocus}
                                            />
                                        </FormControl>
                                    </Center>
                                    <Center w="40%" rounded="md">
                                        <FormControl isRequired>
                                            <FormControl.Label>Nome da Filial (Empresa):</FormControl.Label>
                                            <Input placeholder='Nome da Empresa:'
                                                value={empresaAntiga}
                                                onChangeText={(e) => setEmpresaAntiga(changeInput(e, 'empresaAntiga').toUpperCase())}
                                                _focus={styleInputFocus} />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                    <VStack mt="2">
                                        <VStack style={containerFoto}>
                                            <VStack pl="5" pr="5">
                                                <Text fontWeight="bold">Fotografe o comprovante de pagamento da 'ÚLTIMA' parcela do plano do cliente.</Text>
                                            </VStack>
                                            <Button size="lg"
                                                m="5"
                                                isDisabled={anexo1 != 'null' && anexo1 != null}
                                                leftIcon={<Icon as={Ionicons}
                                                    name="camera-sharp"
                                                    size="lg"
                                                    color={colors.COLORS.PAXCOLOR_1} />}
                                                _light={styleButtonAdd}
                                                _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(1)}
                                            >
                                                COMPROVANTE DA ÚLTIMA PARCELA PAGA
                                            </Button>
                                        </VStack>
                                        <VStack style={containerFoto}>
                                            <VStack pl="5" pr="5">
                                                <Text fontWeight="bold">Fotografe o comprovante de pagamento da 'PENÚLTIMA' parcela do plano do cliente.</Text>
                                            </VStack>
                                            <Button size="lg"
                                                m="5"
                                                isDisabled={anexo2 != 'null' && anexo2 != null}
                                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                _light={styleButtonAdd}
                                                _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(2)}
                                            >
                                                COMPROVANTE DA PENÚLTIMA PARCELA PAGA
                                            </Button>
                                        </VStack>
                                        <VStack style={containerFoto}>
                                            <VStack pl="5" pr="5">
                                                <Text fontWeight="bold">Fotografe o comprovante de pagamento da 'ANTEPENÚLTIMA' parcela do plano do cliente.</Text>
                                            </VStack>
                                            <Button size="lg"
                                                m="5"
                                                isDisabled={anexo3 != 'null' && anexo3 != null}
                                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                _light={styleButtonAdd}
                                                _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(3)}
                                            >
                                                COMPROVANTE DA ANTEPENÚLTIMA PARCELA PAGA
                                            </Button>
                                        </VStack>
                                    </VStack></>
                                : <></>
                            }
                            {
                                tipo === "Transferência de Titularidade (Com Obito)" ?
                                    <>
                                        <VStack mt="2">
                                            <VStack style={containerFoto}>
                                                <VStack pl="5" pr="5">
                                                    <Text fontWeight="bold">Fotografe a CERTIDÃO / ATESTADO DE OBITO DO TITULAR</Text>
                                                </VStack>
                                                <Button size="lg"
                                                    m="5"
                                                    isDisabled={anexo4 != 'null' && anexo4 != null}
                                                    leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                    _light={styleButtonAdd}
                                                    _text={styleButtonTextAdd}
                                                    variant="outline"
                                                    onPress={() => uploadImage(4)}
                                                >
                                                    CERTIDÃO / ATESTADO DE OBITO DO TITULAR
                                                </Button>
                                            </VStack>
                                        </VStack></>
                                    : <></>
                            }
                            <Button
                                mt="6"
                                mb="4"
                                size="lg"
                                _text={styleButtonText}
                                _light={styleButton}
                                onPress={() => { PROSSEGUIR(data.id) }}
                            >
                                PROSSEGUIR
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentTermoAdesaoOff }
