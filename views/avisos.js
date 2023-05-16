import React, { useState, useEffect } from 'react';
import { Center, Box, Heading, VStack, useToast, ScrollView, Text, HStack } from "native-base";
import {  web, light, } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import axiosAuth from '../utils/config/axios/private.js';
import moment from 'moment';

function Avisos() {
    const toast = useToast();
    const route = useRoute();
    const [carregamento, setCarregamento] = useState(true);
    const [carregamentoAvisos, setCarregamentoAvisos] = useState(true);
    const [dataAviso, setDataAviso] = useState(null);
    const [data, setData] = useState([]);

    const setup = async () => {
      try {
        const response = await axiosAuth.get(`/avisos`);
          setData(response.data.avisos) 
          setCarregamento(false); 
          setCarregamentoAvisos(false);
          setDataAviso(moment(response.data.avisos[0].dataFinal).format('DD/MM/YYYY - HH:mm'));
          setup();
      } catch (e) {
        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message={`Não foi possivel carregar informações dos avisos, contate o suporte: ${e.toString()}`} />
          }
        });
      };
    }
    
    let dataAtual = moment(new Date()).format('DD/MM/YYYY - HH:mm');
    
    useEffect(() => {
        setup();
    }, []);

    return (

    <ScrollView h="100%">
      {
         carregamento ?
         <ComponentLoading mensagem="Carregando Avisos" />
         : <VStack m="2">
            <Box key="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="10" >
                <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                  Avisos
                </Heading>
                <Heading mt="3" mb="3" fontWeight="medium" size="xs">
                  Atualizações ou avisos repassados direto pelo setor de <Text color={colors.COLORS.PAXCOLOR_1}>'Tecnologia'</Text>
                </Heading>
              </Box>
            </Box>
            {
              dataAtual >= dataAviso ?
              
                <VStack p="5">
                <Center>
                <Heading size="lg" color={colors.COLORS.PAXCOLOR_1} fontSize="24" fontWeight="bold">
                Nenhum aviso!
              </Heading>
             </Center>
              </VStack>
                :
                <>
                  {
                    data.map((data) => {
                      return (
                        <Box key={data.id} maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
                        <VStack p="5">
                          <Center>
                            <Heading mb="3" color={colors.COLORS.PAXCOLOR_1} fontSize="16" fontWeight="bold">
                              {data.titulo}
                            </Heading>
                            </Center>
                            <VStack p="2">
                              <Text mt="3" fontWeight="extrabold">
                                Motivo:
                              </Text>
                              <Text mt="3" fontWeight="normal">
                              {data.descricao}
                              </Text>
                                <Text mt="3" fontWeight="extrabold">
                                  Data Inicial:
                                </Text>
                                <Text mt="3" fontWeight="normal">
                                  {moment(data.dataInicio).format('DD/MM/YYYY - HH:mm')}
                                </Text>
                                <Text mt="3" fontWeight="extrabold">
                                    Data Final:
                                </Text>
                                <Text mt="3" fontWeight="normal">
                                  {moment(data.dataFinal).format('DD/MM/YYYY - HH:mm')}
                                </Text>
                            </VStack>
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

export { Avisos };