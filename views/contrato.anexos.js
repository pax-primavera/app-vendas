import React, { useState } from 'react';
import { Box, VStack, Heading, ScrollView, Button, Text, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonAdd, styleButtonTextAdd, containerFoto } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons"
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { executarSQL } from '../services/database/index.js';


function ContratoContentAnexos({ navigation }) {
    /// Config
    const route = useRoute();
    /// Parametros
    const { contratoID, unidadeID, anexos } = route.params;
    /// Imagens(Anexos)
    const [anexo5, setAnexo5] = useState(null);
    const [anexo6, setAnexo6] = useState(null);
    const [anexo7, setAnexo7] = useState(null);

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

    const pickImage = async (tipo = 'camera', numeroAnexo = 1) => {

        try {
            let permissionResult = tipo == 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Aviso,", "Permissão de câmera é requerida!");
                return;
            }

            let pickerResult = tipo == 'camera'
                ? await ImagePicker.launchCameraAsync({
                    base64: true,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 1,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    base64: true,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 1,
                });

            if (!pickerResult.canceled) {
                if (numeroAnexo === 5) {
                    setAnexo5(pickerResult.base64);
                }
                if (numeroAnexo === 6) {
                    setAnexo6(pickerResult.base64);
                }
                if (numeroAnexo === 7) {
                    setAnexo7(pickerResult.base64);
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
                        if (!anexo5 || !anexo6 || !anexo7) {
                            Alert.alert("Aviso.", "Envie todos os anexos, está faltando arquivo(s)!");
                            return;
                        }
                        await executarSQL(`
                            UPDATE titular 
                            SET 
                                anexo1 = '${anexo5}', 
                                anexo2 = '${anexo6}',
                                anexo3 = '${anexo7}'
                            WHERE id = ${contratoID}
                        `);

                        return navigation.navigate("contratoContentFinalizar", {
                            anexos: [
                                anexo5,
                                anexo6,
                                anexo7,
                                ...anexos
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
                                isDisabled={anexo5 != null}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(5)}
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
                                isDisabled={anexo6 != null}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(6)}
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
                                isDisabled={anexo7 != null}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => uploadImage(7)}
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
