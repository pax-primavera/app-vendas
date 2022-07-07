import React, { useState, useEffect, useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { executarSQL } from '../services/database/index.js';
import { Center, HStack, VStack, Icon, Heading, Text, Container, Pressable } from "native-base";
import colors from '../utils/styles/colors.js';
import { textCenter } from '../utils/styles/index';

const Home = ({ navigation }) => {
    const [usuario, setUsuario] = useState('Usuário não encontrado!');

    async function getUsuario() {
        const logado = await executarSQL(`select * from login`);

        if (logado._array && logado._array.length > 0) {
            return setUsuario(logado._array[0].usuario);
        }
        return navigation.navigate("Login");
    }

    const finalizarSessao = async () => {
        Alert.alert(
            "Finalizar sessão!",
            "Deseja sair do aplicativo?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress: async () => {
                        await executarSQL(`delete from login`);
                        navigation.navigate("Login");
                    },
                },
            ],
            { cancelable: false }
        );
    }

    const abrirNovoContrato = () => {
        Alert.alert(
            "ATENÇÃO!",
            "Deseja cadastrar um 'NOVO CONTRATO ONLINE'?",
            [
                {
                    text: "Não",
                    style: "cancel",
                },
                {
                    text: "Sim",
                    onPress:  () => {
                        navigation.navigate("ContratoInicial")
                    },
                },
            ],
            { cancelable: false }
        );
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => finalizarSessao()}>
                    <Icon as={MaterialCommunityIcons} size="8" name="exit-to-app" color={colors.COLORS.PAXCOLOR_1} />
                </TouchableOpacity>
            )
        });
    }, [navigation, MaterialCommunityIcons]);

    useEffect(() => {
        getUsuario();
    }, []);

    return (
        <VStack space={1} mt="1" m="2">
            <Container mt="4" w="100%" ml="5" >
                <Heading mb="3">
                    <Text color={colors.COLORS.PAXCOLOR_1}>Pax Vendedor</Text>
                </Heading>
                <Text mt="1" fontWeight="medium" style={textCenter}>
                    <Text color="black" >Usuário: {usuario}</Text>
                </Text>
                <Text fontWeight="medium" style={textCenter}>
                    <Text color={colors.COLORS.PAXCOLOR_1} >'Novo Contrato'</Text> - Cadastrar novo contrato com seus dependente(s) e filial.
                </Text>
                <Text mt="1" fontWeight="medium" style={textCenter}>
                    <Text color={colors.COLORS.PAXCOLOR_1}>'Planos'</Text> - Listar todos planos disponiveis em determinada filial escolhida.
                </Text>
            </Container>
            <Center mt="5" ml="5" mr="5">
                <HStack space={2} justifyContent="center">
                    <Pressable onPress={abrirNovoContrato} w="50%" bg="white" rounded="md" shadow={3}>
                    <Center h="40">
                        <Icon as={MaterialCommunityIcons} size="20" name="file-check-outline" color={colors.COLORS.PAXCOLOR_1} />
                        <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                            Novo Contrato
                        </Heading>
                    </Center>
                </Pressable>
                <Pressable onPress={() => navigation.navigate("Planos")} w="50%" bg="white" rounded="md" shadow={3}>
                    <Center h="40">
                        <Icon as={MaterialCommunityIcons} size="20" name="book-open-outline" color={colors.COLORS.PAXCOLOR_1} />
                        <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                            Planos
                        </Heading>
                    </Center>
                </Pressable>
            </HStack>
        </Center>
        </VStack >
    );
}
export { Home };
