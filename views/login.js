import React, { useState, useEffect } from 'react';
import { cpfMask } from "../utils/generic/format.js";
import { executarSQL } from '../services/database/index.js';
import { styleInputFocus, styleButton, styleButtonText, web, light } from '../utils/styles/index.js';
import api from '../utils/config/axios/public.js';
import { Center, Box, VStack, FormControl, Button, Input, Heading, useToast } from "native-base";
import ComponentToast from '../components/views/toast/index';
import colors from '../utils/styles/colors';

const Login = ({ navigation }) => {
  const toast = useToast();

  const [cpf, setCpf] = useState(null);
  const [senha, setSenha] = useState(null);

  const [carregamento, setCarregamento] = useState(false);
  const [error, setError] = useState({ errorCPF: false, errorSenha: false });

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
    if (validateInputs()) {
      return toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Preencha os campos corretamente." />
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
      }, 500);
    } catch (err) {
      if (err.response.data && err.response.data.mensagem) {
        toast.show({
          placement: "bottom",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message={err.response.data.mensagem} />
          }
        });
      } else {
        toast.show({
          placement: "bottom",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Não foi possivel efetuar login! Usuário não encontrado." />
          }
        });
      }
      setCarregamento(false);
    }
  }

  const tratarCPF = (cpf) => {
    if (cpf === null || cpf === '') return setCpf(null);
    setCpf(cpfMask(cpf))
  }

  const validateInputs = () => {
    !cpf ? setError(prev => ({ ...prev, errorCPF: true })) : setError(prev => ({ ...prev, errorCPF: false }));
    !senha ? setError(prev => ({ ...prev, errorSenha: true })) : setError(prev => ({ ...prev, errorSenha: false }));
    return !cpf || !senha ? true : false;
  }

  const changeInput = (campo, value) => {
    // Validar campos
    validateInputs();

    if (campo === 'cpf') {
      return tratarCPF(value);
    }
    return setSenha(value);
  }

  useEffect(() => {
    verificarSessao();
  }, []);

  return (
    <VStack m="2">
      <Box maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
        _web={web}>
        <Center w="100%">
          <Box safeArea w="100%" pl="5" pr="5" mb="7" >
            <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
              Pax Vendedor
            </Heading>
            <Heading mt="1" fontWeight="medium" size="xs">
              Informe seu 'CPF' e 'Senha':
            </Heading>

            <VStack space={3} mt="2">
              <FormControl isInvalid={error.errorCPF} >
                <FormControl.Label>CPF:</FormControl.Label>
                <Input keyboardType='numeric' value={cpf} onChangeText={e => changeInput('cpf', e)} _focus={styleInputFocus} placeholder='Digite seu CPF:' />
              </FormControl>
              <FormControl isInvalid={error.errorSenha} >
                <FormControl.Label>Senha:</FormControl.Label>
                <Input type="password" value={senha} onChangeText={e => changeInput('senha', e)} _focus={styleInputFocus} placeholder='Digite sua senha:' />
              </FormControl>
              <Button mt="2"
                size="lg"
                isLoading={carregamento}
                _text={styleButtonText}
                _light={styleButton}
                onPress={() => logar()}
              >
                Entrar
              </Button>
            </VStack>
          </Box>
        </Center>
      </Box>
    </VStack>
  );
}

export { Login };
