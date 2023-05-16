import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, ScrollView, Button, HStack } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index.off';

function ContratoAdicionalHum({ navigation }) {
    /// Config
    const route = useRoute();
    /// Parametros
    const [data, setData] = useState([]);
    const { contratoID, unidadeID, id, hum } = route.params;

    const PROSSEGUIR = () => {

        return navigation.navigate("contratoContentEnderecoAdicional",
            {
                id: id,
                contratoID,
                unidadeID,
                hum
            }
        );
    }

    return (
        <ScrollView h="100%">
            <VStack m="2" >
                <Box key="1"
                    safeArea w="100%"
                    mb="2" pb="2"
                    maxW="100%"
                    rounded="lg"
                    overflow="hidden"
                    borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                    <ComponentModalDependentesPax
                        contratoID={contratoID}
                        unidadeID={unidadeID}
                        title="Dependente(s) PAX"
                        isPet={0}
                    />
                </Box>
                <Button
                    mt="2"
                    mb="2"
                    m="1"
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

export { ContratoAdicionalHum }
