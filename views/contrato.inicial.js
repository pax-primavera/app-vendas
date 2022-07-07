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

function ContratoContentInicial({ navigation }) {
  const toast = useToast();
  /// IDS, integers
  const [unidadeID, setUnidadeID] = useState(null);
  const [contratoID, setContratoID] = useState(null);
  /// Booleanos
  const [carregamentoTela, setCarregamentoTela] = useState(true);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  const [unidades, setUnidades] = useState([]);
  /// Objects
  const [contrato, setContrato] = useState({ dataContrato: null });

  const treatment = (label, labelValue) => {
    if (fieldDatas.includes(label)) return dataMask(labelValue);
    return labelValue;
  }

  const changeInput = async (value, column) => {
    let valueInput = treatment(column, value);

    setContrato(prev => {
      return {
        ...prev,
        [column]: valueInput
      }
    })

    if (fieldDatas.includes(column)) {
      value = dataMaskEUA(value);
    }

    if (value != null) {
      await executarSQL(`
        UPDATE titulares
        SET ${column} = '${value}'
        WHERE id = ${contratoID}`
      );
    };
  }

  const setup = async () => {
    try {
      /// Criar contrato
      const novoContrato = await insertIdSQL(`INSERT INTO titulares (is_enviado) VALUES (0);`);

      if (!novoContrato) {
        return toast.show({
          placement: "bottom",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Não foi possivel criar novo contrato!" />
          }
        });
      }

      setContratoID(novoContrato);

      Promise.all([
        '/lista-unidades-usuario'
      ].map((endpoint) => axiosAuth.get(endpoint))).then((
        [
          { data: unidades }
        ]
      ) => {
        if (unidades && unidades.unidades.length > 0) {
          setUnidades(unidades.unidades);
        }
        setCarregamentoTela(false);
      }).catch((e) => {
        toast.show({
          placement: "bottom",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
          }
        });
      });

      setCarregamentoTela(false);
    } catch (e) {
      toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      });
    }
  }

  const proximoPasso = () => {
    setCarregamentoButton(true);

    if (!unidadeID) {
      setCarregamentoButton(false);

      return toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Filial não selecionada!" />
        }
      });
    }

    if (!contrato.dataContrato) {
      setCarregamentoButton(false);

      return toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Data de contrato é obrigatória" />
        }
      });
    }

    if (contrato && new Date(contrato.dataContrato) == 'Invalid Date') {
      setCarregamentoButton(false);

      return toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Data de contrato inválida!" />
        }
      });
    }

    if (dataMaskEUA(contrato.dataContrato) < dataMaskEUA(new Date())) {
      setCarregamentoButton(false);

      return toast.show({
        placement: "bottom",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Data de contrato inválida, não pode ser menor que a data atual!" />
        }
      });
    }

    setCarregamentoButton(false);

    return navigation.navigate("contratoContentTitular", { contratoID, unidadeID });
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
          : <VStack m="1">
            <Box key="1" safeArea w="100%" pl="5" pr="5" mb="5" pb="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              {/* Informações iniciais */}
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
                      value={contrato.dataContrato}
                      onChangeText={async (e) => await changeInput(e, 'dataContrato')}
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
                        key={item['nome']}
                        label={item['nome']}
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
                onPress={proximoPasso}
                isLoading={carregamentoButton}
              >
                Prosseguir
              </Button>
            </Box>
          </VStack>
      }

    </ScrollView>
  );
}

export { ContratoContentInicial };
