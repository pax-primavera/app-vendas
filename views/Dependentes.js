import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { executarSQL, insertIdSQL } from '../services/database/index.js';
import { cpfMask, dataMask } from "../utils/generic/format.js";
import { styleInputFocus, styleButton, styleButtonText, styleButtonDelete, styleButtonTextDelete } from '../utils/styles/index';
import { Center, HStack, VStack, Icon, Heading, Box, ScrollView, Spinner, useToast, FormControl, Input, Select, Button } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { cores, especies, portes } from '../utils/generic/data';
import colors from '../utils/styles/colors.js';

function Dependentes({ navigation }) {
    const route = useRoute();
    const toast = useToast();
    const [dependentes, setDependentes] = useState([]);
    const [parentescos, setParentescos] = useState([]);
    const [contratoID, setContratoID] = useState(null);
    const [tipoDependente, setTipoDependente] = useState(null);
    const [carregamento, setCarregamento] = useState(false);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    const [mensagem, setMensagem] = useState('Carregando informações locais, aguarde...');

    const setupSelecionarFilial = async (contratoID, unidadeID, tipo) => {
        // Inicial carregamento de tela
        setCarregamento(true);
        // Setar mensagem na tela
        setMensagem("Carregando informações, aguarde!");

        const parentescosGet = await executarSQL(`select * from selects where tipo = 6 and unidade_id = '${unidadeID}'`);

        if (parentescosGet._array && parentescosGet._array.length > 0) {
            setParentescos(parentescosGet._array);
            setCarregamento(false);
        }
        // Atribuir valores
        setContratoID(contratoID);
        setTipoDependente(tipo);
    }

    const novoDependente = async () => {
        validateInputs();

        const novoDependente = await insertIdSQL(`INSERT INTO dependentes (is_pet, titular_id) values (${tipoDependente}, ${contratoID});`);

        if (!novoDependente) {
            return toast.show({
                title: "(Aviso) - Pax Vendedor",
                description: "Não foi possivel criar novo dependente!",
                placement: "top"
            });
        }

        // Carregar dependentes
        await loadDependentes();
    }

    const deletarDependente = async (id) => {

        const deleteDependente = await executarSQL(`delete from dependentes where id = ${id}`);

        if (!deleteDependente) {
            return toast.show({
                title: "(Aviso) - Pax Vendedor",
                description: "Não foi possivel deletar dependente!",
                placement: "top"
            });
        }

        // Carregar dependentes
        await loadDependentes();
    }

    const changeInput = async (index, label, value) => {
        const tratar = (label, labelValue) => {
            if (label === 'cpf_dependente') {
                return cpfMask(labelValue)
            } else if (label === 'dataNascimento') {
                return dataMask(value);
            } else {
                return labelValue;
            }
        }

        //Tratar Campos Especificos
        const tratamento = tratar(label, value);

        // Alterar banco de dados
        await executarSQL(`UPDATE dependentes SET ${label} = '${tratamento}' where id = ${dependentes[index].id}`);
    }

    const loadDependentes = async () => {
        // Iniciar carregamento
        setCarregamentoButton(true);
        // Inicial carregamento dos dados locais 
        const dependentesGet = await executarSQL(`select * from dependentes where is_pet = ${tipoDependente} and titular_id = ${contratoID} order by id asc`);

        if (dependentesGet && dependentesGet._array) {
            setDependentes(dependentesGet._array);
            setCarregamentoButton(false);
        }
    }

    useEffect(() => {
        const { contratoID, unidadeID, isPet } = route.params;
        // Carregar dependentes do contratos
        loadDependentes();
        // Carregar informações sobre a filial
        setupSelecionarFilial(contratoID, unidadeID, isPet);
    }, []);

    const validateInputs = () => {
        let index = dependentes.length - 1;

        for (var property in dependentes[index]) {
            if (!dependentes[index][property]) {

                return toast.show({
                    title: "(Aviso) - Pax Vendedor",
                    description: "Preencha os campos corretamente.",
                    placement: "top"
                });
            }
        }
    }

    return (
        <ScrollView h="100%">
            {
                carregamento ? (
                    <HStack space={2} mt="5" justifyContent="center" alignItems="center">
                        <Spinner size="lg" color={colors.COLORS.PAXCOLOR_1} accessibilityLabel={mensagem} />
                        <Heading color={colors.COLORS.PAXCOLOR_1} fontSize="lg">
                            {mensagem}
                        </Heading>
                    </HStack>
                ) :
                    <VStack m="2">
                        <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={{
                            backgroundColor: "gray.50"
                        }}
                            _web={{
                                shadow: 2,
                                borderWidth: 0
                            }} >
                            <Center w="100%">
                                <Box safeArea w="100%" pl="10" pr="10" mb="5" >
                                    <Heading size="xs" fontWeight="500" color="green.800" >
                                        Dependentes {tipoDependente === 0 ? 'Pet' : 'Pax'}
                                    </Heading>
                                    <Heading mt="1" fontWeight="medium" size="xs">
                                        Informe todas as informações corretamente!
                                    </Heading>
                                </Box>
                            </Center>
                            {
                                dependentes.map((item, index) => (
                                    item.isPet === 0 ?
                                        <Box key={item.id} safeArea w="100%" pl="10" pr="10" mb="10" >
                                            <VStack space={3} >
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="100%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>Nome:</FormControl.Label>
                                                            <Input placeholder='Digite o nome do dependente:' value={item.nome} onChangeText={e => changeInput(index, 'nome', e)} _focus={styleInputFocus} />
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="50%" rounded="md">
                                                        <FormControl i>
                                                            <FormControl.Label>Data Nascimento:</FormControl.Label>
                                                            <Input keyboardType='numeric' value={item.dataNascimento} onChangeText={e => changeInput(index, 'dataNascimento', e)} placeholder='Digite a data de nascimento:' _focus={styleInputFocus} />
                                                        </FormControl>
                                                    </Center>
                                                    <Center w="50%" rounded="md">
                                                        <FormControl  >
                                                            <FormControl.Label>Espécie:</FormControl.Label>
                                                            <Select _focus={styleInputFocus} selectedValue={item.especie} onValueChange={e => changeInput(index, 'especie', e)} accessibilityLabel="Espécie:" placeholder="Espécie:">
                                                                {especies.map((especie) => <Select.Item key={especie.id} label={especie.nome} value={especie.id} />)}
                                                            </Select>
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="100%" rounded="md">
                                                        <FormControl>
                                                            <FormControl.Label>Peso: {item.peso}</FormControl.Label>
                                                            <Slider
                                                                maximumValue="100"
                                                                minimumTrackTintColor={colors.COLORS.PAXCOLOR_1}
                                                                thumbTintColor={colors.COLORS.PAXCOLOR_1}
                                                                onValueChange={e => changeInput(index, 'peso', e)}
                                                            />
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="100%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>Altura:  {item.altura}</FormControl.Label>
                                                            <Slider
                                                                maximumValue="25"
                                                                minimumTrackTintColor={colors.COLORS.PAXCOLOR_1}
                                                                thumbTintColor={colors.COLORS.PAXCOLOR_1}
                                                                onValueChange={e => changeInput(index, 'altura', e)}
                                                            />
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="50%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>Cor:</FormControl.Label>
                                                            <Select _focus={styleInputFocus} selectedValue={item.cor} onValueChange={e => changeInput(index, 'cor', e)} accessibilityLabel="Cor:" placeholder="Cor:">
                                                                {cores.map((cor) => <Select.Item key={cor.id} label={cor.nome} value={cor.id} />)}
                                                            </Select>
                                                        </FormControl>
                                                    </Center>
                                                    <Center w="50%" rounded="md">
                                                        <FormControl>
                                                            <FormControl.Label>Porte:</FormControl.Label>
                                                            <Select _focus={styleInputFocus} selectedValue={item.porte} onValueChange={e => changeInput(index, 'porte', e)} accessibilityLabel="Porte:" placeholder="Porte:">
                                                                {portes.map((porte) => <Select.Item key={porte.id} label={porte.nome} value={porte.id} />)}
                                                            </Select>
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                            </VStack>
                                            <Button size="lg"
                                                mt="2"
                                                leftIcon={<Icon as={Ionicons} name="add" size="lg" color="white" />}
                                                _light={styleButtonDelete}
                                                isLoading={carregamentoButton}
                                                _text={styleButtonTextDelete}
                                                variant="outline"
                                                onPress={() => deletarDependente(item.id)}
                                            >
                                                Excluir
                                            </Button>
                                        </Box> :
                                        <Box key={item.id} safeArea w="100%" pl="10" pr="10" mb="10" >
                                            <VStack space={3} >
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="100%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>Nome:</FormControl.Label>
                                                            <Input placeholder='Digite o nome do dependente:' value={item.nome} onChangeText={e => changeInput(index, 'nome', e)} _focus={styleInputFocus} />
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="50%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>Data Nascimento:</FormControl.Label>
                                                            <Input keyboardType='numeric' value={item.dataNascimento} placeholder='Digite a data de nascimento:' onChangeText={e => changeInput(index, 'dataNascimento', e)} _focus={styleInputFocus} />
                                                        </FormControl>
                                                    </Center>
                                                    <Center w="50%" rounded="md">
                                                        <FormControl>
                                                            <FormControl.Label>Parentesco:</FormControl.Label>
                                                            <Select _focus={styleInputFocus} selectedValue={item.parentesco} onValueChange={e => changeInput(index, 'parentesco', e)} accessibilityLabel="Parentesco:" placeholder="Parentesco:">
                                                                {parentescos.map((parentesco) => <Select.Item key={parentesco.id} label={parentesco.descricao} value={parentesco._id} />)}
                                                            </Select>
                                                        </FormControl>
                                                    </Center>
                                                </HStack>
                                                <HStack space={2} justifyContent="center">
                                                    <Center w="100%" rounded="md">
                                                        <FormControl >
                                                            <FormControl.Label>CPF:</FormControl.Label>
                                                            <Input placeholder='Digite o CPF do dependente:' value={item.cpf_dependente} onChangeText={e => changeInput(index, 'cpf_dependente', e)} _focus={styleInputFocus} />
                                                        </FormControl>,
                                                    </Center>
                                                </HStack>
                                            </VStack>
                                            <Button size="lg"
                                                mt="2"
                                                leftIcon={<Icon as={Ionicons} name="add" size="lg" color="white" />}
                                                _light={styleButtonDelete}
                                                isLoading={carregamentoButton}
                                                _text={styleButtonTextDelete}
                                                variant="outline"
                                                onPress={() => deletarDependente(item.id)}
                                            >
                                                Excluir
                                            </Button>
                                        </Box>
                                ))
                            }
                        </Box>
                        <Button size="lg"
                            mt="2"
                            leftIcon={<Icon as={Ionicons} name="add" size="lg" color="white" />}
                            _light={styleButton}
                            isLoading={carregamentoButton}
                            _text={styleButtonText}
                            variant="outline"
                            onPress={() => novoDependente()}
                        >
                            Novo Dependente(s)
                        </Button>
                    </VStack>
            }
        </ScrollView>

    );
}

export { Dependentes }