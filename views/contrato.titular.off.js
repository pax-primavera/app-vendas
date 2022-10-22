import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, useToast, Button, FormControl, Input, Select, Switch, Text } from "native-base";
import { web, light, styleButtonText, styleButton, styleInputFocus } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { sexo, nacionalidade } from '../utils/generic/data';
import { useRoute } from '@react-navigation/native';
import axiosAuth from '../utils/config/axios/private.js';
import { cpfMask, dataMask, cepMask, foneMask, dataMaskEUA, isBoolean, validarCPF, validarEmail } from "../utils/generic/format";
import { fieldDatas, fieldCPF, fieldCEPS, fieldTelefones } from '../utils/generic/field.mask'
import { executarSQL } from '../services/database/index.js';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import { Alert } from 'react-native';
import { executarListIDSQL } from '../services/database/index';

function ContratoContentTitularOff({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Arrays
    const [estadosCivil, setEstadosCivil] = useState([]);
    const [religioes, setReligioes] = useState([]);
    /// Booleanos
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    /// Fields
    const [isCremado, setIsCremado] = useState(false),
        [nomeTitular, setNomeTitular] = useState(null),
        [cpfTitular, setCpfTitular] = useState(null),
        [rgTitular, setRGTitular] = useState(null),
        [dataNascTitular, setDataNascTitular] = useState(null),
        [estadoCivilTitular, setEstadoCivilTitular] = useState(null),
        [nacionalidadeTitular, setNacionalidadeTitular] = useState(null),
        [naturalidadeTitular, setNaturalidadeTitular] = useState(null),
        [religiaoTitular, setReligiaoTitular] = useState(null),
        [sexoTitular, setSexoTitular] = useState(null),
        [email1, setEmail1] = useState(null),
        [email2, setEmail2] = useState(null),
        [telefone1, setTelefone1] = useState(null),
        [telefone2, setTelefone2] = useState(null),
        [profissaoTitular, setProfissaoTitular] = useState(null);

    const changeInput = (labelValue, label) => {
        if (fieldCPF.includes(label)) return cpfMask(labelValue);
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        if (fieldCEPS.includes(label)) return cepMask(labelValue);
        if (fieldTelefones.includes(label)) return foneMask(labelValue);
        return labelValue;
    }
    const id = route.params.id;

    const setup = async () => {
        setCarregamentoTela(true);

        const urls = ['/lista-estado-civil', '/lista-religioes'];

        Promise.all(urls.map((endpoint) => axiosAuth.get(endpoint))).then((
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
                placement: "top",
                render: () => {
                    return <ComponentToast message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
                }
            });
        });
        await executarListIDSQL(id).then((response) => {
            setData(response._array[0])
            setIsCremado(response._array[0].isCremado == 1 ? true : false);
            setNomeTitular(response._array[0].nomeTitular);
            setCpfTitular(response._array[0].cpfTitular);
            setRGTitular(response._array[0].rgTitular);
            setDataNascTitular(response._array[0].dataNascTitular);
            setEstadoCivilTitular(Number(response._array[0].estadoCivilTitular));
            setNacionalidadeTitular(response._array[0].nacionalidadeTitular == '2' ? 2 : 1);
            setNaturalidadeTitular(response._array[0].naturalidadeTitular === 'null' ? null : response._array[0].naturalidadeTitular);
            setReligiaoTitular(Number(response._array[0].religiaoTitular));
            setSexoTitular(Number(response._array[0].sexoTitular));
            setEmail1(response._array[0].email1);
            setEmail2(response._array[0].email2 === 'null' ? null : response._array[0].email2);
            setTelefone1(response._array[0].telefone1);
            setTelefone2(response._array[0].telefone2 === 'null' ? null : response._array[0].telefone2);
            setProfissaoTitular(response._array[0].profissaoTitular === 'null' ? null : response._array[0].profissaoTitular);

            setCarregamentoTela(false);
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }

    const PROSSEGUIR = async (id) => {
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
                        if (dataMaskEUA(dataNascTitular) == 'Invalid date') {
                            Alert.alert("Aviso.", "Data de nascimento inválida!");
                            return;
                        }

                        if (!cpfTitular) {
                            Alert.alert("Aviso.", "CPF é obrigatório!!");
                            return;
                        }

                        if (!validarCPF(cpfTitular)) {
                            Alert.alert("Aviso.", "CPF inválido!");
                            return;
                        }

                        if (!rgTitular) {
                            Alert.alert("Aviso.", "RG é obrigatório!");
                            return;
                        }

                        if (!email1) {
                            Alert.alert("Aviso.", "Email é obrigatório!");
                            return;
                        }

                        if (!religiaoTitular) {
                            Alert.alert("Aviso.", "Religião é obrigatório!");
                            return;
                        }

                        if (!validarEmail(email1)) {
                            Alert.alert("Aviso.", "E-mail inválido!\n\nE-mails válidos:\nexemplo@exemplo.com\nexemplo@exemplo.com.br");
                            return;
                        }

                        if (!telefone1) {
                            Alert.alert("Aviso.", "Telefone é obrigatório!");
                            return;
                        }

                        if (!sexoTitular) {
                            Alert.alert("Aviso.", "Genêro não selecionado!");
                            return;
                        }

                        if (!profissaoTitular) {
                            Alert.alert("Aviso.", "Profissão é obrigatório!");
                            return;
                        }

                        await executarSQL(`
                            UPDATE titulares
                            SET isCremado = ${isBoolean(isCremado)},
                            nomeTitular = '${nomeTitular}',
                            cpfTitular = '${cpfTitular}',
                            rgTitular = '${rgTitular}',
                            dataNascTitular = '${dataNascTitular}',
                            sexoTitular = '${sexoTitular}',
                            estadoCivilTitular = '${estadoCivilTitular}',
                            nacionalidadeTitular = '${nacionalidadeTitular}',
                            naturalidadeTitular = '${naturalidadeTitular}',
                            religiaoTitular = '${religiaoTitular}',
                            email1 = '${email1}',
                            email2 = '${email2}',
                            telefone1 = '${telefone1}',
                            telefone2 = '${telefone2}',
                            profissaoTitular = '${profissaoTitular}'
                            WHERE id = ${id}`
                        );

                        return navigation.navigate("contratoContentEnderecoResidencialOff", { id: id,contratoID, unidadeID });
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
                    <VStack m="2">
                        <Box key="2" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                Titular
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <HStack space={2} justifyContent="center">
                                <Center w="100%" rounded="md">
                                    <FormControl isRequired >
                                        <FormControl.Label>Nome Completo:</FormControl.Label>
                                        <Input
                                            placeholder='Digite o nome completo:'
                                            value={nomeTitular}
                                            onChangeText={(e) => setNomeTitular(changeInput(e, 'nomeTitular').toUpperCase())}
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
                                            value={cpfTitular}
                                            onChangeText={(e) => setCpfTitular(changeInput(e, 'cpfTitular'))}
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
                                            value={rgTitular}
                                            onChangeText={(e) => setRGTitular(changeInput(e, 'rgTitular'))}
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
                                            value={dataNascTitular}
                                            onChangeText={(e) => setDataNascTitular(changeInput(e, 'dataNascTitular'))}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">
                                    <FormControl isRequired>
                                        <FormControl.Label>Estado Civil:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={estadoCivilTitular}
                                            onValueChange={(e) => setEstadoCivilTitular(changeInput(e, 'estadoCivilTitular'))}
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
                                            value={naturalidadeTitular}
                                            onChangeText={(e) => setNaturalidadeTitular(changeInput(e, 'naturalidadeTitular').toUpperCase())}
                                            _focus={styleInputFocus}
                                        />
                                    </FormControl>
                                </Center>
                                <Center w="50%" rounded="md">

                                    <FormControl>
                                        <FormControl.Label>Nacionalidade:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={nacionalidadeTitular}
                                            onValueChange={(e) => setNacionalidadeTitular(changeInput(e, 'nacionalidadeTitular'))}
                                            accessibilityLabel='Digite a Nacionalidade:'
                                            placeholder='Digite a Nacionalidade:'
                                        >
                                            {nacionalidade.map((item) => <Select.Item
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
                                        <FormControl.Label>Religião:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={religiaoTitular}
                                            onValueChange={(e) => setReligiaoTitular(changeInput(e, 'religiaoTitular'))}
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
                                        <FormControl.Label>Genêro:</FormControl.Label>
                                        <Select
                                            _focus={styleInputFocus}
                                            selectedValue={sexoTitular}
                                            onValueChange={(e) => setSexoTitular(changeInput(e, 'sexoTitular'))}
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
                                        <FormControl.Label>E-mail:</FormControl.Label>
                                        <Input
                                            autoCapitalize='none'
                                            placeholder='Digite um E-mail:'
                                            value={email1}
                                            onChangeText={(e) => setEmail1(changeInput(e, 'email1'))}
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
                                            value={telefone1}
                                            onChangeText={(e) => setTelefone1(changeInput(e, 'telefone1'))}
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
                                            value={email2}
                                            onChangeText={(e) => setEmail2(changeInput(e, 'email2'))}
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
                                            value={telefone2}
                                            onChangeText={(e) => setTelefone2(changeInput(e, 'telefone2'))}
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
                                            value={profissaoTitular}
                                            onChangeText={(e) => setProfissaoTitular(changeInput(e, 'profissaoTitular').toUpperCase())}
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

export { ContratoContentTitularOff }
