import React, { useState, useEffect } from 'react';
import { cpfMask } from "../utils/generic/format";
import { fieldCPF } from '../utils/generic/field.mask';
import { executarSQL } from '../services/database/index.js';
import { styleInputFocus, styleButton, styleButtonText, web, light, container } from '../utils/styles/index.js';
import api from '../utils/config/axios/public.js';
import { Box, VStack, FormControl, Button, Input, Heading, useToast, Image, Center, HStack, Text } from "native-base";
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
  const [isNet, setIsNet] = React.useState(false);
  /// Fields
  const [cpf, setCpf] = useState(null);
  const [senha, setSenha] = useState(null);

  const verificarSessao = async () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        /// Liberar acesso
        setIsNet(state.isConnected);

        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Conexão estabelecida" message={`Você está conectado na rede ${state.type}.`} />
          }
        });
      }

      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="Conexão não estabelecida" message="Desculpe, não foi possivel conectar a uma internet." />
        }
      });
    });

    const logado = await executarSQL(`select * from login`);

    if (logado._array && logado._array.length > 0 && isNet) {
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
          return <ComponentToast title="Aviso." message="Campo obrigatório, digite um 'CPF'" />
        }
      });
    }

    if (!senha) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="Aviso." message="Campo obrigatório, digite uma 'Senha'" />
        }
      });
    }

    setCarregamento(true);

    try {
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
    } catch (err) {
      if (err.response.data && err.response.data.mensagem) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Aviso." message={err.response.data.mensagem} />
          }
        });
      } else {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Aviso." message="Não foi possivel efetuar login! Usuário não encontrado." />
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
    verificarSessao();
  }, []);

  return (
    <VStack m="8" style={container}>
      {
        !isNet ?
          <ComponentLoading mensagem="Verificando internet, aguarde." /> :
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
                <Input isDisabled={carregamento || !isNet} keyboardType='numeric' value={cpf} onChangeText={e => setCpf(changeInput(e, 'cpf'))} _focus={styleInputFocus} placeholder='Digite seu CPF:' />
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>SENHA:</FormControl.Label>
                <Input isDisabled={carregamento || !isNet} type="password" value={senha} onChangeText={e => setSenha(changeInput(e, 'senha'))} _focus={styleInputFocus} placeholder='Digite sua senha:' />
              </FormControl>
              <Button
                mt="2"
                mb="2"
                size="lg"
                isLoading={carregamento}
                isDisabled={!isNet}
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
      }
    </VStack>
  );
}

export { Login };
