import React, { useState, useEffect } from 'react';

import { executarSQL } from '../services/index.js';

import {
    Center,
    Box,
    VStack,
    FormControl,
    Input,
    Heading,
    HStack,
    Select,
    ScrollView,
    Switch,
    Text
} from "native-base";

function Contrato() {

    const [estadosCivil, setEstadosCivil] = useState([]);
    const [religioes, setReligioes] = useState([]);
    const [logradouros, setLogradouros] = useState([]);
    const [locaisCobrancas, setLocaisCobrancas] = useState([]);
    const [unidades, setUnidades] = useState([]);

    const sexo = [
        {
            id: 1,
            nome: 'Masculino'
        },
        {
            id: 2,
            nome: 'Feminino'
        }
    ];

    const setup = async () => {
        const estadosCivilGet = await executarSQL(`select * from selects where tipo = 1`);

        if (estadosCivilGet._array && estadosCivilGet._array.length > 0) {
            setEstadosCivil(estadosCivilGet._array);
        }

        const religioesGet = await executarSQL(`select * from selects where tipo = 2`);

        if (religioesGet._array && religioesGet._array.length > 0) {
            setReligioes(religioesGet._array);
        }

        const logradourosGet = await executarSQL(`select * from selects where tipo = 3`);

        if (logradourosGet._array && logradourosGet._array.length > 0) {
            setLogradouros(logradourosGet._array);
        }

        const locaisCobrancasGet = await executarSQL(`select * from selects where tipo = 4`);

        if (locaisCobrancasGet._array && locaisCobrancasGet._array.length > 0) {
            setLocaisCobrancas(locaisCobrancasGet._array);
        }

        const unidadesGet = await executarSQL(`select * from selects where tipo = 5`);

        if (unidadesGet._array && unidadesGet._array.length > 0) {
            setUnidades(unidadesGet._array);
        }
    }

    useEffect(() => {
        setup();
    }, []);

    return (
        <ScrollView h="100%">
            <VStack m="2">
                <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={{
                    backgroundColor: "gray.50"
                }}
                    _web={{
                        shadow: 2,
                        borderWidth: 0
                    }} >

                    {/* Titular */}
                    <Center w="100%">
                        <Box safeArea w="100%" pl="10" pr="10" mb="1" >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Titular
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>

                            <VStack space={3} mt="4">
                                <HStack space={1} alignItems="center">
                                    <Switch size="lg" colorScheme="emerald" />
                                    <Text>Adicional cremação</Text>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="100%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Nome Completo:</FormControl.Label>
                                            <Input keyboardType='numeric' placeholder='Digite o nome completo:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>CPF:</FormControl.Label>
                                            <Input keyboardType='numeric' placeholder='Digite o CPF:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>RG:</FormControl.Label>
                                            <Input keyboardType='numeric' placeholder='Digite o RG' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Data Nascimento:</FormControl.Label>
                                            <Input placeholder='Digite a data de nascimento:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Estado Civil:</FormControl.Label>
                                            <Select accessibilityLabel="Estado Civil:" placeholder="Estado Civil:">
                                                {estadosCivil.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Nacionalidade:</FormControl.Label>
                                            <Input placeholder='Digite a nacionalidade do titular:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Naturalidade:</FormControl.Label>
                                            <Input placeholder='Digite a naturalidade do titular:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Religião:</FormControl.Label>
                                            <Select accessibilityLabel="Religião:" placeholder="Selecione uma religião:">
                                                {religioes.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Sexo:</FormControl.Label>
                                            <Select accessibilityLabel="Sexo:" placeholder="Selecione um Sexo:">
                                                {sexo.map((item) => <Select.Item key={item.id} label={item.nome} value={item.id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Email:</FormControl.Label>
                                            <Input placeholder='Digite um Email:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Telefone:</FormControl.Label>
                                            <Input keyboardType='numeric' placeholder='Digite um telefone' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="100%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Profissão:</FormControl.Label>
                                            <Input placeholder='Informe a profissão do titular:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>

                        <Box safeArea w="100%" pl="10" pr="10" mb="1"  >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Endereço Residencial
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <VStack space={3} mt="4">
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Logradouro:</FormControl.Label>
                                            <Select accessibilityLabel="Logradouro:" placeholder="Selecione um logradouro:">
                                                {logradouros.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Rua:</FormControl.Label>
                                            <Input placeholder='Nome da rua' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Número:</FormControl.Label>
                                            <Input placeholder='Digite o número da residencia:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Quadra:</FormControl.Label>
                                            <Input placeholder='Digite o número da quadra:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Lote:</FormControl.Label>
                                            <Input placeholder='Digite o lote:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Complemento:</FormControl.Label>
                                            <Input placeholder='Complemento residencial:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Bairro:</FormControl.Label>
                                            <Input placeholder='Digite o nome do Bairro:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Cep:</FormControl.Label>
                                            <Input placeholder='Digite o CEP:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Cidade:</FormControl.Label>
                                            <Input placeholder='Digite o nome da cidade:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Estado:</FormControl.Label>
                                            <Input placeholder='Digite o estado:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>

                        <Box safeArea w="100%" pl="10" pr="10" mb="1"  >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Endereço Cobrança
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <VStack space={3} mt="4">
                                <HStack space={2} alignItems="center">
                                    <Switch size="lg" colorScheme="emerald" />
                                    <Text>Endereço de cobrança será o mesmo do residencial.</Text>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Logradouro:</FormControl.Label>
                                            <Select accessibilityLabel="Logradouro:" placeholder="Selecione um logradouro:">
                                                {logradouros.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Rua:</FormControl.Label>
                                            <Input placeholder='Nome da rua' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Número:</FormControl.Label>
                                            <Input placeholder='Digite o número da residencia:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Quadra:</FormControl.Label>
                                            <Input placeholder='Digite o número da quadra:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Lote:</FormControl.Label>
                                            <Input placeholder='Digite o lote:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Complemento:</FormControl.Label>
                                            <Input placeholder='Complemento residencial:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Bairro:</FormControl.Label>
                                            <Input placeholder='Digite o nome do Bairro:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Cep:</FormControl.Label>
                                            <Input placeholder='Digite o CEP:' />
                                        </FormControl>
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Cidade:</FormControl.Label>
                                            <Input placeholder='Digite o nome da cidade:' />
                                        </FormControl>
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Estado:</FormControl.Label>
                                            <Input placeholder='Digite o estado:' />
                                        </FormControl>
                                    </Center>
                                </HStack>

                                <HStack space={2} justifyContent="center">
                                    <Center w="100%" rounded="md">
                                        <FormControl isInvalid >
                                            <FormControl.Label>Local de Cobrança:</FormControl.Label>
                                            <Select accessibilityLabel="Local de cobrança:" placeholder="Selecione um local de cobrança:">
                                                {locaisCobrancas.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                                            </Select>
                                        </FormControl>
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>

                    </Center>
                </Box>
            </VStack >
        </ScrollView>
    );
}



export { Contrato };