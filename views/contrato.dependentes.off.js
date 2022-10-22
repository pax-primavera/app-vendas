import React, { useState } from 'react';
import { Box, VStack, ScrollView, Button } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index.off';

function ContratoContentDependentesOff({ navigation }) {
    /// Config
    const route = useRoute();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    const id = route.params.id;
    
    const PROSSEGUIR = async () => {
        return navigation.navigate("contratoContentAnexosOff", { id: id, contratoID, unidadeID });
    }

    return (
        <ScrollView h="100%">
            <VStack m="2">
                <Box key="1" safeArea w="100%" mb="2" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                    <ComponentModalDependentesPax
                        contratoID={contratoID}
                        unidadeID={id}
                        title="Dependente(s) PAX"
                        isPet={0}
                    />
                </Box>
                <Button
                    mt="2"
                    mb="4"
                    size="lg"
                    _text={styleButtonText}
                    _light={styleButton}
                    onPress={()=>{PROSSEGUIR(data.id)}}
                >
                    PROSSEGUIR
                </Button>
            </VStack>
        </ScrollView >
    )
}

export { ContratoContentDependentesOff }
