import React, { useEffect, useState } from 'react';
import { Box, VStack, ScrollView, Button } from "native-base";
import { executarSQL } from "../services/database/index.js";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index.off';
import { Alert } from 'react-native';
import ComponentLoading from "../components/views/loading/index";

function ContratoContentDependentesOff({ navigation }) {
    /// Config
    const route = useRoute();
    const [data, setData] = useState([]);
    /// Parametros
    const { contratoID, unidadeID } = route.params;
    const id = route.params.id;
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [regiao, setRegiao] = useState(null);

    const PROSSEGUIR = async () => {
        return navigation.navigate("contratoContentAnexosOff",
            {
                id: id,
                contratoID,
                unidadeID,
            });
    }

    const setup = async () => {
        await executarSQL(`select regiao from unidade where id = ${unidadeID}`).then((response) => {
            if (response._array[0].regiao == 1 || response._array[0].regiao == 3) {
                setRegiao(0)
            } else {
                setRegiao(1)
            }
        }), () => {
            Alert.alert('Erro ao executar SQL', sqlError.toString());
        }
        setCarregamentoTela(false);
    }

    useEffect(() => {
        setup();
    }, []);

    return (
        <ScrollView h="100%">
            {carregamentoTela ? (
                <ComponentLoading mensagem="Carregando informações" />
            ) : (
                <VStack m="2">
                    <Box key="1" safeArea w="100%" mb="2" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <ComponentModalDependentesPax
                            contratoID={id}
                            unidadeID={unidadeID}
                            title="Dependente(s) PAX"
                            isPet={0}
                        />
                    </Box>
                    {regiao == 1 ? (
                        <Box key="2" safeArea w="100%" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <ComponentModalDependentesPax
                                contratoID={id}
                                unidadeID={unidadeID}
                                title="Dependente(s) PET"
                                isPet={1}
                            />
                        </Box>
                    ) : (
                        <></>
                    )}
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
            )}
        </ScrollView >
    )
}

export { ContratoContentDependentesOff }
