import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Input, Select, Switch, Text } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { cepMask, isBoolean } from "../utils/generic/format";
import { fieldCEPS } from '../utils/generic/field.mask'
import { executarSQL } from '../services/database/index.js';
import ComponentToast from '../components/views/toast/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';

function ContratoContentEnderecoResidencial({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Arrays
    const [logradouros, setLogradouros] = useState([]);
    /// Booleanos
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
        [estadoResidencial, setEstadoResidencial] = useState(null),
        [tipoLogradouroCobranca, setTipoLogradouroCobranca] = useState(null),
        [nomeLogradouroCobranca, setNomeLogradouroCobranca] = useState(null),
        [numeroCobranca, setNumeroCobranca] = useState(null),
        [quadraCobranca, setQuadraCobranca] = useState(null),
        [loteCobranca, setLoteCobranca] = useState(null),
        [complementoCobranca, setComplementoCobranca] = useState(null),
        [bairroCobranca, setBairroCobranca] = useState(null),
        [cepCobranca, setCepCobranca] = useState(null),
        [cidadeCobranca, setCidadeCobranca] = useState(null),
        [estadoCobranca, setEstadoCobranca] = useState(null),
        [enderecoCobrancaIgualResidencial, setEnderecoCobrancaIgualResidencial] = useState(null);

    const changeInput = (labelValue, label) => {
        if (fieldCEPS.includes(label)) return cepMask(labelValue);
        return labelValue;
    }

    const setup = async () => {
        setCarregamentoTela(true);

        const urls = ['/lista-logradouros'];

        Promise.all(urls.map((endpoint) => axiosAuth.get(endpoint))).then((
            [
                { data: logradouros }
            ]
        ) => {
            if (logradouros && logradouros.logradouros.length > 0) {
                setLogradouros(logradouros.logradouros);
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

                        await executarSQL(`
                            UPDATE titulares
                            SET tipoLogradouroResidencial = '${tipoLogradouroResidencial}',
                            nomeLogradouroResidencial = '${nomeLogradouroResidencial}',
                            numeroResidencial = '${numeroResidencial}',
                            quadraResidencial = '${quadraResidencial}',
                            loteResidencial = '${loteResidencial}',
                            complementoResidencial = '${complementoResidencial}',
                            bairroResidencial = '${bairroResidencial}',
                            cepResidencial = '${cepResidencial}',
                            cidadeResidencial = '${cidadeResidencial}',
                            estadoResidencial = '${estadoResidencial}',
                            tipoLogradouroCobranca = '${tipoLogradouroCobranca}',
                            nomeLogradouroCobranca = '${nomeLogradouroCobranca}',
                            numeroCobranca = '${numeroCobranca}',
                            quadraCobranca = '${quadraCobranca}',
                            loteCobranca = '${loteCobranca}',
                            complementoCobranca = '${complementoCobranca}',
                            bairroCobranca = '${bairroCobranca}',
                            cepCobranca = '${cepCobranca}',
                            cidadeCobranca = '${cidadeCobranca}',
                            estadoCobranca = '${estadoCobranca}',
                            enderecoCobrancaIgualResidencial = ${isBoolean(enderecoCobrancaIgualResidencial)}
                            WHERE id = ${contratoID}`
                        );

                        return navigation.navigate("contratoContentTermoAdesao", { contratoID, unidadeID });
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
                                    <FormControl>
                                        <FormControl.Label>Logradouro:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={tipoLogradouroResidencial}
                                            onValueChange={(e) => setTipoLogradouroResidencial(changeInput(e, 'tipoLogradouroResidencial'))}
                                            accessibilityLabel="Selecione um logradouro:"
                                            placeholder="Selecione um logradouro:"
                                        >
                                            {logradouros.map((item) => <Select.Item
                                                key={item['nome_logradouro']}
                                                label={item['nome_logradouro']}
                                                value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Rua:</FormControl.Label>
                                        <Input
                                            placeholder='Informe o nome da rua:'
                                            value={nomeLogradouroResidencial}
                                            onChangeText={(e) => setNomeLogradouroResidencial(changeInput(e, 'nomeLogradouroResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
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
                                            placeholder='Digite um número de telefone:'
                                            value={quadraResidencial}

                                            onChangeText={(e) => setQuadraResidencial(changeInput(e, 'quadraResidencial'))}
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
                                            onChangeText={(e) => setLoteResidencial(changeInput(e, 'loteResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Complemento:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o Complemento da residencia:'
                                            value={complementoResidencial}
                                            onChangeText={(e) => setComplementoResidencial(changeInput(e, 'complementoResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Bairro:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o bairro da residencia:'
                                            value={bairroResidencial}
                                            onChangeText={(e) => setBairroResidencial(changeInput(e, 'bairroResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
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
                                    <FormControl>
                                        <FormControl.Label>Cidade:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o nome da cidade:'
                                            value={cidadeResidencial}
                                            onChangeText={(e) => setCidadeResidencial(changeInput(e, 'cidadeResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Estado:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o estado:'
                                            value={estadoResidencial}
                                            onChangeText={(e) => setEstadoResidencial(changeInput(e, 'estadoResidencial'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={1} alignItems="center" mt="4" mb="2">
                                <Switch
                                    size="lg"
                                    value={enderecoCobrancaIgualResidencial}
                                    colorScheme="emerald"
                                    onValueChange={(e) => setEnderecoCobrancaIgualResidencial(e)}
                                />
                                <Text>Endereço de cobrança será o mesmo do residencial?</Text>
                            </HStack>
                            {
                                !enderecoCobrancaIgualResidencial ?
                                    <>
                                        <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                                            <Text fontWeight="bold">Endereço para Cobrança:</Text> informe todas as informações corretamente!
                                        </Heading>
                                        <HStack space={2} justifyContent="center">
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Logradouro:</FormControl.Label>
                                                    <Select
                                                        _focus={styleInputFocus}
                                                        selectedValue={tipoLogradouroCobranca}
                                                        onValueChange={(e) => setTipoLogradouroCobranca(changeInput(e, 'tipoLogradouroCobranca'))}
                                                        accessibilityLabel="Selecione um logradouro:"
                                                        placeholder="Selecione um logradouro:"
                                                    >
                                                        {logradouros.map((item) => <Select.Item
                                                            key={item['nome_logradouro']}
                                                            label={item['nome_logradouro']}
                                                            value={item.id} />
                                                        )}
                                                    </Select>
                                                </FormControl>
                                            </Center>
                                            <Center w="50%" rounded="md">
                                                <FormControl >
                                                    <FormControl.Label>Rua:</FormControl.Label>
                                                    <Input
                                                        placeholder='Informe o nome da rua:'
                                                        value={nomeLogradouroCobranca}
                                                        onChangeText={(e) => setNomeLogradouroCobranca(changeInput(e, 'nomeLogradouroCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                        </HStack>
                                        <HStack space={2} justifyContent="center">
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Número:</FormControl.Label>
                                                    <Input
                                                        keyboardType='numeric'
                                                        placeholder='Digite o número da residencia:'
                                                        value={numeroCobranca}
                                                        onChangeText={(e) => setNumeroCobranca(changeInput(e, 'numeroCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Quadra:</FormControl.Label>
                                                    <Input
                                                        placeholder='Digite um número de telefone:'
                                                        value={quadraCobranca}
                                                        onChangeText={(e) => setQuadraCobranca(changeInput(e, 'quadraCobranca'))}
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
                                                        value={loteCobranca}
                                                        onChangeText={(e) => setLoteCobranca(changeInput(e, 'loteCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Complemento:</FormControl.Label>
                                                    <Input
                                                        placeholder='Digite o Complemento da residencia:'
                                                        value={complementoCobranca}
                                                        onChangeText={(e) => setComplementoCobranca(changeInput(e, 'complementoCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                        </HStack>
                                        <HStack space={2} justifyContent="center">
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Bairro:</FormControl.Label>
                                                    <Input
                                                        placeholder='Digite o bairro da residencia:'
                                                        value={bairroCobranca}
                                                        onChangeText={(e) => setBairroCobranca(changeInput(e, 'bairroCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>CEP:</FormControl.Label>
                                                    <Input
                                                        keyboardType='numeric'
                                                        placeholder='Digite o CEP da residencia:'
                                                        value={cepCobranca}
                                                        onChangeText={(e) => setCepCobranca(changeInput(e, 'cepCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                        </HStack>
                                        <HStack space={2} justifyContent="center">
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Cidade:</FormControl.Label>
                                                    <Input
                                                        placeholder='Digite o nome da cidade:'
                                                        value={cidadeCobranca}
                                                        onChangeText={(e) => setCidadeCobranca(changeInput(e, 'cidadeCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                            <Center w="50%" rounded="md">
                                                <FormControl>
                                                    <FormControl.Label>Estado:</FormControl.Label>
                                                    <Input
                                                        placeholder='Digite o estado:'
                                                        value={estadoCobranca}
                                                        onChangeText={(e) => setEstadoCobranca(changeInput(e, 'estadoCobranca'))}
                                                        _focus={styleInputFocus}
                                                    />
                                                </FormControl>
                                            </Center>
                                        </HStack>
                                    </>
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

export { ContratoContentEnderecoResidencial }
