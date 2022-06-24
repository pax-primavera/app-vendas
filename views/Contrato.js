import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView } from "native-base";
import { insertIdSQL } from '../services/database/index.js';
import { useToast } from "native-base";
import { executarSQL } from '../services/database/index.js';
import ComponentInput from '../components/form/Input';
import ComponentSelect from '../components/form/Select';
import ComponentSwitch from '../components/form/Switch';
import { sexo } from '../utils/generic/data';

function Contrato({ navigation }) {
    const toast = useToast();
    const [contratoID, setContratoID] = useState(null);
    const [table, setTable] = useState('titulares');
    const [estadosCivil, setEstadosCivil] = useState([]);
    const [religioes, setReligioes] = useState([]);
    const [logradouros, setLogradouros] = useState([]);
    const [locaisCobrancas, setLocaisCobrancas] = useState([]);
    const [unidades, setUnidades] = useState([]);

    const criarNovoContrato = async () => {
        const novoContrato = await insertIdSQL(`INSERT INTO titulares (is_enviado) VALUES (0);`);

        if (!novoContrato) {
            return toast.show({
                title: "(Aviso) - Pax Vendedor",
                description: "Não foi possivel criar novo contrato!",
                placement: "top"
            });
        }
        setContratoID(novoContrato);
    }

    const setup = async () => {
        /// Criar contrato
        await criarNovoContrato();

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
    });

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

                    {/* Iformações iniciais */}
                    <Center>
                        <Box safeArea w="100%" pl="10" pr="10" mb="1" >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Informações Iniciais
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                selecione uma 'FILIAL' e preecha data de contrato:
                            </Heading>

                            <VStack space={3} mt="4">
                                <HStack space={2} justifyContent="center" mt="3">
                                    <Center w="100%" rounded="md">
                                        <ComponentInput
                                            label="Data de contrato:"
                                            column="dataContrato"
                                            placeholder='Digite a data de contrato:'
                                            type="numeric"
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>
                    </Center>
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
                                <ComponentSwitch
                                    label="Adicional cremação?"
                                    column="isCremado"
                                    contratoID={contratoID}
                                    table={table}
                                />
                                <HStack space={2} justifyContent="center">
                                    <Center w="100%" rounded="md">
                                        <ComponentInput
                                            label="Nome Completo"
                                            column="nomeTitular"
                                            placeholder='Digite o nome completo:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="CPF"
                                            column="cpfTitular"
                                            placeholder='Digite o CPF:'
                                            type="numeric"
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="RG"
                                            column="rgTitular"
                                            placeholder='Digite o RG:'
                                            type="numeric"
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Data Nascimento"
                                            column="dataNascTitular"
                                            placeholder='Data Nascimento:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Estado Civil"
                                            column="estadoCivilTitular"
                                            placeholder='Estado Civil:'
                                            array={estadosCivil}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Nacionalidade"
                                            column="nacionalidadeTitular"
                                            placeholder='Digite a nacionalidade do titular:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Naturalidade"
                                            column="naturalidadeTitular"
                                            placeholder='Digite a naturalidade do titular:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Religião"
                                            column="religiaoTitular"
                                            placeholder='Selecione uma religião:'
                                            array={religioes}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Sexo"
                                            column="sexoTitular"
                                            placeholder='Selecione um gênero:'
                                            array={sexo}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Email"
                                            column="email1"
                                            placeholder='Digite um Email:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Telefone"
                                            column="telefone1"
                                            placeholder='Digite um telefone:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Email Secundário"
                                            column="email2"
                                            placeholder='Digite um Email:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Telefone Secundário"
                                            column="telefone2"
                                            placeholder='Digite um telefone:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Religião"
                                            column="religiaoTitular"
                                            placeholder='Selecione uma religião:'
                                            array={religioes}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Sexo"
                                            column="sexoTitular"
                                            placeholder='Selecione um gênero:'
                                            array={sexo}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="100%" rounded="md">
                                        <ComponentInput
                                            label="Profissão"
                                            column="profissaoTitular"
                                            placeholder='Informe a profissão do titular:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>
                        {/* Endereço - Residencial */}
                        <Box safeArea w="100%" pl="10" pr="10" mb="1"  >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Endereço - Residencial
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <VStack space={3} mt="4">
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Logradouro"
                                            column="tipoLogradouroResidencial"
                                            placeholder='Selecione um logradouro:'
                                            array={logradouros}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Rua"
                                            column="nomeLogradouroResidencial"
                                            placeholder='Informe o nome da rua:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Número"
                                            column="numeroResidencial"
                                            placeholder='Digite o número da residencia:'
                                            type="numeric"
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Quadra"
                                            column="quadraResidencial"
                                            placeholder='Digite o número da quadra:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Lote"
                                            column="loteResidencial"
                                            placeholder='Digite o lote:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Complemento"
                                            column="complementoResidencial"
                                            placeholder='Complemento residencial:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Bairro"
                                            column="bairroResidencial"
                                            placeholder='Digite o nome do Bairro:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="CEP"
                                            column="cepResidencial"
                                            type="numeric"
                                            placeholder='Digite o CEP:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Cidade"
                                            column="cidadeResidencial"
                                            placeholder='Digite o nome da cidade:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Estado"
                                            column="estadoResidencial"
                                            placeholder='Digite o estado:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                            </VStack>
                        </Box>
                        {/* Endereço - Cobrança */}
                        <Box safeArea w="100%" pl="10" pr="10" mb="1"  >
                            <Heading size="lg" fontWeight="800" color="green.800" >
                                Endereço - Cobrança
                            </Heading>
                            <Heading mt="1" fontWeight="medium" size="xs">
                                Informe todas as informações corretamente!
                            </Heading>
                            <VStack space={3} mt="4">
                                <ComponentSwitch
                                    label="Endereço de cobrança será o mesmo do residencial?"
                                    column="enderecoCobrancaIgualResidencial"
                                    contratoID={contratoID}
                                    table={table}
                                />
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentSelect
                                            label="Logradouro"
                                            column="tipoLogradouroCobranca"
                                            placeholder='Selecione um logradouro:'
                                            array={logradouros}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Rua"
                                            column="nomeLogradouroCobranca"
                                            placeholder='Informe o nome da rua:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Número"
                                            column="numeroCobranca"
                                            placeholder='Digite o número da residencia:'
                                            type="numeric"
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Quadra"
                                            column="quadraCobranca"
                                            placeholder='Digite o número da quadra:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Lote"
                                            column="loteCobranca"
                                            placeholder='Digite o lote:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Complemento"
                                            column="complementoCobranca"
                                            placeholder='Complemento Cobranca:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Bairro"
                                            column="bairroCobranca"
                                            placeholder='Digite o nome do Bairro:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="CEP"
                                            column="cepCobranca"
                                            type="numeric"
                                            placeholder='Digite o CEP:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                </HStack>
                                <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Cidade"
                                            column="cidadeCobranca"
                                            placeholder='Digite o nome da cidade:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                        <ComponentInput
                                            label="Estado"
                                            column="estadoCobranca"
                                            placeholder='Digite o estado:'
                                            contratoID={contratoID}
                                            table={table}
                                        />
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