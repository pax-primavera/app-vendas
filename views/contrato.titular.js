import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Input, Select, Switch, Text } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { sexo } from '../utils/generic/data';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { cpfMask, dataMask, cepMask, foneMask, dataMaskEUA } from "../utils/generic/format";
import { fieldDatas, fieldCPF, fieldCEPS, fieldTelefones } from '../utils/generic/field.mask'
import { executarSQL } from '../services/database/index.js';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import { Alert } from 'react-native';

function ContratoContentTitular({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Arrays
    const [estadosCivil, setEstadosCivil] = useState([]);
    const [religioes, setReligioes] = useState([]);
    /// Booleanos
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    /// Objects
    const [contrato, setContrato] = useState(
        {
            isCremado: null,
            nomeTitular: null,
            cpfTitular: null,
            rgTitular: null,
            dataNascTitular: null,
            estadoCivilTitular: null,
            naturalidadeTitular: null,
            nacionalidadeTitular: null,
            religiaoTitular: null,
            sexoTitular: null,
            email1: null,
            email2: null,
            telefone1: null,
            telefone2: null,
            profissaoTitular: null
        }
    );

    const treatment = (label, labelValue) => {
        if (fieldCPF.includes(label)) return cpfMask(labelValue);
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        if (fieldCEPS.includes(label)) return cepMask(labelValue);
        if (fieldTelefones.includes(label)) return foneMask(labelValue);
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

        if (fieldDatas.includes(column)) {
            value = dataMaskEUA(value);
        }

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
            '/lista-estado-civil',
            '/lista-religioes'
        ].map((endpoint) => axiosAuth.get(endpoint))).then((
            [
                { data: estadoCivil },
                { data: religioes }
            ]
        ) => {
            if (estadoCivil && estadoCivil.estadoCivil.length > 0) {
                setEstadosCivil(estadoCivil.estadoCivil)
            };
            if (religioes && religioes.religioes.length > 0) {
                setReligioes(religioes.religioes);
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

                        if (contrato && new Date(contrato.dataNascTitular) == 'Invalid Date') {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="Data de nascimento inválida!" />
                                }
                            });
                        }

                        if (contrato.cpfTitular != null && contrato.cpfTitular.length < 14) {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="CPF inválido!" />
                                }
                            });
                        }

                        if (!unidadeID ||
                            !contrato.cpfTitular ||
                            !contrato.email1 ||
                            !contrato.telefone1 ||
                            !contrato.rgTitular ||
                            !contrato.sexoTitular ||
                            !contrato.profissaoTitular
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

                        return navigation.navigate("contratoContentEnderecoResidencial", { contratoID, unidadeID });
                    },
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
                                Titular
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <HStack space={1} alignItems="center">
                                <Switch
                                    size="lg"
                                    value={contrato.isCremado}
                                    colorScheme="emerald"
                                    onValueChange={async (e) => await changeInput(e, 'isCremado')}
                                />
                                <Text>Adicional cremação?</Text>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Nome Completo:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o nome completo:'
                                            value={contrato.nomeTitular}
                                            onChangeText={async (e) => await changeInput(e, 'nomeTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>CPF:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite o CPF:'
                                            value={contrato.cpfTitular}
                                            onChangeText={async (e) => await changeInput(e, 'cpfTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>RG:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite o RG:'
                                            value={contrato.rgTitular}
                                            onChangeText={async (e) => await changeInput(e, 'rgTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Data de Nascimento:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite a data de nascimento:'
                                            value={contrato.dataNascTitular}
                                            onChangeText={async (e) => await changeInput(e, 'dataNascTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Estado Civil:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={contrato.estadoCivilTitular}
                                            onValueChange={async (e) => await changeInput(e, 'estadoCivilTitular')}
                                            accessibilityLabel="Estado Civil:"
                                            placeholder="Estado Civil:"
                                        >
                                            {estadosCivil.map((item) => <Select.Item
                                                key={item['nome_estado_civil']}
                                                label={item['nome_estado_civil']}
                                                value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Naturalidade:</FormControl.Label>
                                        <Input
                                            placeholder='Digite a Naturalidade:'
                                            value={contrato.naturalidadeTitular}
                                            onChangeText={async (e) => await changeInput(e, 'naturalidadeTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Nacionalidade:</FormControl.Label>
                                        <Input
                                            placeholder='Digite a Nacionalidade:'
                                            value={contrato.nacionalidadeTitular}
                                            onChangeText={async (e) => await changeInput(e, 'nacionalidadeTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Religião:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={contrato.religiaoTitular}
                                            onValueChange={async (e) => await changeInput(e, 'religiaoTitular')}
                                            accessibilityLabel="Selecione uma religião:"
                                            placeholder="Selecione uma religião:"
                                        >
                                            {religioes.map((item) => <Select.Item
                                                key={item['nome_religião']}
                                                label={item['nome_religião']}
                                                value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Sexo:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={contrato.sexoTitular}
                                            onValueChange={async (e) => await changeInput(e, 'sexoTitular')}
                                            accessibilityLabel="Selecione um gênero:"
                                            placeholder="Selecione um gênero:"
                                        >
                                            {sexo.map((item) => <Select.Item
                                                key={item['descricao']}
                                                label={item['descricao']}
                                                value={item.id} />
                                            )}
                                        </Select>
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Email:</FormControl.Label>
                                        <Input
                                            placeholder='Digite um Email:'
                                            value={contrato.email1}
                                            onChangeText={async (e) => await changeInput(e, 'email1')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Telefone:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite um número de telefone:'
                                            value={contrato.telefone1}
                                            onChangeText={async (e) => await changeInput(e, 'telefone1')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Email Secundário:</FormControl.Label>
                                        <Input
                                            placeholder='Digite um Email:'
                                            value={contrato.email2}
                                            onChangeText={async (e) => await changeInput(e, 'email2')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl>
                                        <FormControl.Label>Telefone Secundário:</FormControl.Label>
                                        <Input
                                            keyboardType='numeric'
                                            placeholder='Digite um número de telefone:'
                                            value={contrato.telefone2}
                                            onChangeText={async (e) => await changeInput(e, 'telefone2')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Profissão:</FormControl.Label>
                                        <Input
                                            placeholder='Informe a profissão do titular:'
                                            value={contrato.profissaoTitular}
                                            onChangeText={async (e) => await changeInput(e, 'profissaoTitular')}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                            </HStack>
                            <Button
                                mt="6"
                                mb="4"
                                size="lg"
                                isLoading={carregamentoButton}
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

export { ContratoContentTitular }
