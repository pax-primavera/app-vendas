import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast, FormControl, Input, Select, Checkbox, Switch, Text, Radio, Icon } from "native-base";
import { web, light, styleButtonText, styleButton, styleButtonAdd, styleButtonTextAdd, containerFoto } from '../utils/styles/index';
import { insertIdSQL, executarSQL } from '../services/database/index.js';
import { sexo, tiposContratos, rotas } from '../utils/generic/data';
import colors from '../utils/styles/colors';
import axiosAuth from '../utils/config/axios/private.js';
import { cpfMask, dataMask, timeMask, cepMask, foneMask } from "../utils/generic/format";
import { fieldDatas, fieldCPF, fieldCEPS, fieldTimes, fieldTelefones } from '../utils/generic/field.mask'
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import { styleInputFocus } from '../utils/styles/index';
import ComponentModalDependentesPax from '../components/views/dependentes/index';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";

function Contrato({ navigation }) {
  const toast = useToast();
  /// IDS, integers
  const [unidadeID, setUnidadeID] = useState(null);
  const [contratoID, setContratoID] = useState(null);
  const [templateID, setTemplateID] = useState(1);
  const [anexo1, setAnexo1] = useState(null);
  const [anexo2, setAnexo2] = useState(null);
  const [anexo3, setAnexo3] = useState(null);
  /// Booleanos
  const [isAceitoTermo, setisAceitoTermo] = useState(false);
  const [carregamentoTela, setCarregamentoTela] = useState(true);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  /// Arrays
  const [estadosCivil, setEstadosCivil] = useState([]);
  const [religioes, setReligioes] = useState([]);
  const [logradouros, setLogradouros] = useState([]);
  const [locaisCobrancas, setLocaisCobrancas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [templates, setTemplates] = useState([]);
  /// Objects
  const [contrato, setContrato] = useState(
    {
      bairroCobranca: null,
      bairroResidencial: null,
      cepCobranca: null,
      cepResidencial: null,
      cidadeCobranca: null,
      cidadeResidencial: null,
      complementoCobranca: null,
      complementoResidencial: null,
      cpfTitular: null,
      dataContrato: null,
      dataContratoAntigo: null,
      dataNascTitular: null,
      dataPrimeiraMensalidade: null,
      diaVencimento: null,
      email1: null,
      email2: null,
      empresaAntiga: null,
      enderecoCobrancaIgualResidencial: null,
      envioToken: true,
      estadoCivilTitular: null,
      estadoCobranca: null,
      estadoResidencial: null,
      isCremado: 0,
      isOnline: 1,
      is_enviado: 0,
      localCobranca: 0,
      loteCobranca: null,
      loteResidencial: null,
      melhorDia: null,
      melhorHorario: null,
      nacionalidadeTitular: null,
      naturalidadeTitular: null,
      nomeLogradouroResidencial: null,
      nomeTitular: null,
      numContratoAntigo: null,
      numeroCobranca: null,
      numeroResidencial: null,
      plano: null,
      profissaoTitular: null,
      quadraCobranca: null,
      quadraResidencial: null,
      religiaoTitular: null,
      rgTitular: null,
      sendByWhatsApp: true,
      sexoTitular: null,
      telefone1: null,
      telefone2: null,
      tipo: 0,
      tipoLogradouroCobranca: null,
      tipoLogradouroResidencial: null
    }
  );
  /// Functions Processos
  const treatment = (label, labelValue) => {
    if (fieldCPF.includes(label)) return cpfMask(labelValue);
    if (fieldDatas.includes(label)) return dataMask(labelValue);
    if (fieldCEPS.includes(label)) return cepMask(lsabelValue);
    if (fieldTimes.includes(label)) return timeMask(labelValue);
    if (fieldTelefones.includes(label)) return foneMask(labelValue);
    return labelValue;
  }
  const pickImage = async (numeroAnexo) => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false
    });

    if (!result.cancelled) {
      if (numeroAnexo === 1) setAnexo1(result)
      if (numeroAnexo === 2) setAnexo2(result)
      if (numeroAnexo === 3) setAnexo3(result)
    }
  };
  const changeInput = async (value, column, table = 'titulares') => {
    let valueInput = treatment(column, value);

    setContrato(prev => {
      return {
        ...prev,
        [column]: valueInput
      }
    })

    if (value != null) {
      await executarSQL(`
        UPDATE ${table} 
        SET ${column} = '${valueInput}'
        WHERE id = ${contratoID}`
      );
    };
  }
  const carregarInformacoesFiliais = async (id) => {
    if (!id) {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Não foi possivel carregar planos, filial não foi selecionada!" />
        }
      });
    }

    /// setar valores
    setUnidadeID(id);
    setCarregamentoTela(true);

    try {
      const planosGet = await axiosAuth.get(`lista-planos/unidade-id=${id}`);

      if (planosGet && planosGet.data.planos) {
        setPlanos(planosGet.data.planos);
      }

      const templateGet = await axiosAuth.get(`lista-templates/unidade-id=${id}`);

      if (templateGet && templateGet.data.templates) {
        setTemplates(templateGet.data.templates);
        setCarregamentoTela(false);
        return;
      }

      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Informações da filial não encontrada!" />
        }
      });
    } catch (e) {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      });
    };
  }
  const setup = async () => {
    /// Criar contrato
    const novoContrato = await insertIdSQL(`INSERT INTO titulares (is_enviado) VALUES (0);`);

    if (!novoContrato) {
      return toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message="Não foi possivel criar novo contrato!" />
        }
      });
    }
    setContratoID(novoContrato);
    /// Request informações
    Promise.all(rotas.map((endpoint) => axiosAuth.get(endpoint))).then((
      [
        { data: estadoCivil },
        { data: religioes },
        { data: logradouros },
        { data: locaisCobranca },
        { data: unidades }
      ]
    ) => {
      if (estadoCivil && estadoCivil.estadoCivil.length > 0) {
        setEstadosCivil(estadoCivil.estadoCivil)
      };
      if (religioes && religioes.religioes.length > 0) {
        setReligioes(religioes.religioes);
      }
      if (logradouros && logradouros.logradouros.length > 0) {
        setLogradouros(logradouros.logradouros);
      }
      if (locaisCobranca && locaisCobranca.locaisCobranca.length > 0) {
        setLocaisCobrancas(locaisCobranca.locaisCobranca);
      }
      if (locaisCobranca && locaisCobranca.locaisCobranca.length > 0) {
        setLocaisCobrancas(locaisCobranca.locaisCobranca);
      }
      if (unidades && unidades.unidades.length > 0) {
        setUnidades(unidades.unidades);
      }
      setCarregamentoTela(false);
    }).catch((e) => {
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      });
    });
  }
  const tratamentoImagem = (foto) => {
    let fileExtension = foto.uri.substr(foto.uri.lastIndexOf(".") + 1);

    let nameArquivo = foto.uri.substr(
      foto.uri.lastIndexOf("ImagePicker/") + 12
    );

    return {
      type: `image/${fileExtension}`,
      uri: foto.uri,
      name: `anexo_${nameArquivo}`,
    }
  }
  const sendContratoWebWendedor = async () => {
    setCarregamentoButton(true);

    try {
      if (!anexo1 || !anexo2 || !anexo3) {
        setCarregamentoButton(false);

        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Envie todos os anexos, está faltando arquivo(s)" />
          }
        });
      }
      if (!templateID) {
        setCarregamentoButton(false);

        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Template não foi selecionado!" />
          }
        });
      }

      if (!unidadeID) {
        setCarregamentoButton(false);

        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Unidade não foi selecionado!" />
          }
        });
      }

      const dependentesHumanos = await executarSQL(`
        select 
          nome,
          dataNascimento,
          parentesco,
          cpf_dependente,
          cremacao  
        from dependentes 
        where titular_id = '${contratoID}'
        and is_pet = 0
      `);

      const dependentesPets = await executarSQL(`
        select 
          nome,
          especie,
          porte,
          resgate,
          dataNascimento,
          raca,
          altura,
          peso,
          cor
        from dependentes 
        where titular_id = '${contratoID}'
        and is_pet = 1
      `);

      const contratoCliente = {
        ...contrato,
        dependentesPets: dependentesPets._array,
        dependentes: dependentesHumanos._array
      }

      let contratoBody = new FormData();

      contratoBody.append("anexos[]", tratamentoImagem(anexo1));
      contratoBody.append("anexos[]", tratamentoImagem(anexo2));
      contratoBody.append("anexos[]", tratamentoImagem(anexo3));
      contratoBody.append("body", JSON.stringify(contratoCliente));

      const request = await axiosAuth.post(`/cadastro-contrato/unidade-id=${unidadeID}/templeate-id=${templateID}`,
        contratoBody,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (request.data && request.data.assinatura) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="Realizado!" message={"Contrato enviado com sucesso!"} />
          }
        });

        return navigation.navigate("Assinatura", request.data.assinatura);
      }

      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="Falha!" message={"Não foi possivel enviar contrato!"} />
        }
      });

      setCarregamentoButton(false);

    } catch (e) {
      setCarregamentoButton(false);

      if (e && e.response.data.error) {
        toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message={e.response.data.error} />
          }
        });
        return;
      }

      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast title="ATENÇÃO!" message={`Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`} />
        }
      });
    }
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
            <Box key="1" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light}
              _web={web} >
              {/* Informações iniciais */}
              <Center>
                <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                  <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                    Informações Iniciais
                  </Heading>
                  <Heading mt="1" fontWeight="medium" size="xs">
                    Selecione uma 'FILIAL' e preecha data de contrato:
                  </Heading>

                  <VStack space={3} mt="4">
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
                            onValueChange={value => carregarInformacoesFiliais(value)}
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
                  </VStack>
                </Box>
              </Center>
            </Box>
          </VStack>
      }
      {
        planos.length > 0 && !carregamentoTela
          ? <VStack m="1">
            <Box key="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                  Titular
                </Heading>
                <Heading mt="1" fontWeight="medium" size="xs">
                  Informe todas as informações corretamente!
                </Heading>
                <VStack space={3} mt="4">
                  <HStack space={1} alignItems="center">
                    <Switch
                      size="lg"
                      value={contrato.isCremado}
                      colorScheme="emerald"
                      onValueChange={async (e) => await changeInput(e, 'isCremado')}
                    />
                    <Text>Adicional cremação?</Text>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl isRequired >
                        <FormControl.Label>Nome Completo:</FormControl.Label>
                        <Input
                          placeholder='Digite o nome completo:'
                          value={contrato.nomeTitular}
                          onChangeText={async (e) => await changeInput(e, 'nomeTitular')}
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
                          value={contrato.cpfTitular}
                          onChangeText={async (e) => await changeInput(e, 'cpfTitular')}
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
                          value={contrato.rgTitular}
                          onChangeText={async (e) => await changeInput(e, 'rgTitular')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl isRequired >
                        <FormControl.Label>Data de Nascimento:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite a data de nascimento:'
                          value={contrato.dataNascTitular}
                          onChangeText={async (e) => await changeInput(e, 'dataNascTitular')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Estado Civil:</FormControl.Label>
                        <Select
                          _focus={styleInputFocus}
                          selectedValue={contrato.estadoCivilTitular}
                          onValueChange={async (e) => await changeInput(e, 'estadoCivilTitular')}
                          accessibilityLabel="Estado Civil:"
                          placeholder="Estado Civil:"
                        >
                          {estadosCivil.map((item) => <Select.Item
                            key={item['nome_estado_civil']}
                            label={item['nome_estado_civil']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Nacionalidade:</FormControl.Label>
                        <Input
                          placeholder='Digite a Nacionalidade:'
                          value={contrato.naturalidadeTitular}
                          onChangeText={async (e) => await changeInput(e, 'naturalidadeTitular')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Naturalidade:</FormControl.Label>
                        <Input
                          placeholder='Digite a Naturalidade:'
                          value={contrato.naturalidadeTitular}
                          onChangeText={async (e) => await changeInput(e, 'naturalidadeTitular')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Religião:</FormControl.Label>
                        <Select
                          _focus={styleInputFocus}
                          selectedValue={contrato.religiaoTitular}
                          onValueChange={async (e) => await changeInput(e, 'religiaoTitular')}
                          accessibilityLabel="Selecione uma religião:"
                          placeholder="Selecione uma religião:"
                        >
                          {religioes.map((item) => <Select.Item
                            key={item['nome_religião']}
                            label={item['nome_religião']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Sexo:</FormControl.Label>
                        <Select
                          _focus={styleInputFocus}
                          selectedValue={contrato.sexoTitular}
                          onValueChange={async (e) => await changeInput(e, 'sexoTitular')}
                          accessibilityLabel="Selecione um gênero:"
                          placeholder="Selecione um gênero:"
                        >
                          {sexo.map((item) => <Select.Item
                            key={item['descricao']}
                            label={item['descricao']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Email:</FormControl.Label>
                        <Input
                          placeholder='Digite um Email:'
                          value={contrato.email1}
                          onChangeText={async (e) => await changeInput(e, 'email1')}
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
                          value={contrato.telefone1}
                          onChangeText={async (e) => await changeInput(e, 'telefone1')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Email Secundário:</FormControl.Label>
                        <Input
                          placeholder='Digite um Email:'
                          value={contrato.email2}
                          onChangeText={async (e) => await changeInput(e, 'email2')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Telefone Secundário:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite um número de telefone:'
                          value={contrato.telefone2}
                          onChangeText={async (e) => await changeInput(e, 'telefone2')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl isRequired >
                        <FormControl.Label>Profissão:</FormControl.Label>
                        <Input
                          placeholder='Informe a profissão do titular:'
                          value={contrato.profissaoTitular}
                          onChangeText={async (e) => await changeInput(e, 'profissaoTitular')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                </VStack>
              </Box>
            </Box>
            <Box key="3" maxW="100%" rounded="lg" mt="2" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              {/* Endereço - Residencial */}
              <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5"  >
                <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                  Endereço - Residencial
                </Heading>
                <Heading mt="1" fontWeight="medium" size="xs">
                  Informe todas as informações corretamente!
                </Heading>
                <VStack space={3} mt="4">
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Logradouro:</FormControl.Label>
                        <Select
                          _focus={styleInputFocus}
                          selectedValue={contrato.tipoLogradouroResidencial}
                          onValueChange={async (e) => await changeInput(e, 'tipoLogradouroResidencial')}
                          accessibilityLabel="Selecione um logradouro:"
                          placeholder="Selecione um logradouro:"
                        >
                          {logradouros.map((item) => <Select.Item
                            key={item['nome_logradouro']}
                            label={item['nome_logradouro']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl isRequired >
                        <FormControl.Label>Rua:</FormControl.Label>
                        <Input
                          placeholder='Informe o nome da rua:'
                          value={contrato.nomeLogradouroResidencial}
                          onChangeText={async (e) => await changeInput(e, 'nomeLogradouroResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Número:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite o número da residencia:'
                          value={contrato.numeroResidencial}
                          onChangeText={async (e) => await changeInput(e, 'numeroResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Quadra:</FormControl.Label>
                        <Input
                          placeholder='Digite um número de telefone:'
                          value={contrato.quadraResidencial}
                          onChangeText={async (e) => await changeInput(e, 'quadraResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Lote:</FormControl.Label>
                        <Input
                          placeholder='Digite o lote da residencia:'
                          value={contrato.loteResidencial}
                          onChangeText={async (e) => await changeInput(e, 'loteResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Complemento:</FormControl.Label>
                        <Input
                          placeholder='Digite o Complemento da residencia:'
                          value={contrato.complementoResidencial}
                          onChangeText={async (e) => await changeInput(e, 'complementoResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Bairro:</FormControl.Label>
                        <Input
                          placeholder='Digite o bairro da residencia:'
                          value={contrato.bairroResidencial}
                          onChangeText={async (e) => await changeInput(e, 'bairroResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>CEP:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite o CEP da residencia:'
                          value={contrato.cepResidencial}
                          onChangeText={async (e) => await changeInput(e, 'cepResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Cidade:</FormControl.Label>
                        <Input
                          placeholder='Digite o nome da cidade:'
                          value={contrato.cidadeResidencial}
                          onChangeText={async (e) => await changeInput(e, 'cidadeResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Estado:</FormControl.Label>
                        <Input
                          placeholder='Digite o estado:'
                          value={contrato.estadoResidencial}
                          onChangeText={async (e) => await changeInput(e, 'estadoResidencial')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                </VStack>
              </Box>
            </Box>
            <Box key="4" maxW="100%" rounded="lg" mt="1" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              {/* Endereço - Cobrança */}
              <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                  Endereço - Cobrança
                </Heading>
                <Heading mt="1" fontWeight="medium" size="xs">
                  Informe todas as informações corretamente!
                </Heading>
                <HStack space={1} alignItems="center">
                  <Switch
                    size="lg"
                    value={contrato.enderecoCobrancaIgualResidencial}
                    colorScheme="emerald"
                    onValueChange={async (e) => await changeInput(e, 'enderecoCobrancaIgualResidencial')}
                  />
                  <Text>Endereço de cobrança será o mesmo do residencial?</Text>
                </HStack>
                <VStack space={3} mt="4">
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Logradouro:</FormControl.Label>
                        <Select
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          _focus={styleInputFocus}
                          selectedValue={contrato.tipoLogradouroCobranca}
                          onValueChange={async (e) => await changeInput(e, 'tipoLogradouroCobranca')}
                          accessibilityLabel="Selecione um logradouro:"
                          placeholder="Selecione um logradouro:"
                        >
                          {logradouros.map((item) => <Select.Item
                            key={item['nome_logradouro']}
                            label={item['nome_logradouro']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl isRequired >
                        <FormControl.Label>Rua:</FormControl.Label>
                        <Input
                          placeholder='Informe o nome da rua:'
                          value={contrato.nomeLogradouroCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'nomeLogradouroCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Número:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite o número da Cobranca:'
                          value={contrato.numeroCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'numeroCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Quadra:</FormControl.Label>
                        <Input
                          placeholder='Digite um número de telefone:'
                          value={contrato.quadraCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'quadraCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Lote:</FormControl.Label>
                        <Input
                          placeholder='Digite o lote:'
                          value={contrato.loteCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'loteCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Complemento:</FormControl.Label>
                        <Input
                          placeholder='Digite o Complemento:'
                          value={contrato.complementoCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'complementoCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Bairro:</FormControl.Label>
                        <Input
                          placeholder='Digite o bairro:'
                          value={contrato.bairroCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'bairroCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>CEP:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite o CEP:'
                          value={contrato.cepCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'cepCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Cidade:</FormControl.Label>
                        <Input
                          placeholder='Digite o nome da cidade:'
                          value={contrato.cidadeCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'cidadeCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Estado:</FormControl.Label>
                        <Input
                          placeholder='Digite o estado:'
                          value={contrato.estadoCobranca}
                          isDisabled={contrato.enderecoCobrancaIgualResidencial}
                          onChangeText={async (e) => await changeInput(e, 'estadoCobranca')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                </VStack>
              </Box>
            </Box>
            <Box key="5" maxW="100%" rounded="lg" mt="2" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              {/* Termo de Adesão */}
              <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                  Termo de Adesão
                </Heading>
                <Heading mt="1" fontWeight="medium" size="xs">
                  Informe todas as informações corretamente!
                </Heading>
                <VStack space={3} mt="4">
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Planos:</FormControl.Label>
                        <Select
                          _focus={styleInputFocus}
                          selectedValue={contrato.plano}
                          onValueChange={async (e) => await changeInput(e, 'plano')}
                          accessibilityLabel="Plano:"
                          placeholder="Plano:"
                        >
                          {planos.map((item) => <Select.Item
                            key={item['nome']}
                            label={item['nome']}
                            value={item.id} />
                          )}
                        </Select>
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl isRequired>
                        <FormControl.Label>Dia Vencimento:</FormControl.Label>
                        <Input
                          placeholder='Digite o dia de vencimento:'
                          value={contrato.diaVencimento}
                          keyboardType='numeric'
                          onChangeText={async (e) => await changeInput(e, 'diaVencimento')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Data Mensalidade:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Digite Data da Primeira Mensalidade:'
                          value={contrato.dataPrimeiraMensalidade}
                          onChangeText={async (e) => await changeInput(e, 'dataPrimeiraMensalidade')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Dia para cobrança:</FormControl.Label>
                        <Input
                          placeholder='Melhor dia para cobrança:'
                          value={contrato.melhorDia}
                          keyboardType='numeric'
                          onChangeText={async (e) => await changeInput(e, 'melhorDia')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                    <Center w="50%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Horário para cobrança:</FormControl.Label>
                        <Input
                          keyboardType='numeric'
                          placeholder='Melhor horário para cobrança:'
                          value={contrato.melhorHorario}
                          onChangeText={async (e) => await changeInput(e, 'melhorHorario')}
                          _focus={styleInputFocus}
                        />
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Local de Cobrança:</FormControl.Label>
                        <Radio.Group
                          defaultValue={contrato.localCobranca}
                          onChange={async (e) => await changeInput(e, 'localCobranca')}
                          name="localCobranca"
                        >
                          {locaisCobrancas.map((item) => <Radio
                            colorScheme="emerald"
                            key={item['nome_cobranca']}
                            value={item.id}>{item['nome_cobranca']}</Radio>
                          )}
                        </Radio.Group>
                      </FormControl>
                    </Center>
                  </HStack>
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl>
                        <FormControl.Label>Tipo de contrato:</FormControl.Label>
                        <Radio.Group
                          defaultValue={contrato.tipo}
                          onChange={async (e) => await changeInput(e, 'tipo')}
                          name="tipo"
                        >
                          {tiposContratos.map((item) => <Radio
                            colorScheme="emerald"
                            key={item['descricao']}
                            value={item.id}>{item['descricao']}</Radio>
                          )}
                        </Radio.Group>
                      </FormControl>
                    </Center>
                  </HStack>
                  {
                    contrato && contrato.tipo === 1 ?
                      <HStack space={2} justifyContent="center">
                        <Center w="50%" rounded="md">
                          <FormControl>
                            <FormControl.Label>Número do contrato:</FormControl.Label>
                            <Input
                              placeholder='Número do contrato:'
                              value={contrato.numContratoAntigo}
                              onChangeText={async (e) => await changeInput(e, 'numContratoAntigo')}
                              _focus={styleInputFocus}
                            />
                          </FormControl>
                        </Center>
                        <Center w="50%" rounded="md">
                          <FormControl>
                            <FormControl.Label>Nome da Empresa:</FormControl.Label>
                            <Input
                              placeholder='Nome da Empresa:'
                              value={contrato.empresaAntiga}
                              onChangeText={async (e) => await changeInput(e, 'empresaAntiga')}
                              _focus={styleInputFocus}
                            />
                          </FormControl>
                        </Center>
                      </HStack>
                      : <></>
                  }
                </VStack>
              </Box>
            </Box>
            {/* Dependentes Pax Primavera */}
            <Box key="6" maxW="100%" mt="2" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              <ComponentModalDependentesPax
                contratoID={contratoID}
                unidadeID={unidadeID}
                title="Dependente(s) PAX"
                isPet={0}
              />
            </Box>
            {/* Dependentes Pet Primavera */}
            <Box key="7" maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              <ComponentModalDependentesPax
                contratoID={contratoID}
                unidadeID={unidadeID}
                title="Dependente(s) PET"
                isPet={1}
              />
            </Box>
            {/* Anexos */}
            <Box key="8" maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              <Box w="100%" pl="5" pr="5" m1="5" pb="5">
                <Heading mt="5" size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1} >
                  Anexos
                </Heading>
                <Heading mt="2" mb="1" fontWeight="medium" size="sm">
                  Informe todas as informações corretamente!
                </Heading>
                <VStack >
                  <VStack style={containerFoto}>
                    <VStack pl="5" pr="5">
                      <Text fontWeight="bold">Fotografe a frente do documento de identidade do cliente.</Text>
                      <Text>
                        {
                          !anexo1 ?
                            <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                            <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                        }
                      </Text>
                    </VStack>
                    <Button size="lg"
                      m="5"
                      isDisabled={anexo1}
                      leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                      _light={styleButtonAdd}
                      _text={styleButtonTextAdd}
                      variant="outline"
                      onPress={() => pickImage(1)}
                    >
                      FRENTE DO DOCUMENTO
                    </Button>
                  </VStack>
                  <VStack style={containerFoto}>
                    <VStack pl="5" pr="5">
                      <Text fontWeight="bold">Fotografe o verso do documento de identidade do cliente.</Text>
                      <Text>
                        {
                          !anexo2 ?
                            <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                            <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                        }
                      </Text>
                    </VStack>
                    <Button size="lg"
                      m="5"
                      isDisabled={anexo2}
                      leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                      _light={styleButtonAdd}
                      _text={styleButtonTextAdd}
                      variant="outline"
                      onPress={() => pickImage(2)}
                    >
                      VERSO DO DOCUMENTO
                    </Button>
                  </VStack>
                  <VStack style={containerFoto}>
                    <VStack pl="5" pr="5">
                      <Text fontWeight="bold">Fotografe o cliente de perfil.</Text>
                      <Text>PEÇA AUTORIZAÇÃO DELE ANTES</Text>
                      <Text> {
                        !anexo3 ?
                          <Text fontWeight="bold" color="red.800">Não preenchido</Text> :
                          <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>Preenchido</Text>
                      }</Text>
                    </VStack>
                    <Button size="lg"
                      m="5"
                      isDisabled={anexo3}
                      leftIcon={<Icon as={Ionicons} name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
                      _light={styleButtonAdd}
                      _text={styleButtonTextAdd}
                      variant="outline"
                      onPress={() => pickImage(3)}
                    >
                      PERFIL DO DOCUMENTO
                    </Button>
                  </VStack>
                </VStack>
              </Box>
            </Box>
            {/* Templates */}
            <Box key="98" maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
              <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5"  >
                <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                  Templates
                </Heading>
                <Heading mt="1" fontWeight="medium" size="xs">
                  Selecione um tipo de contrato
                </Heading>
                <VStack space={3} mt="4">
                  <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                      <FormControl>
                        <Radio.Group
                          defaultValue={templateID}
                          onChange={(e) => setTemplateID(e)}
                          name="templateID"
                        >
                          {templates.map((item) => <Radio
                            colorScheme="emerald"
                            key={item['nome']}
                            value={item.id}>{item['nome']}</Radio>
                          )}
                        </Radio.Group>
                      </FormControl>
                    </Center>
                  </HStack>
                </VStack>
              </Box>
            </Box>
            {/* Gerais options */}
            <Box key="10" maxW="100%" mt="1" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1"  >
              <Box w="100%" pl="5" pr="5" mb="2" mt="2" >
                <Checkbox
                  colorScheme="emerald"
                  value={contrato.sendByWhatsApp}
                  onChange={async (e) => await changeInput(e, 'sendByWhatsApp')}
                  key="sendByWhatsApp"
                >
                  Enviar contrato por WhatsApp?
                </Checkbox>
                <Checkbox
                  colorScheme="emerald"
                  value={contrato.envioToken}
                  onChange={async (e) => await changeInput(e, 'envioToken')}
                  key="envioToken"
                >
                  Token por WhatsApp?
                </Checkbox>
                <Checkbox
                  colorScheme="emerald"
                  value={isAceitoTermo}
                  onChange={setisAceitoTermo}
                  key="isAceitoTermo"
                >
                   Cliente concorda e aceita os termos?
                </Checkbox>
              </Box>
            </Box>
            {/* Finalizar contrato */}
            <Box key="11" mt="4" mb="4" w="100%"  >
              <Button
                size="lg"
                isDisabled={!isAceitoTermo}
                _text={styleButtonText}
                _light={styleButton}
                onPress={sendContratoWebWendedor}
                isLoading={carregamentoButton}
              >
                Concluir Cadastro
              </Button>
            </Box>
          </VStack>
          : <></>
      }
    </ScrollView>
  );
}

export { Contrato };
