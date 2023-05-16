import React, { Component, useState, useEffect } from "react";
import { cpfMask } from "../utils/generic/format";
import { fieldCPF } from "../utils/generic/field.mask";
import { executarSQL } from "../services/database/index.js";
import {
  styleInputFocus,
  styleButton,
  styleButtonText,
  web,
  light,
  container,
} from "../utils/styles/index.js";
import api from "../utils/config/axios/public.js";
import {
  Box,
  VStack,
  FormControl,
  Button,
  Input,
  Heading,
  useToast,
  Image,
  Center,
  HStack,
  Text,
  Collapse,
  Alert,
  Icon,
} from "native-base";
import imagens from "../utils/generic/imagens.js";
import colors from "../utils/styles/colors.js";
import NetInfo from "@react-native-community/netinfo";
import ComponentLoading from "../components/views/loading/index";
import axiosAuth from "../utils/config/axios/private.js";
import ComponentToast from "../components/views/toast/index";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from 'moment';

const pkg = require("../package.json");

const Login = ({ navigation }) => {
  const toast = useToast();
  /// Booleanos
  const [carregamento, setCarregamento] = useState(false);
  const [carregamentoIsNet, setCarregamentoIsNet] = useState(false);
  const [isNet, setIsNet] = React.useState(false);
  /// Fields
  const [cpf, setCpf] = useState(null);
  const [senha, setSenha] = useState(null);

  const verificarInternet = async () => {

    NetInfo.refresh().then(async (state) => {
      if (state.isConnected) {
        //verificarSessao();
        /// Parar carregamento
        // setCarregamentoIsNet(false);
        /// Liberar acesso, caso tenha internet
        setIsNet(state.isConnected);
        if (cpf && senha) {

          verificarSessao(true)
        }
        return toast.show({
          placement: "top",
          render: () => {
            return (
              <ComponentToast
                message={`${state.type.toUpperCase()} - Conexão estabelecida com sucesso.`}
              />
            );
          },
        });
      } else {
        setIsNet(false);
        if (cpf && senha) {
          verificarSessao(false)
        }
      }
      /// Destroir sessão
      //await executarSQL(`delete from login`);
      /// Parar carregamento
      // setCarregamentoIsNet(false);
    });
  };

  const verificarSessao = async (net) => {
    const logado = await executarSQL(`select * from login`);
    if (logado._array && logado._array.length > 0 && !net) {
      setTimeout(() => {
        /// Limpar campos
        setCpf(null);
        setSenha(null);
        setCarregamento(false)
        /// Redirecionar pata tela principal
        return navigation.navigate("Home");
      }, 1000);
    } else {
      logar(net)
      // toast.show({
      //   placement: "top",
      //   render: () => {
      //     return (
      //       <ComponentToast message="Não foi possivel efetuar login! Usuário não encontrado no banco." />
      //     );
      //   },
      // });
      // setCarregamento(false);
    }
  };

  const registrarSessao = async (object) => {
    executarSQL(`delete from login`);
    executarSQL(`delete from especie`);
    executarSQL(`delete from adicional`);
    executarSQL(`delete from plano`);
    executarSQL(`delete from parentesco`);
    executarSQL(`delete from raca`);
    executarSQL(`delete from unidade`);
    console.log("Tabelas limpas");

    var sincronismo = moment(new Date()).format('DD/MM/YYYY')

    try {
      //cria o usuario local caso não tenha
      executarSQL(
        `insert into login(id, cpf, nome, token, senha, sincronismo) values (${object.usuario.id}, '${cpf}','${object.usuario.nome}','${object.token}', '${senha}', '${sincronismo}')`
      );
      //insere os dados da especie pet
      object.usuario.especie.map((item) => {
        executarSQL(
          `insert into especie(id, descricao) values (${item.especieId}, '${item.descricao}')`
        );
      });
      //insere os dados da raça pet
      object.usuario.raca.map((item) => {
        executarSQL(
          `insert into raca(id, descricao) values (${item.racaId}, '${item.descricao}')`
        );
      });
      //insere os dados da unidade
      object.usuario.unidades.map((item) => {
        item.plano.map((itemPlano) => {
          executarSQL(
            `INSERT INTO plano (id, descricao, valorAdesao, valorMensalidade, valorAdicional, carenciaNovo, valorAdesaoTransferencia, limiteDependente,  unidadeId) values (${itemPlano.planoId}, '${itemPlano.descricao}', ${itemPlano.valorAdesao}, ${itemPlano.valorMensalidade},${itemPlano.valorAdicional}, ${itemPlano.carenciaNovo} ,${itemPlano.valorAdesaoTransferencia} ,${itemPlano.limiteDependente},${item.id})`
          );
          // UPDATE plano SET valorAdesao = ${itemPlano.valorAdesao}, valorMensalidade = ${itemPlano.valorMensalidade}, carenciaNovo = ${itemPlano.carenciaNovo}, unidadeId= ${item.id} WHERE id = ${itemPlano.planoId}
        });
        item.parentesco.map((itemParentesco) => {
          executarSQL(
            `INSERT INTO parentesco (id, descricao, adicional, unidadeId) values (${itemParentesco.parentescoId}, '${itemParentesco.descricao}', ${itemParentesco.adicional}, ${item.id})
            `
          );
          // UPDATE parentesco SET adicional = ${itemParentesco.adicional}, unidadeId= ${item.id} WHERE id = ${itemParentesco.parentescoId}
        });
        item.adicional.map((itemAdicional) => {
          executarSQL(
            `INSERT INTO adicional (id, descricao, valorAdesao, valorMensalidade, pet, resgate, porte, carenciaNovo, unidadeId) values (${itemAdicional.adicionalId}, '${itemAdicional.descricao}', ${itemAdicional.valorAdesao}, ${itemAdicional.valorMensalidade}, ${itemAdicional.pet}, ${itemAdicional.resgate}, '${itemAdicional.porte}', ${itemAdicional.carenciaNovo}, ${item.id})`
          );
          // UPDATE adicional SET valorAdesao = ${itemAdicional.valorAdesao}, valorMensalidade = ${itemAdicional.valorMensalidade}, pet = ${itemAdicional.pet}, resgate = ${itemAdicional.resgate}, porte = '${itemAdicional.porte}', carenciaNovo = ${itemAdicional.carenciaNovo}, unidadeId= ${item.id} WHERE id = ${itemAdicional.adicionalId}
        });
        executarSQL(
          `insert into unidade(id, descricao, cnpj, razaoSocial, telefone, numero, rua, bairro, municipio, uf, regiao) values (${item.id}, '${item.descricao}','${item.cnpj}','${item.razaosocial}','${item.telefone}','${item.numero}','${item.rua}','${item.bairro}','${item.municipio}','${item.uf}', '${item.regiao}')`
        );
      });

      console.log("Tabelas atualizadas!");
    } catch (e) {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`Erro ao atualizar tabelas`} />;
        },
      });
      setCarregamento(false);
    }
  };

  const logar = async (net) => {

    if (!cpf) {
      return toast.show({
        placement: "top",
        render: () => {
          return (
            <ComponentToast message="Campo obrigatório, digite um 'CPF'" />
          );
        },
      });
    }

    if (!senha) {
      return toast.show({
        placement: "top",
        render: () => {
          return (
            <ComponentToast message="Campo obrigatório, digite uma 'Senha'" />
          );
        },
      });
    }

    if (net == true) {
      setCarregamento(true);
      const response = await api.post("/api/venda/login", {
        cpf: cpf,
        senha,
      });

      if (!response.data.status) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message={response.data.message} />;
          },
        });
        setCarregamento(false);
      } else {
        registrarSessao(response.data);
        /// Iniciar sessão
        setTimeout(() => {
          /// Limpar campos
          setCpf(null);
          setSenha(null);
          setCarregamento(false)
          /// Redirecionar pata tela principal
          return navigation.navigate("Home");
        }, 1000);
      }
    } else {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`SEM INTERNET`} />;
        },
      });
    }
  };

  const changeInput = (labelValue, label) => {
    if (fieldCPF.includes(label)) return cpfMask(labelValue);
    return labelValue;
  };

  useEffect(() => {
    verificarInternet()
  }, []);

  return (
    <VStack m="8" style={container}>
      {carregamentoIsNet ? (
        <ComponentLoading mensagem="Verificando rede, aguarde." />
      ) : (
        <>
          {!isNet ? (
            <Box w="100%" maxW="100%" alignItems="center" m="2">
              <Collapse isOpen={!isNet}>
                <Alert status="error">
                  <VStack space={1} flexShrink={1} w="100%">
                    <HStack
                      flexShrink={1}
                      space={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <HStack flexShrink={1} space={2} alignItems="center">
                        <Alert.Icon />
                        <Text
                          fontSize="md"
                          fontWeight="medium"
                          _dark={{
                            color: "coolGray.800",
                          }}
                        >
                          Desculpe, não foi possivel conectar a internet,
                          verifique sua conexão.
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Alert>
              </Collapse>
            </Box>
          ) : (
            <></>
          )}
          <Box
            safeArea
            w="100%"
            pl="8"
            pr="8"
            maxW="100%"
            rounded="md"
            overflow="hidden"
            borderColor="coolGray.200"
            borderWidth="1"
            _light={light}
            _web={web}
          >
            <Center>
              <Image
                source={imagens.Logo}
                height="100"
                resizeMode="contain"
                alt="Logo"
              />
            </Center>
            <Heading
              mt="1"
              mb="2"
              fontWeight="medium"
              textAlign="center"
              fontSize="16"
            >
              Informe seu 'CPF' e 'Senha'
            </Heading>
            <VStack space={3} mt="2" mb="10">
              <FormControl isRequired>
                <FormControl.Label>CPF:</FormControl.Label>
                <Input
                  //isDisabled={carregamento || !isNet} 
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={(e) => setCpf(changeInput(e, "cpf"))}
                  _focus={styleInputFocus}
                  placeholder="Digite seu CPF:"
                />
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>SENHA:</FormControl.Label>
                <Input
                  //isDisabled={carregamento || !isNet} 
                  type="password"
                  value={senha}
                  onChangeText={(e) => setSenha(changeInput(e, "senha"))}
                  _focus={styleInputFocus}
                  placeholder="Digite sua senha:"
                />
              </FormControl>
              <Button
                mt="2"
                mb="2"
                size="lg"
                isLoading={carregamento}
                //isDisabled={!isNet}
                isLoadingText="Acessando"
                _text={styleButtonText}
                _light={styleButton}
                onPress={() => verificarInternet()}
              >ENTRAR
              </Button>

              <HStack mt="6" justifyContent="center">
                <Text fontSize="sm" color={colors.COLORS.PAXCOLOR_1}>
                  APPV.{pkg.version} (RELEASE)
                </Text>
              </HStack>
            </VStack>
          </Box>
        </>
      )}
    </VStack>
  );
};

export { Login };
