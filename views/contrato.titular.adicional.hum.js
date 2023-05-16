import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { insertIdSQL, executarSQL, executarListIDSQL } from '../services/database/index.js';
import colors from '../utils/styles/colors';
import { styleInputFocus } from '../utils/styles/index';
import { fieldDatas, fieldCPF, fieldCEPS, fieldTelefones } from '../utils/generic/field.mask';
import { cpfMask, dataMask, cepMask, foneMask, dataMaskEUA, isBoolean, validarCPF, validarEmail } from "../utils/generic/format";
import { Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ComponentLoading from '../components/views/loading/index';

function ContratoContentTitularAdicional({ navigation }) {
  const route = useRoute();
  const toast = useToast();
  /// IDS, integers
  const [data, setData] = useState([]);
  const { contratoID, unidadeID, id, hum } = route.params;
  const [carregamentoTela, setCarregamentoTela] = useState(true);
  /// Fields
  const [planos, setPlanos] = useState([]);
  const [numContrato, setNumContrato] = useState(null);
  const [nomeTitular, setNomeTitular] = useState(null),
    [cpfTitular, setCpfTitular] = useState(null),
    [rgTitular, setRGTitular] = useState(null),
    [dataNascTitular, setDataNascTitular] = useState(null),
    [email1, setEmail1] = useState(null),
    [telefone1, setTelefone1] = useState(null),
    [plano, setPlano] = useState(null);

  const changeInput = (labelValue, label) => {
    if (fieldCPF.includes(label)) return cpfMask(labelValue);
    if (fieldDatas.includes(label)) return dataMask(labelValue);
    if (fieldCEPS.includes(label)) return cepMask(labelValue);
    if (fieldTelefones.includes(label)) return foneMask(labelValue);
    if (typeof labelValue == 'string' && (label != 'email1' && label != 'email2')) {
      return labelValue.toUpperCase();
    } else {
      return labelValue;
    }
  }

  const setup = async () => {
    setCarregamentoTela(true);
    executarSQL(`select id,descricao from plano where unidadeId = ${unidadeID}`).then((response) => {
      setPlanos(response._array)
    }), () => {
      Alert.alert('Erro ao executar SQL', sqlError.toString());
    }
    if (id == null) {
      setCarregamentoTela(false);
    } else {
      await executarListIDSQL(id).then((response) => {
        setData(response._array[0])
        setNomeTitular(response._array[0].nomeTitular);
        setCpfTitular(response._array[0].cpfTitular);
        setRGTitular(response._array[0].rgTitular);
        setDataNascTitular(response._array[0].dataNascTitular);
        setEmail1(response._array[0].email1);
        setTelefone1(response._array[0].telefone1);
        setNumContrato(response._array[0].numContratoAntigo)
        setPlano(Number(response._array[0].plano));
        setCarregamentoTela(false);
      }), () => {
        Alert.alert('Erro ao executar SQL', sqlError.toString());
        setCarregamentoTela(false);
      }
    }

  }

  const PROSSEGUIR = async (id) => {
    Alert.alert(
      "Aviso.",
      "Deseja PROSSEGUIR para proxima 'ETAPA'? Verifique os dados só por garantia!",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {

            if (!nomeTitular) {
              Alert.alert("Aviso.", "Nome e Sobrenome é obrigatório!!");
              return;
            }

            if (!cpfTitular) {
              Alert.alert("Aviso.", "CPF é obrigatório!!");
              return;
            }

            if (!validarCPF(cpfTitular)) {
              Alert.alert("Aviso.", "CPF inválido!");
              return;
            }

            if (!rgTitular) {
              Alert.alert("Aviso.", "RG é obrigatório!");
              return;
            }

            if (!numContrato) {
              Alert.alert("Aviso.", "Informe o número do contrato atual!");
              return;
            }

            if (!plano) {
              Alert.alert("Aviso.", "Informar o plano atual é obrigatório!!");
              return;
            }

            if (id != null) {
              await executarSQL(`
                            UPDATE titular
                            SET 
                            nomeTitular = '${nomeTitular}',
                            cpfTitular = '${cpfTitular}',
                            rgTitular = '${rgTitular}',
                            dataNascTitular = '${dataNascTitular}',
                            email1 = '${email1}',
                            telefone1 = '${telefone1}',
                            numContratoAntigo = '${numContrato}',
                            plano = '${plano}',
                            tipo = 'ADICIONAL PAX'
                            WHERE id = ${id}`);
            } else {
              await executarSQL(`
                            UPDATE titular
                            SET
                            nomeTitular = '${nomeTitular}',
                            cpfTitular = '${cpfTitular}',
                            rgTitular = '${rgTitular}',
                            dataNascTitular = '${dataNascTitular}',
                            email1 = '${email1}',
                            telefone1 = '${telefone1}',
                            tipo = 'ADICIONAL PAX',
                            plano = '${plano}',
                            numContratoAntigo = '${numContrato}',
                            unidadeId = ${unidadeID}
                            WHERE id = ${contratoID}`
              );
            }

            return navigation.navigate("ContratoAdicionalHum", { id: id, contratoID, unidadeID, hum });
          }
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
        carregamentoTela
          ?
          <ComponentLoading mensagem="Carregando informações" />
          :
          <VStack m="2">
            <Box key="1" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              {/* Informações iniciais */}
              <Heading mt="2" size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                Titular
              </Heading>
              <Heading mt="1" fontWeight="medium" size="xs">
                Informe todas as informações corretamente!
              </Heading>
              <HStack space={2} justifyContent="center">
                <Center w="100%" rounded="md">
                  <FormControl isRequired >
                    <FormControl.Label>Nome Completo:</FormControl.Label>
                    <Input
                      placeholder='Digite o nome completo:'
                      value={nomeTitular}
                      onChangeText={(e) => setNomeTitular(changeInput(e, 'nomeTitular').toUpperCase())}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
              </HStack>
              <HStack space={2} justifyContent="center">
                <Center w="50%" rounded="md">
                  <FormControl isRequired >
                    <FormControl.Label>CPF:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Digite o CPF:'
                      value={cpfTitular}
                      onChangeText={(e) => setCpfTitular(changeInput(e, 'cpfTitular'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
                <Center w="50%" rounded="md">
                  <FormControl isRequired >
                    <FormControl.Label>RG:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Digite o RG:'
                      value={rgTitular}
                      onChangeText={(e) => setRGTitular(changeInput(e, 'rgTitular'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
              </HStack>
              <HStack space={2} justifyContent="center">
                <Center w="50%" rounded="md">
                  <FormControl isRequired>
                    <FormControl.Label>Email:</FormControl.Label>
                    <Input
                      placeholder='Digite um Email:'
                      value={email1}
                      onChangeText={(e) => setEmail1(changeInput(e, 'email1'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
                <Center w="50%" rounded="md">
                  <FormControl isRequired>
                    <FormControl.Label>Telefone:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Digite um número de telefone:'
                      value={telefone1}
                      onChangeText={(e) => setTelefone1(changeInput(e, 'telefone1'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
              </HStack>
              <HStack space={2} justifyContent="center">
                <Center w="50%" rounded="md">
                  <FormControl isRequired>
                    <FormControl.Label>Número do contrato:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Número do contrato:'
                      value={numContrato}
                      onChangeText={(e) => setNumContrato(changeInput(e, 'numContrato'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
                <Center w="50%" rounded="md">
                  <FormControl isRequired >
                    <FormControl.Label>Data de Nascimento:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Digite a data de nascimento:'
                      value={dataNascTitular}
                      onChangeText={(e) => setDataNascTitular(changeInput(e, 'dataNascTitular'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
              </HStack>
              <HStack mb="1" space={1} justifyContent="center">
                <Center w="100%" rounded="md">
                  <FormControl isRequired>
                    <FormControl.Label>Planos Atual:</FormControl.Label>
                    <Select
                      _focus={styleInputFocus}
                      selectedValue={plano}
                      onValueChange={(e) =>
                        setPlano(changeInput(e, 'plano'))
                      }
                      accessibilityLabel="Plano:"
                      placeholder="Plano:"
                    >
                      {planos.map((item) => (
                        <Select.Item
                          key={item.id}
                          label={item["descricao"].toUpperCase()}
                          value={item.id}
                        />
                      ))}
                    </Select>
                  </FormControl>
                </Center>
              </HStack>
              <Button
                mt="6"
                mb="4"
                size="lg"
                _text={styleButtonText}
                _light={styleButton}
                onPress={() => { PROSSEGUIR(data.id) }}
              >
                PROSSEGUIR
              </Button>
            </Box>
          </VStack>
      }

    </ScrollView>
  );
}

export { ContratoContentTitularAdicional };
