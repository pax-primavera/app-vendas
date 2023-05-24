import React, { useState, useEffect } from 'react';
import { Icon, Center, Button, Box, Heading, VStack, HStack, ScrollView, Text, Pressable, Container, useToast } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonDeletar } from '../utils/styles/index';
import colors from '../utils/styles/colors';
import { useRoute } from '@react-navigation/native';
import { executarSQL, executarListSQL } from '../services/database/index';
import ComponentLoading from '../components/views/loading/index';
import { Alert } from 'react-native';
import { textCenter } from '../utils/styles/index';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ComponentToast from '../components/views/toast/index';
import api from "../utils/config/axios/public.js";

function VendasPendentes({ navigation }) {
  const toast = useToast();
  const route = useRoute();
  const [carregamento, setCarregamento] = useState(true);
  const [carregamentoVendas, setCarregamentoVendas] = useState(true);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  const [carregamentoButtonDeletar, setCarregamentoButtonDeletar] = useState(true);
  const [data, setData] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const setup = async () => {
    setCarregamentoVendas(true);
    filiais();
    executarListSQL().then(async (response) => {
      setData(response._array)
      //limpaContrato()
    }), () => {
      Alert.alert('Erro ao executar SQL', sqlError.toString());
    }
    setCarregamento(false);
    setCarregamentoVendas(false);
    setCarregamentoButton(false);
  }

  const filiais = async () => {

    executarSQL(`select id,descricao from unidade`).then((response) => {
      setUnidades(response._array)
    }), () => {
      Alert.alert('Erro ao executar SQL', sqlError.toString());
    }
  }

  const limpaContrato = async () => {
    setCarregamentoVendas(true)

    await executarSQL(`
          DELETE from titular WHERE cpftitular is null`
    );

    //await executarSQL(`DELETE from dependente WHERE titular_id not exists(select id from titular)`)

    setCarregamentoVendas(false);
  }

  const deletePendente = async (id) => {
    Alert.alert(
      "Atenção!",
      "Deseja realmente APAGAR este contrato?",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            setCarregamento(true);
            setCarregamentoVendas(true);
            await executarSQL(`
        DELETE from dependente WHERE titular_id = ${id}`
            );
            await executarSQL(`
        DELETE from titular WHERE id = ${id}`
            );
            setCarregamento(false);
            setCarregamentoVendas(false);
            setup();
          },
        },
      ],
      { cancelable: false }
    );

  }

  const deleteVendas = async (id) => {
    Alert.alert(
      "Atenção!",
      "Deseja realmente APAGAR todos os contratos?",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            setCarregamento(true);
            setCarregamentoVendas(true);
            await executarSQL(`
                    DELETE from dependente`
            );
            await executarSQL(`
                    DELETE from titular`
            );
            setCarregamento(false);
            setCarregamentoVendas(false);
            setup();
          },
        },
      ],
      { cancelable: false }
    );

  }

  const finalizar = async (id, tipo, status) => {
    Alert.alert(
      "Aviso.",
      "Deseja EDITAR este contrato finalizado'?",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            if (tipo == 'ADICIONAL PET' || tipo == 'EXCLUSÃO PET') {
              return navigation.navigate("ContratoInicialAdicionalPET", { id, status });
            } else if (tipo == 'ADICIONAL PAX' || tipo == 'EXCLUSÃO PAX') {
              return navigation.navigate("ContratoInicialAdicionalHum", { id, hum: true, status });
            } else if (tipo == 'ALTERAÇÃO DE DATA DE VENCIMENTO') {
              return navigation.navigate("ContratoInicialVencimento", { id, status });
            } else {
              return navigation.navigate("ContratoInicialOff", { id, status });
            }

          },
        },
      ],
      { cancelable: false }
    );
  }

  const sincronismo = async (id) => {
    try {
      setCarregamentoVendas(true);

      if (!isFinite(id)) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Atenção!" message={"Identificador inválido"} />;
          },
        });
        setCarregamentoVendas(false);
        return;
      }

      const logado = await executarSQL(`select * from login`);

      if (!logado || logado._array[0].nome == null || logado._array[0].token == null) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Atenção!" message={"Token Expirado! Logue novamente"} />;
          },
        });
        setCarregamentoVendas(false);
        return;
      }

      const contrato = await executarSQL(`select id,
        envioToken ,
        dataContrato,
        nomeTitular,
        rgTitular,
        cpfTitular,
        dataNascTitular,
        estadoCivilTitular,
        nacionalidadeTitular,
        naturalidadeTitular,
        religiaoTitular ,
        email1,
        email2,
        telefone1,
        telefone2,
        sexoTitular,
        isCremado,
        profissaoTitular,
        tipoLogradouroResidencial,
        nomeLogradouroResidencial,
        numeroResidencial,
        quadraResidencial,
        loteResidencial,
        complementoResidencial,
        bairroResidencial,
        cepResidencial,
        cidadeResidencial,
        estadoResidencial,
        tipoLogradouroCobranca,
        nomeLogradouroCobranca,
        numeroCobranca,
        quadraCobranca,
        loteCobranca,
        complementoCobranca,
        bairroCobranca,
        cepCobranca,
        cidadeCobranca,
        estadoCobranca,
        plano,
        enderecoCobrancaIgualResidencial,
        localCobranca,
        tipo,
        empresaAntiga,
        numContratoAntigo,
        dataContratoAntigo,
        diaVencimento,
        dataPrimeiraMensalidade,
        melhorHorario,
        melhorDia,
        is_enviado,
        dataVencimentoAtual,
        dataVencimento,
        status,
        unidadeId, '${logado._array[0].nome}' as "createBy" from titular where status = 1 and id = ${id}`);

      if (contrato._array.length <= 0) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Atenção!" message={"Nenhum contrato localizado"} />;
          },
        });
        setCarregamentoVendas(false);
        return;
      }



      const dependentes = await executarSQL(`select * from dependente where titular_id = ${id}`);
      const contratoBody = new FormData();
      contratoBody.append("contrato", JSON.stringify(contrato._array[0]));
      contratoBody.append("dependente", dependentes._array.length > 0 ? JSON.stringify(dependentes._array) : JSON.stringify([]));

      const headers = {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${logado._array[0].token}`
      };

      const result = await api.post(`/api/venda/sincronismo`, contratoBody, { headers });

      if (result.status === 201 && result.data.status === true) {
        const anexoBody8 = new FormData();
        const anexoBody1 = new FormData();
        const anexoBody2 = new FormData();
        const anexoBody3 = new FormData();
        const anexoBody4 = new FormData();
        const anexoBody5 = new FormData();
        const anexoBody6 = new FormData();
        const anexoBody7 = new FormData();

        let contratoAnexo = await executarSQL(`select ${result.data.novoId} as id, anexo1,  anexo2 ,  anexo3, anexo4, anexo5, anexo6, anexo7, anexo8 from titular where id = ${id}`);

        anexoBody8.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo8: contratoAnexo._array[0].anexo8 }))
        anexoBody1.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo1: contratoAnexo._array[0].anexo1 }))

        anexoBody2.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo2: contratoAnexo._array[0].anexo2 }))
        anexoBody3.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo3: contratoAnexo._array[0].anexo3 }))
        anexoBody4.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo4: contratoAnexo._array[0].anexo4 }))
        anexoBody5.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo5: contratoAnexo._array[0].anexo5 }))
        anexoBody6.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo6: contratoAnexo._array[0].anexo6 }))
        anexoBody7.append("contrato", JSON.stringify({ id: contratoAnexo._array[0].id, anexo7: contratoAnexo._array[0].anexo7 }))
        await api.post(`/api/venda/sincronismoanexo`, anexoBody8, { headers }).then(async () => {

          await api.post(`/api/venda/sincronismoanexo`, anexoBody1, { headers }).then(async () => {
            await api.post(`/api/venda/sincronismoanexo`, anexoBody2, { headers }).then(async () => {
              await api.post(`/api/venda/sincronismoanexo`, anexoBody3, { headers }).then(async () => {
                await api.post(`/api/venda/sincronismoanexo`, anexoBody4, { headers }).then(async () => {
                  await api.post(`/api/venda/sincronismoanexo`, anexoBody5, { headers }).then(async () => {
                    await api.post(`/api/venda/sincronismoanexo`, anexoBody6, { headers }).then(async () => {
                      await api.post(`/api/venda/sincronismoanexo`, anexoBody7, { headers }).then(async () => {
                        await executarSQL(`DELETE from dependente where titular_id = ${result.data.id}`);
                        await executarSQL(`DELETE from titular WHERE id = ${result.data.id}`);
                      }).catch((err) => {
                        alert(err)
                      });
                    }).catch((err) => {
                      alert(err)
                    });
                  }).catch((err) => {
                    alert(err)
                  });
                }).catch((err) => {
                  alert(err)
                });
              }).catch((err) => {
                alert(err)
              });
            }).catch((err) => {
              alert(err)
            });
          }).catch((err) => {
            alert(err)
          });
        }).catch((err) => {
          alert(err)
        });

        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Sucesso!" message={"Contrato enviado com sucesso!"} />;
          },
        });
        setCarregamentoVendas(false);
        setup();
      } else if (result.data.status === false) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Falha!" message={"Não foi possível enviar este contrato!"} />;
          },
        });
        setCarregamentoVendas(false);
        setup();
      } else if (result.data.status === false) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Falha!" message={"Não foi possível enviar este contrato!"} />;
          },
        });
        setCarregamentoVendas(false);
        setup();
      } else if (result.data.status === false) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Falha!" message={"Não foi possível enviar este contrato!"} />;
          },
        });
        setCarregamentoVendas(false);
        setup();
      }
    } catch (error) {
      setCarregamentoVendas(false);
      if (error.response && error.response.status === 401) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Atenção!" message={"Token Expirado! Logue novamente"} />;
          },
        });
      }
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`Não foi possível enviar os contratos, contate o suporte: ${error.toString()}`} />;
        },
      });
    }
  };

  const sincronizar = (id) => {
    Alert.alert(
      "Aviso.",
      "Deseja 'Sincronizar este contrato'?",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: () => {
            sincronismo(id)
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
          <ComponentLoading mensagem="Carregando Vendas Concluidas ou Pendentes" />
          : <VStack m="2">
            <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="10" >
                <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                  Vendas Concluídas e Pendentes
                </Heading>
                <Heading mt="3" mb="3" fontWeight="medium" size="xs">
                  Selecione uma venda para '<Text color={colors.COLORS.PAXCOLOR_1}>'ALTERAR'</Text> os dados.
                </Heading>
                <Text mt="1" fontWeight="medium" style={textCenter}>
                  <Text color={colors.COLORS.PAXCOLOR_1}>'ATENÇÃO'</Text> - Ao excluir um contrato não é possivel recuperar.
                </Text>
                <Button
                  size="lg"
                  _text={styleButtonText}
                  //isLoading={carregamentoButton}
                  isLoadingText="Apagando"
                  _light={styleButtonDeletar}
                  onPress={() => { deleteVendas() }}
                >
                  DELETAR TUDO
                </Button>
              </Box>
            </Box>
            {
              carregamentoVendas ?
                <ComponentLoading mensagem=" Carregando vendas" />
                :
                <>
                  {
                    data.map((data) => {
                      const result = unidades.find(tipo => tipo.id === data.unidadeId);
                      return (
                        <Box key={data.id} maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
                        >
                          <VStack p="1">
                            <Container w="100%" ml="5">
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
                              <Text mt="3" fontWeight="medium">
                                Tipo: {data.tipo}
                              </Text>
                              {data.status == 1 ? (
                                <>
                                  <Text mt="3" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                                    Status: Finalizado
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text mt="3" fontWeight="medium" color="red.600">
                                    Status: Incompleto
                                  </Text>
                                </>
                              )}
                              <VStack p="2"></VStack>
                            </Container>
                            <HStack space={1} justifyContent="center">
                              <Center mt="5" ml="5" mr="5">
                                <HStack space={2} justifyContent="center">
                                  <Pressable onPress={() => { finalizar(data.id, data.tipo, data.status) }} w="33%" bg="white" rounded="md" shadow={1}>
                                    <Center h="60">
                                      <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Editar
                                      </Heading>
                                      <Icon as={MaterialCommunityIcons} size="10" name="file-document-edit-outline" color={colors.COLORS.PAXCOLOR_1} />
                                    </Center>
                                  </Pressable>
                                  <Pressable onPress={() => { deletePendente(data.id) }} w="33%" bg="white" rounded="md" shadow={3}>
                                    <Center h="60">
                                      <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                        Apagar
                                      </Heading>
                                      <Icon as={MaterialCommunityIcons} size="10" name="delete" color="red.800" />
                                    </Center>
                                  </Pressable>
                                  {data.status == 1 ? (
                                    <>
                                      <Pressable onPress={() => { sincronizar(data.id) }} w="33%" bg="white" rounded="md" shadow={3}>
                                        <Center h="60">
                                          <Heading size="sm" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                                            Sincronizar
                                          </Heading>
                                          <Icon as={MaterialCommunityIcons} size="10" name="database-refresh" color={colors.COLORS.PAXCOLOR_1} />
                                        </Center>
                                      </Pressable>
                                    </>
                                  ) : (
                                    <></>
                                  )}
                                </HStack>
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

export { VendasPendentes };