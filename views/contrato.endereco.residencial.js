import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Input, Select } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { cepMask } from "../utils/generic/format";
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
    /// Objects
    const [contrato, setContrato] = useState(
        {
            tipoLogradouroResidencial: null,
            nomeLogradouroResidencial: null,
            numeroResidencial: null,
            quadraResidencial: null,
            loteResidencial: null,
            complementoResidencial: null,
            bairroResidencial: null,
            cepResidencial: null,
            cidadeResidencial: null,
            estadoResidencial: null
        }
    );

    const treatment = (label, labelValue) => {
        if (fieldCEPS.includes(label)) return cepMask(labelValue);
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
            '/lista-logradouros'
        ].map((endpoint) => axiosAuth.get(endpoint))).then((
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
                        return navigation.navigate("contratoContentEnderecoCobranca", { contratoID, unidadeID });
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
                                Endereço - Residencial
                            </Heading>
                            <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Logradouro:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={contrato.tipoLogradouroResidencial}
                                            onValueChange={async (e) => await changeInput(e, 'tipoLogradouroResidencial')}
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
                                    <FormControl isRequired >
                                        <FormControl.Label>Rua:</FormControl.Label>
                                        <Input
                                            placeholder='Informe o nome da rua:'
                                            value={contrato.nomeLogradouroResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'nomeLogradouroResidencial')}
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
                                            value={contrato.numeroResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'numeroResidencial')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Quadra:</FormControl.Label>
                                        <Input
                                            placeholder='Digite um número de telefone:'
                                            value={contrato.quadraResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'quadraResidencial')}
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
                                            value={contrato.loteResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'loteResidencial')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Complemento:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o Complemento da residencia:'
                                            value={contrato.complementoResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'complementoResidencial')}
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
                                            value={contrato.bairroResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'bairroResidencial')}
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
                                            value={contrato.cepResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'cepResidencial')}
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
                                            value={contrato.cidadeResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'cidadeResidencial')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Estado:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o estado:'
                                            value={contrato.estadoResidencial}
                                            onChangeText={async (e) => await changeInput(e, 'estadoResidencial')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <Button
                                mt="6"
                                mb="4"
                                size="lg"
                                _text={styleButtonText}
                                _light={styleButton}
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

export { ContratoContentEnderecoResidencial }
