import React from 'react';
import { Box, VStack, ScrollView, Button } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index';

function ContratoContentDependentes({ navigation }) {
    /// Config
    const route = useRoute();
    /// Parametros
    const { contratoID, unidadeID } = route.params;

    const proximoPasso = () => {
        return navigation.navigate("contratoContentAnexos", { contratoID, unidadeID });
    }

    return (
        <ScrollView h="100%">
            <VStack m="2">
                <Box key="1" safeArea w="100%" mb="2" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                    <ComponentModalDependentesPax
                        contratoID={contratoID}
                        unidadeID={unidadeID}
                        title="Dependente(s) PAX"
                        isPet={0}
                    />
                </Box>
                <Box key="2" safeArea w="100%" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                    <ComponentModalDependentesPax
                        contratoID={contratoID}
                        unidadeID={unidadeID}
                        title="Dependente(s) PET"
                        isPet={1}
                    />
                </Box>
                <Button
                    mt="2"
                    mb="4"
                    size="lg"
                    _text={styleButtonText}
                    _light={styleButton}
                    onPress={proximoPasso}
                >
                    Prosseguir
                </Button>

            </VStack>
        </ScrollView >
    )
}

export { ContratoContentDependentes }
