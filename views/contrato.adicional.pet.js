import React, { useState } from 'react';
import { Center, Box, VStack, ScrollView, Button, HStack } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index.off';

function ContratoAdicionalPET({ navigation }) {
    /// Config
    const route = useRoute();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID, id } = route.params;

    const PROSSEGUIR = async () => {

        return navigation.navigate("contratoContentEnderecoAdicionalPET",
            {
                id: id,
                contratoID,
                unidadeID,
            }
        );
    }

    return (
        <ScrollView h="100%">
            <VStack m="2">
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
                    onPress={() => { PROSSEGUIR(data.id) }}
                >
                    PROSSEGUIR
                </Button>
            </VStack>
        </ScrollView >
    )
}

export { ContratoAdicionalPET }
