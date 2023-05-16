import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { insertIdSQL, executarSQL } from '../services/database/index.js';
import colors from '../utils/styles/colors';
import axiosAuth from '../utils/config/axios/private.js';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import { styleInputFocus } from '../utils/styles/index';
import { fieldDatas } from '../utils/generic/field.mask'
import { dataMask, dataMaskEUA } from "../utils/generic/format";
import { Alert } from 'react-native';
import moment from 'moment';
import { useRoute } from '@react-navigation/native';

function ContratoContentInicial({ navigation }) {
  const toast = useToast();
  const route = useRoute();
  /// IDS, integers
  const [unidadeID, setUnidadeID] = useState(null);
  const [contratoID, setContratoID] = useState(null);
  /// Booleanos
  const [carregamentoTela, setCarregamentoTela] = useState(true);
  const [unidades, setUnidades] = useState([]);
  /// Fields
  const [dataContrato, setDataContrato] = useState(moment(new Date()).format('DD/MM/YYYY'));

  const changeInput = (labelValue, label) => {
    if (fieldDatas.includes(label)) return dataMask(labelValue);
    return labelValue;
  }

  const setup = async () => {
    executarSQL(`select id,descricao from unidade`).then((response) => {
      setUnidades(response._array)
    }), () => {
      Alert.alert('Erro ao executar SQL', sqlError.toString());
    }
    setCarregamentoTela(false);
  }

  const PROSSEGUIR = async () => {
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
            if (!unidadeID) {
              Alert.alert("Aviso.", "Filial não selecionada!");
              return;
            }

            var regiao = await executarSQL(`select regiao from unidade where id = ${unidadeID}`);

            if (regiao._array[0].regiao == 1 && route.params.pet == true) {
              Alert.alert("Aviso.", "Filial não permitida para adicionar PET!");
              return;
            } else if (regiao._array[0].regiao == 3 && route.params.pet == true) {
              Alert.alert("Aviso.", "Filial não permitida para adicionar PET!");
              return;
            }

            if (!dataContrato) {
              Alert.alert("Aviso.", "Data de contrato é obrigatório!");
              return;
            }

            if (dataMaskEUA(dataContrato) == 'Invalid date') {
              Alert.alert("Aviso.", "Data de contrato inválida!");
              return;
            }

            if (dataMaskEUA(dataContrato) < dataMaskEUA(new Date())) {
              Alert.alert("Aviso.", "Data de contrato inválida, não pode ser MENOR que a data atual!");
              return;
            }

            if (dataMaskEUA(dataContrato) > dataMaskEUA(new Date())) {
              Alert.alert("Aviso.", "Data de contrato inválida, não pode ser MAIOR que a data atual!");
              return;
            }

            const novoContrato = await insertIdSQL(`INSERT INTO titular (is_enviado, dataContrato) VALUES (0, '${dataContrato}');`);

            if (!novoContrato) {
              return toast.show({
                placement: "top",
                render: () => {
                  return <ComponentToast message="Não foi possivel criar novo contrato!" />
                }
              });
            }

            setContratoID(novoContrato);

            if (route.params.pet == true) {
              return navigation.navigate("contratoContentTitularAdicionalPET", { contratoID: novoContrato, unidadeID: unidadeID });
            } else if (route.params.hum == true) {
              return navigation.navigate("contratoContentTitularAdicional", { contratoID: novoContrato, unidadeID: unidadeID, hum: true });
            } else if (route.params.plano == true) {
              return navigation.navigate("ContratoContentTitularVencimento", { contratoID: novoContrato, unidadeID: unidadeID });
            } else {
              return navigation.navigate("contratoContentTitular", { contratoID: novoContrato, unidadeID: unidadeID });
            }
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
          : <VStack m="2">
            <Box key="1" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>
                Dados Iniciais
              </Heading>
              <Heading mt="2" mb="4" fontWeight="medium" size="xs">
                Selecione uma 'FILIAL' e preecha data de contrato:
              </Heading>
              <HStack space={2} justifyContent="center">
                <Center w="100%" rounded="md">
                  <FormControl isRequired >
                    <FormControl.Label>Data de Contrato:</FormControl.Label>
                    <Input
                      keyboardType='numeric'
                      placeholder='Digite a data de contrato:'
                      value={dataContrato}
                      onChangeText={(e) => setDataContrato(changeInput(e, 'dataContrato'))}
                      _focus={styleInputFocus}
                    />
                  </FormControl>
                </Center>
              </HStack>
              <HStack space={2} justifyContent="center">
                <Center w="100%" rounded="md">
                  <FormControl isRequired>
                    <FormControl.Label>Filial:</FormControl.Label>
                    <Select
                      _focus={styleInputFocus}
                      selectedValue={unidadeID}
                      onValueChange={value => setUnidadeID(value)}
                      accessibilityLabel="Selecione uma filial:"
                      placeholder="Selecione uma filial:"
                    >
                      {unidades.map((item) => <Select.Item
                        key={item['descricao']}
                        label={item['descricao']}
                        value={item.id} />
                      )}
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
                onPress={PROSSEGUIR}
              >
                PROSSEGUIR
              </Button>
            </Box>
          </VStack>
      }

    </ScrollView>
  );
}

export { ContratoContentInicial };
