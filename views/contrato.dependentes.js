import React, { useEffect, useState } from 'react';
import { Box, VStack, ScrollView, Button } from "native-base";
import { executarSQL } from "../services/database/index.js";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { useRoute } from '@react-navigation/native';
import ComponentModalDependentesPax from '../components/views/dependentes/index';
import { Alert } from 'react-native';
import ComponentLoading from "../components/views/loading/index";

function ContratoContentDependentes({ navigation }) {
    /// Config
    const route = useRoute();
    /// Parametros
    const { contratoID, unidadeID, anexos } = route.params;
    const [carregamentoTela, setCarregamentoTela] = useState(true);
    const [regiao, setRegiao] = useState(null);

    const PROSSEGUIR = async () => {
        const parentesco = await executarSQL(
            `select count(*) as verifica from dependente where titular_id = ${contratoID} and parentesco is null`
        );
        if (parentesco._array[0].verifica >= 1) {
            //Alert.alert("Aviso.","Grau de parentesco do dependente é obrigatório!")
            return navigation.navigate("contratoContentAnexos",
                {
                    contratoID,
                    unidadeID,
                    anexos: [...anexos],
                });
        } else {
            return navigation.navigate("contratoContentAnexos",
                {
                    contratoID,
                    unidadeID,
                    anexos: [...anexos],
                });
        }
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
                            contratoID={contratoID}
                            unidadeID={unidadeID}
                            title="Dependente(s) PAX"
                            isPet={0}
                        />
                    </Box>
                    {regiao == 1 ? (
                        <Box key="2" safeArea w="100%" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                            <ComponentModalDependentesPax
                                contratoID={contratoID}
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

                        onPress={PROSSEGUIR}
                    >
                        PROSSEGUIR
                    </Button>
                </VStack>
            )}
        </ScrollView >
    )
}

export { ContratoContentDependentes }
