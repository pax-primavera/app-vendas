import React, { useState, useEffect } from 'react';
import { Button, Box, Heading, VStack, ScrollView, Text } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import { executarListSQL } from '../services/database/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';

function VendasPendentes({ navigation }) {
    const route = useRoute();
    const [carregamento, setCarregamento] = useState(true);
    const [carregamentoVendas, setCarregamentoVendas] = useState(true);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    const [data, setData] = useState([]);

    const setup = async () => {
      executarListSQL().then((response) => {
        setData(response._array)   
      }), () => {
        Alert.alert('Erro ao executar SQL', sqlError.toString());
      }  
      setCarregamento(false);
      setCarregamentoVendas(false);
      setCarregamentoButton(false);
      /*
      await executarSQL(`
        DELETE from titulares WHERE nomeTitular IS NOT NULL`
      );
      await executarSQL(`
        DELETE from dependentes WHERE nome IS NOT NULL`
      );*/
    }
    

    const finalizar = async (id) => {
      Alert.alert(
          "Aviso.",
          "Deseja PROSSEGUIR para proxima 'ETAPA'? Verifique se o tablet está conectado a internet só por garantia!",
          [
              {
                  text: "Não",
                  style: "cancel",
              },
              {
                  text: "Sim",
                  onPress: async () => {
                    return navigation.navigate("ContratoInicialOff", {id});
                  },
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
         carregamento ?
         <ComponentLoading mensagem="Carregando Vendas Pendentes" />
         : <VStack m="2">
            <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="10" >
                <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                  Vendas Pendentes
                </Heading>
                <Heading mt="1" mb="3" fontWeight="medium" size="xs">
                  Selecione uma venda para 'FINALIZAR'.
                </Heading>
              </Box>
            </Box>
            {
              carregamentoVendas ?
                <ComponentLoading mensagem=" Carregando vendas não finalizadas" />
                :
                <>
                  {
                    data.map((data) => {
                      return (
                        <Box key={data.id} maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
                           >
                        <VStack p="5">
                            <Heading color={colors.COLORS.PAXCOLOR_1} fontSize="16" fontWeight="bold">
                              Data do Contrato: {data.dataContrato}
                            </Heading>
                            <Text mt="3" fontWeight="medium">
                              ID: {data.id}
                            </Text>
                            <Text mt="3" fontWeight="medium">
                              CPF: {data.cpfTitular}
                            </Text>
                            <Text mt="3" fontWeight="medium">
                              Titular: {data.nomeTitular}
                            </Text>
                            <Button
                                
                                mt="6"
                                mb="2"
                                size="lg"
                                _text={styleButtonText}
                                isLoading={carregamentoButton}
                                isLoadingText="Enviando"
                                _light={styleButton}
                                onPress={()=>{finalizar(data.id)}}
                            >
                                FINALIZAR
                            </Button>
                          </VStack>
                        </Box>
                      )
                    })
                  }
                </>
            }
        </VStack>
      }
    </ScrollView>
  );
}

export { VendasPendentes };