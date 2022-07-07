import React, { useState } from 'react';
import { Box, VStack, Heading, ScrollView, Button, useToast, Text, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonAdd, styleButtonTextAdd, containerFoto } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import ComponentToast from '../components/views/toast/index';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons"
import { Alert } from 'react-native';

function ContratoContentAnexos({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Booleanos
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    /// Imagens(Anexos)
    const [anexo1, setAnexo1] = useState(null);
    const [anexo2, setAnexo2] = useState(null);
    const [anexo3, setAnexo3] = useState(null);

    const tratamentoImagem = (foto) => {
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

    const pickImage = async (numeroAnexo) => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false
        });

        if (!result.cancelled) {
            if (numeroAnexo === 1) setAnexo1(result)
            if (numeroAnexo === 2) setAnexo2(result)
            if (numeroAnexo === 3) setAnexo3(result)
        }
    };

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

                        if (!anexo1 || !anexo2 || !anexo3) {
                            setCarregamentoButton(false);

                            return toast.show({
                                placement: "bottom",
                                render: () => {
                                    return <ComponentToast title="ATENÇÃO!" message="Envie todos os anexos, está faltando arquivo(s)!" />
                                }
                            });
                        }

                        setCarregamentoButton(false);

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
            <VStack m="1">
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
                                <Text>
                                    {
                                        !anexo1 ?
                                            <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                                            <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                                    }
                                </Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo1}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => pickImage(1)}
                            >
                                FRENTE DO DOCUMENTO
                            </Button>
                        </VStack>
                        <VStack style={containerFoto}>
                            <VStack pl="5" pr="5">
                                <Text fontWeight="bold">Fotografe o verso do documento de identidade do cliente.</Text>
                                <Text>
                                    {
                                        !anexo2 ?
                                            <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                                            <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                                    }
                                </Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo2}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => pickImage(2)}
                            >
                                VERSO DO DOCUMENTO
                            </Button>
                        </VStack>
                        <VStack style={containerFoto}>
                            <VStack pl="5" pr="5">
                                <Text fontWeight="bold">Fotografe o cliente de perfil.</Text>
                                <Text>PEÇA AUTORIZAÇÃO DELE ANTES</Text>
                                <Text> {
                                    !anexo3 ?
                                        <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                                        <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                                }</Text>
                            </VStack>
                            <Button size="lg"
                                m="5"
                                isDisabled={anexo3}
                                leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                                _light={styleButtonAdd}
                                _text={styleButtonTextAdd}
                                variant="outline"
                                onPress={() => pickImage(3)}
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
                        isLoading={carregamentoButton}
                        onPress={proximoPasso}
                    >
                        Prosseguir
                    </Button>
                </Box>
            </VStack>
        </ScrollView >
    )
}

export { ContratoContentAnexos }
