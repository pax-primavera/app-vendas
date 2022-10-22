import React, { useState, useEffect } from 'react';
import { cpfMask } from "../utils/generic/format";
import { fieldCPF } from '../utils/generic/field.mask';
import { executarSQL } from '../services/database/index.js';
import { styleInputFocus, styleButton, styleButtonText, web, light, container } from '../utils/styles/index.js';
import api from '../utils/config/axios/public.js';
import { Box, VStack, FormControl, Button, Input, Heading, useToast, Image, Center, HStack, Text, Collapse, Alert } from "native-base";
import ComponentToast from '../components/views/toast/index';
import imagens from "../utils/generic/imagens.js";
import colors from '../utils/styles/colors.js';
import NetInfo from "@react-native-community/netinfo";
import ComponentLoading from '../components/views/loading/index';

const pkg = require("../package.json");

const Login = ({ navigation }) => {
  /// Config
  const toast = useToast();
  /// Booleanos
  const [carregamento, setCarregamento] = useState(false);
  const [carregamentoIsNet, setCarregamentoIsNet] = useState(true);
  const [isNet, setIsNet] = React.useState(false);
  /// Fields
  const [cpf, setCpf] = useState(null);
  const [senha, setSenha] = useState(null);

  const verificarInternet = async () => {
    NetInfo.refresh().then(async (state) => {
      if (state.isConnected) {
        /// Verificar sessão
        verificarSessao();
        /// Parar carregamento
        setCarregamentoIsNet(false);
        /// Liberar acesso, caso tenha internet
        setIsNet(state.isConnected);

        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message={`${state.type.toUpperCase()} - Conexão estabelecida com sucesso.`} />
          }
        });
      }
      /// Destroir sessão
      //await executarSQL(`delete from login`);
      /// Parar carregamento
      setCarregamentoIsNet(false);
    });
  }

  const verificarSessao = async () => {
    const logado = await executarSQL(`select * from login`);

    if (logado._array && logado._array.length > 0) {
      return navigation.navigate("Home");
    }
  }

  const registrarSessao = async (object) => {
    executarSQL(`delete from login`);

    executarSQL(
      `insert into login(id, usuario, token) values (0, '${object.usuario}', '${object.token}')`
    );
  }

  const logar = async () => {
    if (!cpf) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message="Campo obrigatório, digite um 'CPF'" />
        }
      });
    }

    if (!senha) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message="Campo obrigatório, digite uma 'Senha'" />
        }
      });
    }

    setCarregamento(true);

    try {
      await verificarInternet();
      if(!isNet){
        await executarSQL(`delete from login`);
        const response = await api.post('/login', { cpf, senha });
        
        /// Registrar sessão
        registrarSessao(response.data);
        /// Iniciar sessão
        setTimeout(() => {
          /// Limpar campos
          setCpf(null);
          setSenha(null);
          setCarregamento(false);
          /// Redirecionar pata tela principal
          return navigation.navigate("Home");
      }, 1000);
      }else{
        const logado = await executarSQL(`select * from login`);

        if (logado._array && logado._array.length > 0) {
          return navigation.navigate("Home");
        }
      }
      
    } catch (err) {
      if (err.response.data && err.response.data.mensagem) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message={err.response.data.mensagem} />
          }
        });
      } else {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast message="Não foi possivel efetuar login! Usuário não encontrado." />
          }
        });
      }
      setCarregamento(false);
    }
  }

  const changeInput = (labelValue, label) => {
    if (fieldCPF.includes(label)) return cpfMask(labelValue);
    return labelValue;
  }

  useEffect(() => {
    //verificarInternet();
  }, []);

  return (
    <VStack m="8" style={container}>
      {
        /*carregamentoIsNet ?
          <ComponentLoading mensagem="Verificando rede, aguarde." /> :
          <>
            {
              !isNet ? <Box w="100%" maxW="100%" alignItems="center" m="2">
                <Collapse isOpen={!isNet}>
                  <Alert status="error">
                    <VStack space={1} flexShrink={1} w="100%">
                      <HStack flexShrink={1} space={2} alignItems="center" justifyContent="space-between">
                        <HStack flexShrink={1} space={2} alignItems="center">
                          <Alert.Icon />
                          <Text fontSize="md" fontWeight="medium" _dark={{
                            color: "coolGray.800"
                          }}>
                            Desculpe, não foi possivel conectar a internet, verifique sua conexão.
                          </Text>
                        </HStack>
                      </HStack>
                    </VStack>
                  </Alert>
                </Collapse>
              </Box> : <></>
            }*/
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
                  resizeMode='contain'
                  alt='Logo'
                />
              </Center>
              <Heading mt="1" mb="2" fontWeight="medium" textAlign="center" fontSize="16">
                Informe seu 'CPF' e 'Senha'
              </Heading>
              <VStack space={3} mt="2" mb="10">
                <FormControl isRequired>
                  <FormControl.Label>CPF:</FormControl.Label>
                  <Input /*isDisabled={carregamento || !isNet} */keyboardType='numeric' value={cpf} onChangeText={e => setCpf(changeInput(e, 'cpf'))} _focus={styleInputFocus} placeholder='Digite seu CPF:' />
                </FormControl>
                <FormControl isRequired>
                  <FormControl.Label>SENHA:</FormControl.Label>
                  <Input /*isDisabled={carregamento || !isNet} */type="password" value={senha} onChangeText={e => setSenha(changeInput(e, 'senha'))} _focus={styleInputFocus} placeholder='Digite sua senha:' />
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
                  onPress={() => logar()}
                >
                  ENTRAR
                </Button>

                <HStack mt="6" justifyContent="center">
                  <Text fontSize="sm" color={colors.COLORS.PAXCOLOR_1}>
                    APPV.{pkg.version} ({pkg.api})
                  </Text>
                </HStack>
              </VStack>
            </Box>
          //</>
      }
    </VStack>
  );
}

export { Login };
