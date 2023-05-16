import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Input, Select, Switch, Text, Radio } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { cepMask, isBoolean } from "../utils/generic/format";
import { fieldCEPS } from '../utils/generic/field.mask'
import { executarSQL, executarListIDSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';
import { logradouros, estados } from "../utils/generic/data";

function ContratoContentEnderecoAdicionalPET({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID, id } = route.params;
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    /// Fields
    const
        [tipoLogradouroResidencial, setTipoLogradouroResidencial] = useState(null),
        [nomeLogradouroResidencial, setNomeLogradouroResidencial] = useState(null),
        [numeroResidencial, setNumeroResidencial] = useState(null),
        [quadraResidencial, setQuadraResidencial] = useState(null),
        [loteResidencial, setLoteResidencial] = useState(null),
        [complementoResidencial, setComplementoResidencial] = useState(null),
        [bairroResidencial, setBairroResidencial] = useState(null),
        [cepResidencial, setCepResidencial] = useState(null),
        [cidadeResidencial, setCidadeResidencial] = useState(null),
        [estadoResidencial, setEstadoResidencial] = useState(null);

    const changeInput = (labelValue, label) => {
        if (fieldCEPS.includes(label))
            return cepMask(labelValue);
        return labelValue;
    }

    const setup = async () => {
        setCarregamentoTela(true);
        if (id == null) {
            setCarregamentoTela(false);
        } else {
            await executarListIDSQL(id).then((response) => {
                //ENDEREÇO RESIDENCIAL
                setTipoLogradouroResidencial(response._array[0].tipoLogradouroResidencial);
                setNomeLogradouroResidencial(response._array[0].nomeLogradouroResidencial == 'null' ? null : response._array[0].nomeLogradouroResidencial);
                setNumeroResidencial(response._array[0].numeroResidencial == 'null' ? null : response._array[0].numeroResidencial);
                setQuadraResidencial(response._array[0].quadraResidencial == 'null' ? null : response._array[0].quadraResidencial);
                setLoteResidencial(response._array[0].loteResidencial == 'null' ? null : response._array[0].loteResidencial);
                setComplementoResidencial(response._array[0].complementoResidencial == 'null' ? null : response._array[0].complementoResidencial);
                setBairroResidencial(response._array[0].bairroResidencial == 'null' ? null : response._array[0].bairroResidencial);
                setCepResidencial(response._array[0].cepResidencial == 'null' ? null : response._array[0].cepResidencial);
                setCidadeResidencial(response._array[0].cidadeResidencial == 'null' ? null : response._array[0].cidadeResidencial);
                setEstadoResidencial(response._array[0].estadoResidencial);
                setCarregamentoTela(false);
            }), () => {
                Alert.alert('Erro ao executar SQL', sqlError.toString());
                setCarregamentoTela(false);
            }
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

                        if (!tipoLogradouroResidencial) {
                            Alert.alert("Aviso.", "Logradouro é obrigatório!");
                            return;
                        }

                        if (!nomeLogradouroResidencial) {
                            Alert.alert("Aviso.", "Rua da residência é obrigatório!");
                            return;
                        }

                        if (!cepResidencial) {
                            Alert.alert("Aviso.", "CEP da residência é obrigatório!");
                            return;
                        }

                        if (!complementoResidencial) {
                            Alert.alert("Aviso.", "Complemento da residência é obrigatório!");
                            return;
                        }

                        if (!numeroResidencial) {
                            Alert.alert("Aviso.", "Número residencial é obrigatório!");
                            return;
                        }

                        if (!bairroResidencial) {
                            Alert.alert("Aviso.", "Bairro da residencial é obrigatório!");
                            return;
                        }

                        if (!cidadeResidencial) {
                            Alert.alert("Aviso.", "Cidade é obrigatório!");
                            return;
                        }

                        if (!estadoResidencial) {
                            Alert.alert("Aviso.", "Estado é obrigatório!");
                            return;
                        }

                        if (id != null) {
                            await executarSQL(`
                            UPDATE titular
                            SET tipoLogradouroResidencial = '${tipoLogradouroResidencial}',
                            nomeLogradouroResidencial = '${nomeLogradouroResidencial}',
                            numeroResidencial = '${numeroResidencial}',
                            quadraResidencial = '${quadraResidencial}',
                            loteResidencial = '${loteResidencial}',
                            complementoResidencial = '${complementoResidencial}',
                            bairroResidencial = '${bairroResidencial}',
                            cepResidencial = '${cepResidencial}',
                            cidadeResidencial = '${cidadeResidencial}',
                            estadoResidencial = '${estadoResidencial}'
                            WHERE id = ${id}`
                            );
                        } else {
                            await executarSQL(`
                            UPDATE titular
                            SET tipoLogradouroResidencial = '${tipoLogradouroResidencial}',
                            nomeLogradouroResidencial = '${nomeLogradouroResidencial}',
                            numeroResidencial = '${numeroResidencial}',
                            quadraResidencial = '${quadraResidencial}',
                            loteResidencial = '${loteResidencial}',
                            complementoResidencial = '${complementoResidencial}',
                            bairroResidencial = '${bairroResidencial}',
                            cepResidencial = '${cepResidencial}',
                            cidadeResidencial = '${cidadeResidencial}',
                            estadoResidencial = '${estadoResidencial}'
                            WHERE id = ${contratoID}`
                            );
                        }
                        return navigation.navigate("contratoContentFinalizarAdicional", { id: id, contratoID, unidadeID });
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
                        <Box key="1" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                Endereço
                            </Heading>
                            <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                                <Text fontWeight="bold">Endereço Residencial:</Text> informe todas as informações corretamente!
                            </Heading>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Logradouro:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={tipoLogradouroResidencial}
                                            onValueChange={(e) => {
                                                return setTipoLogradouroResidencial(e);
                                            }}
                                            accessibilityLabel="Selecione um logradouro:"
                                            placeholder="Selecione um logradouro:"
                                        >
                                            {logradouros.map((item) => <Select.Item
                                                key={item.id}
                                                label={item["nome_logradouro"].toUpperCase()}
                                                value={item["nome_logradouro"]} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Rua:</FormControl.Label>
                                        <Input
                                            placeholder='Informe o nome da rua:'
                                            value={nomeLogradouroResidencial}
                                            onChangeText={(e) => setNomeLogradouroResidencial(changeInput(e, 'nomeLogradouroResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Número:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite o número da residencia:'
                                            value={numeroResidencial}
                                            onChangeText={(e) => setNumeroResidencial(changeInput(e, 'numeroResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Quadra:</FormControl.Label>
                                        <Input
                                            placeholder='Digite a quadra:'
                                            value={quadraResidencial}

                                            onChangeText={(e) => setQuadraResidencial(changeInput(e, 'quadraResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Lote:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o lote da residencia:'
                                            value={loteResidencial}
                                            onChangeText={(e) => setLoteResidencial(changeInput(e, 'loteResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Complemento:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o Complemento da residencia:'
                                            value={complementoResidencial}
                                            onChangeText={(e) => setComplementoResidencial(changeInput(e, 'complementoResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Bairro:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o bairro da residencia:'
                                            value={bairroResidencial}
                                            onChangeText={(e) => setBairroResidencial(changeInput(e, 'bairroResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>CEP:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite o CEP da residencia:'
                                            value={cepResidencial}
                                            onChangeText={(e) => setCepResidencial(changeInput(e, 'cepResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Cidade:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o nome da cidade:'
                                            value={cidadeResidencial}
                                            onChangeText={(e) => setCidadeResidencial(changeInput(e, 'cidadeResidencial').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Estado:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={estadoResidencial}
                                            onValueChange={(e) => {
                                                return setEstadoResidencial(e);
                                            }}
                                            accessibilityLabel="Selecione um estado:"
                                            placeholder="Selecione um estado:"
                                        >
                                            {estados.map((item) => <Select.Item
                                                key={item.id}
                                                label={item["estado"].toUpperCase()}
                                                value={item["estado"]} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
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

export { ContratoContentEnderecoAdicionalPET }
