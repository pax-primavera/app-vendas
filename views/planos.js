import React, { useState, useEffect } from 'react';
import { Center, Box, Heading, VStack, useToast, HStack, ScrollView, Text } from "native-base";
import { web, light } from '../utils/styles/index';
import axiosAuth from '../utils/config/axios/private.js';
import { moedaMask } from "../utils/generic/format";
import ComponentSelect from '../components/form/select';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index'
import colors from '../utils/styles/colors';

function Planos() {
  const toast = useToast();

  const [carregamento, setCarregamento] = useState(true);
  const [carregamentoPlanos, setCarregamentoPlanos] = useState(false);

  const [planos, setPlanos] = useState([]);
  const [planosPets, setPlanosPets] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const carregarPlanoFilial = async (id) => {
    if (!id) {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar planos, filial não foi selecionada!`} />
        }
      });
    }

    setCarregamentoPlanos(true);

    try {
      const planosGet = await axiosAuth.get(`lista-planos/unidade-id=${id}`);

      if (planosGet && planosGet.data.planos) {
        setPlanos(planosGet.data.planos);
        setPlanosPets(planosGet.data.planosPets);
        setCarregamentoPlanos(false);
        return;
      }

      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Informações da filial não encontrada!`} />
        }
      });
    } catch (e) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      })
    }
  }

  const setup = async () => {
    try {
      const unidadesGET = await axiosAuth.get(`/lista-unidades-usuario`);

      if (unidadesGET && unidadesGET.data.unidades) {
        setUnidades(unidadesGET.data.unidades);
        setCarregamento(false);
        return;
      }

      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Informações da filial não encontrada!`} />
        }
      });
    } catch (e) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      });
    };
  }

  useEffect(() => {
    setup();
  }, []);

  return (
    <ScrollView h="100%">
      {
        carregamento ?
          <ComponentLoading mensagem="Carregando filial" />
          : <VStack m="2">
            <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Center w="100%">
                <Box safeArea w="100%" pl="5" pr="5" mb="6" >
                  <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1} >
                    Planos
                  </Heading>
                  <Heading mt="1" mb="3" fontWeight="medium" size="xs">
                    Selecione uma filial para 'VER' os planos disponiveis.
                  </Heading>

                  <HStack space={5} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <ComponentSelect
                        label="Filial"
                        function={carregarPlanoFilial}
                        placeholder='Selecione uma filial:'
                        array={unidades}
                        columnLabel="nome"
                        required
                      />
                    </Center>
                  </HStack>
                </Box>
              </Center>
            </Box>
            {
              carregamentoPlanos ?
                <ComponentLoading mensagem=" Carregando planos da filial" />
                :
                <>
                  {
                    planos.map((plano) => {
                      return (
                        <Box maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
                          _web={web} >
                          <VStack p="5" key={plano.nome}>
                            <Heading color={colors.COLORS.PAXCOLOR_1} fontSize="16" fontWeight="medium">
                              PLANO: {plano.nome}
                            </Heading>
                            <Text mt="3" fontWeight="medium">
                              - Valor Adesão: {moedaMask(plano.adesaoValor)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Adicional(Dependente): {moedaMask(plano.adicionalValor)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensal: {moedaMask(plano.mensalidadeValor)}
                            </Text>
                          </VStack>
                        </Box>
                      )
                    })
                  }
                  {
                    planosPets.map((plano) => {
                      return (
                        <Box maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
                          _web={web} >
                          <VStack p="5" key={plano.nome}>
                            <Heading color={colors.COLORS.PAXCOLOR_1} fontSize="16" fontWeight="medium">
                              Adicional Dependente PET
                            </Heading>
                            {/* Porte P */}
                            <Text mt="3" fontWeight="medium">
                              - Valor Adesão S/Resgate Porte('P'): {moedaMask(plano.adesaoValorP)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Adesão C/Resgate Porte('P'): {moedaMask(plano.adesaoValorResgateP)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade S/Resgate Porte('P'): {moedaMask(plano.mensalidadeValorP)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade C/Resgate Porte('P'): {moedaMask(plano.mensalidadeValorResgateP)}
                            </Text>
                            {/* Porte M */}
                            <Text mt="3" fontWeight="medium">
                              - Valor Adesão S/Resgate Porte('M'): {moedaMask(plano.adesaoValorM)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Adesão C/Resgate Porte('M'): {moedaMask(plano.adesaoValorResgateM)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade S/Resgate Porte('M'): {moedaMask(plano.mensalidadeValorM)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade C/Resgate Porte('M'): {moedaMask(plano.mensalidadeValorResgateM)}
                            </Text>
                            {/* Porte G */}
                            <Text mt="3" fontWeight="medium">
                              - Valor Adesão S/Resgate Porte('G'): {moedaMask(plano.adesaoValorG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Adesão C/Resgate Porte('G'): {moedaMask(plano.adesaoValorResgateG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade S/Resgate Porte('G'): {moedaMask(plano.mensalidadeValorG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade C/Resgate Porte('G'): {moedaMask(plano.mensalidadeValorResgateG)}
                            </Text>
                            {/* Porte GG */}
                            <Text mt="3" fontWeight="medium">
                              - Valor Adesão S/Resgate Porte('GG'): {moedaMask(plano.adesaoValorGG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Adesão C/Resgate Porte('GG'): {moedaMask(plano.adesaoValorResgateGG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade S/Resgate Porte('GG'): {moedaMask(plano.mensalidadeValorGG)}
                            </Text>
                            <Text fontWeight="medium">
                              - Valor Mensalidade C/Resgate Porte('GG'): {moedaMask(plano.mensalidadeValorResgateGG)}
                            </Text>
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

export { Planos };