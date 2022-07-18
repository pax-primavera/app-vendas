import React, { useState } from 'react';
import { Box, VStack, Heading, ScrollView, Button, Text, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonAdd, styleButtonTextAdd, containerFoto } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons"
import { Alert } from 'react-native';

function ContratoContentAnexos({ navigation }) {
    /// Config
    const route = useRoute();
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Imagens(Anexos)
    const [anexo1, setAnexo1] = useState(null);
    const [anexo2, setAnexo2] = useState(null);
    const [anexo3, setAnexo3] = useState(null);

    const tratamentoImagem = (foto) => {
        if (!foto) return null;

        let fileExtension = foto.uri.substr(foto.uri.lastIndexOf(".") + 1);

        let nameArquivo = foto.uri.substr(
            foto.uri.lastIndexOf("ImagePicker/") + 12
        );

        return {
            type: `image/${fileExtension}`,
            uri: foto.uri,
            name: `anexo_${nameArquivo}`,
        }
    }

    const pickImage = async (tipo = 'camera', nuumeroAnexo = 1) => {
        try {
            let permissionResult = tipo == 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Aviso,", "Permissão de câmera é requerida!");
                return;
            }

            let pickerResult = tipo == 'camera'
                ? await ImagePicker.launchCameraAsync()
                : await ImagePicker.launchImageLibraryAsync();

            if (!pickerResult.cancelled) {
                if (nuumeroAnexo === 1) {
                    setAnexo1(pickerResult);
                }
                if (nuumeroAnexo === 2) {
                    setAnexo2(pickerResult);
                }
                if (nuumeroAnexo === 3) {
                    setAnexo3(pickerResult);
                }
            }
        } catch (e) {
            Alert.alert("Aviso", e.toString())
        }
    };

    const uploadImage = (numeroAnexo = 1) => {
        return Alert.alert(
            "Aviso.",
            "Para fazer upload de uma imagem, escolha uma opção:",
            [
                {
                    text: "CANCELAR",
                    style: "cancel",
                },
                {
                    text: "ABRIR CÂMERA",
                    onPress: async () => {
                        return await pickImage('camera', numeroAnexo);
                    }
                },
                {
                    text: "ABRIR GALERIA",
                    onPress: async () => {
                        return await pickImage('galeria', numeroAnexo);
                    }
                },
            ],
            { cancelable: false }
        );
    }

    const PROSSEGUIR = () => {
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
                    onPress: () => {
                        if (!anexo1 || !anexo2 || !anexo3) {
                            Alert.alert("Aviso.", "Envie todos os anexos, está faltando arquivo(s)!");
                            return;
                        }

                        return navigation.navigate("contratoContentFinalizar", {
                            anexos: [
                                tratamentoImagem(anexo1),
                                tratamentoImagem(anexo2),
                                tratamentoImagem(anexo3)
                            ],
                            unidadeID,
                            contratoID
                        });
                    }
                },
            ],
            { cancelable: false }
        );
    }

    return (
        <ScrollView h="100%">
            <VStack m="2">
                <Box key="2" safeArea w="100%" pl="2" pr="2" mb="2" pb="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                    <Heading size="lg" pl="3" pr="3" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                        Anexos
                    </Heading>
                    <Heading mt="2" mb="1" pl="3" pr="3" fontWeight="medium" size="sm">
                        Informe todas as informações corretamente!
                    </Heading>
                    <VStack >
                        <VStack style={containerFoto}>
                            <VStack pl="5" pr="5">
                                <Text fontWeight="bold">Fotografe a frente do documento de identidade do cliente.</Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo1}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(1)}
                            >
                                FRENTE DO DOCUMENTO
                            </Button>
                        </VStack>
                        <VStack style={containerFoto}>
                            <VStack pl="5" pr="5">
                                <Text fontWeight="bold">Fotografe o verso do documento de identidade do cliente.</Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo2}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(2)}
                            >
                                VERSO DO DOCUMENTO
                            </Button>
                        </VStack>
                        <VStack style={containerFoto}>
                            <VStack pl="5" pr="5">
                                <Text fontWeight="bold">Fotografe o cliente de perfil.</Text>
                                <Text>PEÇA AUTORIZAÇÃO DELE ANTES</Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo3}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(3)}
                            >
                                PERFIL DO DOCUMENTO
                            </Button>
                        </VStack>
                    </VStack>
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
        </ScrollView >
    )
}

export { ContratoContentAnexos }
