import React, { useState, useEffect, useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { executarSQL } from '../services/index.js';

import {
    Center,
    HStack,
    VStack,
    Icon,
    Heading,
    Text,
    Container
} from "native-base";

function Home({ navigation }) {

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
                        await executarSQL(`delete from selects`);
                        await executarSQL(`delete from planos`);

                        navigation.navigate("Login");
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
                    <Icon as={MaterialCommunityIcons} size="8" name="exit-to-app" color="green.800" />
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
                    <Text color="green.800">Pax Vendedor</Text>
                </Heading>
                <Text mt="1" fontWeight="medium" style={styles.textCenter}>
                    <Text color="black" >Usuário: {usuario}</Text>
                </Text>
                <Text fontWeight="medium" style={styles.textCenter}>
                    <Text color="green.800" >'Contrato Online'</Text> - Essa modalidade o vendedor faz o contrato totalmente online.
                </Text>
                <Text mt="1" fontWeight="medium" style={styles.textCenter}>
                    <Text color="green.800">'Contrato Offline'</Text> - Essa modalidade o vendedor faz o contrato sem a conexão com internet, ou seja, sem enviar para o sistema web/D4.
                </Text>
            </Container>
            <Center mt="5" ml="5" mr="5">
                <HStack space={2} justifyContent="center">
                    <Center h="40" w="50%" bg="white" rounded="md" shadow={3} >
                        <Icon onPress={() => navigation.navigate("Contrato")} as={MaterialCommunityIcons} size="20" name="file-check-outline" color="green.800" />
                        <Heading size="sm" fontWeight="900" color="green.800" >
                            Contrato Online
                        </Heading>
                    </Center>
                    <Center h="40" w="50%" bg="white" rounded="md" shadow={3}>
                        <Icon as={MaterialCommunityIcons} size="20" name="file-cancel-outline" color="green.800" />
                        <Heading size="sm" fontWeight="900" color="green.800" >
                            Contrato Offline
                        </Heading>
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center" mt="2">
                    <Center h="40" w="50%" bg="white" rounded="md" shadow={3}>
                        <Icon as={MaterialCommunityIcons} size="20" name="file-clock-outline" color="green.800" />
                        <Heading size="sm" fontWeight="900" color="green.800" >
                            Contratos Pendentes
                        </Heading>
                    </Center>
                    <Center h="40" w="50%" bg="white" rounded="md" shadow={3}>
                        <Icon as={MaterialCommunityIcons} size="20" name="book-open-outline" color="green.800" />
                        <Heading size="sm" fontWeight="900" color="green.800" >
                            Nossos Planos
                        </Heading>
                    </Center>
                </HStack>
            </Center>
        </VStack>
    );
}

const styles = StyleSheet.create({
    textCenter: {
        textAlign: 'justify',
        marginBottom: 10
    },
    font: {
        fontSize: 10
    }
});

export { Home };