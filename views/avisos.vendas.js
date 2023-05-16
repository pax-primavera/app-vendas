import React, { useState, useEffect } from 'react';
import {  Center, Button, Box, Heading, VStack, useToast, ScrollView, Text, HStack } from "native-base";
import {  web, light, styleButtonText, styleButton, } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import axiosAuth from '../utils/config/axios/private.js';
import moment from 'moment';
import { executarSQL, executarListVendas } from '../services/database/index.js';
import NetInfo from "@react-native-community/netinfo";

function AvisosVendas() {
    const toast = useToast();
    const [carregamento, setCarregamento] = useState(true);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    const [carregamentoAvisos, setCarregamentoAvisos] = useState(true);
    const [data, setData] = useState([]);
    const [isNet, setIsNet] = React.useState(false);

    const verificarInternet = async () => {
      NetInfo.refresh().then(async (state) => {
        if (state.isConnected) {
          setIsNet(state.isConnected);
          toast.show({
            placement: "top",
            render: () => {
              return <ComponentToast message={`${state.type.toUpperCase()} - Conexão estabelecida com sucesso.`} />
            }
          });
        }else{
          toast.show({
            placement: "top",
            render: () => {
              return <ComponentToast message={`${state.type.toUpperCase()} - SEM INTERNET.`} />
            }
          });  
        }
        setCarregamento(false);
      });
    }

    executarListVendas().then((response) => {
      setData(response._array)   
    }), () => {
      Alert.alert('Erro ao executar SQL', sqlError.toString());
    }  

    const registrarClientes = async (object) => {
      Object.entries(object.avisosVendas).forEach(([key, value]) => {
          executarSQL(
            `insert or REPLACE into clientes(id, cliente, endereco, horario, plano_desejado, finalizada) values ('${value.id}','${value.cliente}','${value.endereco}','${value.horario}','${value.plano_desejado}','${value.finalizada}')`
          );
      });
    }

    const setup = async () => {
      setCarregamentoButton(false);
      const logado = await executarSQL(`select * from login`);
      try {
        const response = await axiosAuth.get(`/avisos-vendas/usuario-id=${logado._array[0].id}`);
        registrarClientes(response.data);
        setCarregamento(false); 
        setCarregamentoAvisos(false);
      } catch (e) {
        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message={`Não foi possivel carregar informações dos clientes, contate o suporte: ${e.toString()}`} />
          }
        });
      };
    }

    const deleteCliente = async (id) => {
      setCarregamento(true);
      await axiosAuth.get(`/atualizaAvisosVendas/id=${id}`,);
      await executarSQL(`
        DELETE from clientes WHERE id = ${id}`
      ); 
      setCarregamento(false);
      setCarregamentoButton(false);
       
      setup();
    }
    
    useEffect(() => {
      verificarInternet();
      setup();
    }, []);

    return (

    <ScrollView h="100%">
      {
         carregamento ?
         <ComponentLoading mensagem="Carregando Clientes" />
         : <VStack m="2">
            <Box key="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="10" >
                <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                  Solicitação de Vendedor
                </Heading>
                <Heading mt="3" mb="3" fontWeight="medium" size="xs">
                  Lista de clientes para realizar venda
                </Heading>
              </Box>
            </Box>
            {
                <>
                  {
                    data.map((data) => {
                      return (
                        <Box key={data.id} maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
                        <VStack p="5">
                            <Heading mb="2" color={colors.COLORS.PAXCOLOR_1} fontSize="16" fontWeight="bold">
                             Cliente: {data.cliente}
                            </Heading>
                            <VStack p="1">
                              <Text mt="3" fontWeight="extrabold">
                                Endereço:
                              </Text>
                              <Text mt="3" fontWeight="normal">
                              {data.endereco}
                              </Text>
                                <Text mt="3" fontWeight="extrabold">
                                  Horário:
                                </Text>
                                <Text mt="3" fontWeight="normal">
                                  {moment(data.horario).format('DD/MM/YYYY - HH:mm')}
                                </Text>
                                <Text mt="3" fontWeight="extrabold">
                                  Plano Desejado:
                                </Text>
                                <Text mt="3" fontWeight="normal">
                                  {data.plano_desejado}
                                </Text>
                            </VStack>
                            <HStack space={1} justifyContent="center">
                                <Center w="40%" rounded="md">
                                <Button
                                size="lg"
                                _text={styleButtonText}
                                isLoading={carregamentoButton}
                                isDisabled={!isNet}
                                isLoadingText="Finalizando"
                                _light={styleButton}
                                onPress={()=>{deleteCliente(data.id)}}
                            >
                                FINALIZAR
                            </Button>
                                </Center>
                            </HStack>
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

export { AvisosVendas }