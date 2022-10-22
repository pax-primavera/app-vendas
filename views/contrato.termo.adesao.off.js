import React, { useEffect, useState } from 'react';
import { Text, Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select, Radio, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus, containerFoto, styleButtonAdd, styleButtonTextAdd } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { tiposContratos } from '../utils/generic/data';
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
        [dataContratoAntigo, setDataContratoAntigo] = useState(null),
        [numContratoAntigo, setNumContratoAntigo] = useState(null);
    const [anexo4, setAnexo4] = useState(null);
    const [anexo5, setAnexo5] = useState(null);
    const [anexo6, setAnexo6] = useState(null);

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
            UPDATE titulares SET 
            ${column} = '${(stringObj)}'
            WHERE id = ${id}`
        );
    }

    const pickImage = async (tipo = 'camera', nuumeroAnexo = 1) => {
        try {
            let permissionResult = tipo == 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Aviso,", "Permissão de câmera é requerida!");
                return;
            }

            let pickerResult = tipo == 'camera'
                ? await ImagePicker.launchCameraAsync()
                : await ImagePicker.launchImageLibraryAsync();

            if (!pickerResult.cancelled) {
                if (nuumeroAnexo === 4) {
                    setAnexo4(pickerResult);
                }
                if (nuumeroAnexo === 5) {
                    setAnexo5(pickerResult);
                }
                if (nuumeroAnexo === 6) {
                    setAnexo6(pickerResult);
                }
            }
        } catch (e) {
            Alert.alert("Aviso", e.toString())
        }
    };

    const uploadImage = (numeroAnexo = 4) => {
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

         await executarListIDSQL(id).then((response) => {         
            setPlano(Number(response._array[0].plano));
            setDiaVencimento(String(response._array[0].diaVencimento) == 'null' ? null : String(response._array[0].diaVencimento));
            setDataPrimeiraMensalidade(response._array[0].dataPrimeiraMensalidade == 'null' ? null : response._array[0].dataPrimeiraMensalidade)
            setMelhorDia(Number(response._array[0].melhorDia) == 'null' ? null : String(response._array[0].melhorDia));
            setMelhorHorario(response._array[0].melhorHorario == 'null' ? null : response._array[0].melhorHorario);
            setLocalCobranca(Number(response._array[0].localCobranca));
            setTipo(Number(response._array[0].tipo) == '0' ? 0 : 1);
            setEmpresaAntiga(response._array[0].empresaAntiga == 'null' ? null : response._array[0].empresaAntiga)
            setNumContratoAntigo(response._array[0].numContratoAntigo == 'null' ? null : response._array[0].numContratoAntigo);
            //setDataContratoAntigo(response._array[0].dataContratoAntigo == 'null' ? null : response._array[0].dataContratoAntigo)
            setAnexo4(response._array[0].anexo4)
            setAnexo5(response._array[0].anexo5)
            setAnexo6(response._array[0].anexo6)
            setCarregamentoTela(false);
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
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

                        if (![0, 1].includes(tipo)) {
                            Alert.alert("Aviso.", "Tipo de contrato não selecionado!");
                            return;
                        }

                        if (!plano) {
                            Alert.alert("Aviso.", "Plano não selecionado!");
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

                        if (tipo === 1) {
                            if (!numContratoAntigo) {
                                Alert.alert("Aviso.", "Informe o número do contrato antigo!");
                                return;
                            }

                            if (!empresaAntiga) {
                                Alert.alert("Aviso.", "Informe o nome da empresa anterior aonde o cliente tinha vinculo!");
                                return;
                            }

                            if (!anexo4 || !anexo5 || !anexo6) {
                                Alert.alert("Aviso.", "Envie todos os anexos, está faltando arquivo(s)!");
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
                            numContratoAntigo = '${numContratoAntigo}',
                            dataContratoAntigo = '${dataContratoAntigo}'
                            WHERE id = ${id}`
                        );
                        return navigation.navigate("contratoContentDependentesOff", {
                            id: id,
                            anexos: [
                                tratamentoImagem(anexo4, 'anexo4'),
                                tratamentoImagem(anexo5, 'anexo5'),
                                tratamentoImagem(anexo6, 'anexo6')
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
                                                <Select.Item key={item['nome']} label={item['nome']} value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mb="1" space={2} justifyContent="center">
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
                                        <FormControl.Label>Data da Primeira Mensalidade</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Digite Data da Primeira Mensalidade:'
                                            value={dataPrimeiraMensalidade} onChangeText={(e) => setDataPrimeiraMensalidade(changeInput(e, 'dataPrimeiraMensalidade'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mb="1" space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Dia de Vencimento:</FormControl.Label>
                                        <Input placeholder='Melhor dia para cobrança:' value={diaVencimento} 
                                            isDisabled
                                            keyboardType='numeric'
                                            onChangeText={(e) => setMelhorDia(changeInput(e, 'melhorDia'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl >
                                        <FormControl.Label>Horário para Cobrança:</FormControl.Label>
                                        <Input keyboardType='numeric' placeholder='Melhor horário para cobrança:' value={melhorHorario}
                                            onChangeText={(e) => setMelhorHorario(changeInput(e, 'melhorHorario'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack mt="2" space={2} justifyContent="center">
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
                            <HStack mt="2" space={2} justifyContent="center">
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
                                                <FormControl.Label>Nome da Empresa:</FormControl.Label>
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
                                                isDisabled={anexo4}
                                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                _light={styleButtonAdd}
                                                _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(4)}
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
                                                isDisabled={anexo5}
                                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                 _light={styleButtonAdd}
                                                 _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(5)}
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
                                                isDisabled={anexo6}
                                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                                 _light={styleButtonAdd}
                                                 _text={styleButtonTextAdd}
                                                variant="outline"
                                                onPress={() => uploadImage(6)}
                                            >
                                                COMPROVANTE DA ANTEPENÚLTIMA PARCELA PAGA
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
                                onPress={()=>{PROSSEGUIR(data.id)}}
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
