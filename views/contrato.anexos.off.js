import React, { useEffect, useState } from 'react';
import { Box, VStack, Heading, ScrollView, Button, Text, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonAdd, styleButtonTextAdd, containerFoto } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons"
import { Alert } from 'react-native';
import { executarSQL, executarListIDSQL } from '../services/database/index';
import ComponentLoading from '../components/views/loading/index';

function ContratoContentAnexosOff({ navigation }) {
    /// Config
    const route = useRoute();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    /// Imagens(Anexos)
    const [anexo1, setAnexo1] = useState(null);
    const [anexo2, setAnexo2] = useState(null);
    const [anexo3, setAnexo3] = useState(null);

    const id = route.params.id;

    const tratamentoImagem = async (foto, column) => {
        if (!foto) return null;

        let fileExtension = foto.uri.substr(foto.uri.lastIndexOf(".") + 1);

        let nameArquivo = foto.uri.substr(
            foto.uri.lastIndexOf("ImagePicker/") + 12
        );

        var anexo = {
            type: `image/${fileExtension}`,
            uri: foto.uri,
            name: `anexo_${nameArquivo}`,
        }

        var stringObj = JSON.stringify(anexo);

        await executarSQL(`
            UPDATE titular SET 
            ${column} = '${(stringObj)}'
            WHERE id = ${id}`
        );

        return {}
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
                ? await ImagePicker.launchCameraAsync()
                : await ImagePicker.launchImageLibraryAsync();

            if (!pickerResult.canceled) {
                if (numeroAnexo === 5) {
                    setAnexo1(pickerResult.base64);
                }
                if (numeroAnexo === 6) {
                    setAnexo2(pickerResult.base64);
                }
                if (numeroAnexo === 7) {
                    setAnexo3(pickerResult.base64);
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


    const setup = async () => {
        setCarregamentoTela(true);
        await executarListIDSQL(id).then((response) => {
            setAnexo1(response._array[0].anexo1)
            setAnexo2(response._array[0].anexo2)
            setAnexo3(response._array[0].anexo3)

            setCarregamentoTela(false);
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
    }
    0
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
                    onPress: () => {
                        // if (!anexo1 || !anexo2 || !anexo3) {
                        //     Alert.alert("Aviso.", "Envie todos os anexos, está faltando arquivo(s)!");
                        //     return;
                        // }
                        return navigation.navigate("contratoContentFinalizarOff", {
                            id: id, contratoID, unidadeID,
                            anexos: [
                                anexo1, 'anexo1',
                                anexo2, 'anexo2',
                                anexo3, 'anexo3'
                            ],
                        });
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
                    <VStack m="2">
                        <Box key="2" safeArea w="100%" pl="2" pr="2" mb="2" pb="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <Heading size="lg" pl="3" pr="3" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                Anexos
                            </Heading>
                            <Heading mt="2" mb="1" pl="3" pr="3" fontWeight="medium" size="sm">
                                Atualize as imagens do contrato caso necessário!
                            </Heading>
                            <VStack >
                                <VStack style={containerFoto}>
                                    <VStack pl="5" pr="5">
                                        <Text fontWeight="bold">Fotografe a frente do documento de identidade do cliente.</Text>
                                    </VStack>
                                    <Button size="lg"
                                        m="5"
                                        isDisabled={anexo1 != null}
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
                                        isDisabled={anexo2 != null}
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
                                        isDisabled={anexo3 != null}
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
                                onPress={() => { PROSSEGUIR(data.id) }}
                            >
                                PROSSEGUIR
                            </Button>
                        </Box>
                    </VStack>
            }
        </ScrollView >
    )
}

export { ContratoContentAnexosOff }
