import React, { useEffect, useState } from 'react';
import { Center, Box, VStack, Heading, HStack, ScrollView, Button, useToast } from "native-base";
import { web, light, styleButtonText, styleButton } from '../utils/styles/index';
import { insertIdSQL, executarSQL } from '../services/database/index.js';
import { sexo, tiposContratos, rotas } from '../utils/generic/data';
import colors from '../utils/styles/colors';
import axiosAuth from '../utils/config/axios/private.js';
import ComponentInput from '../components/form/input';
import ComponentSelect from '../components/form/select';
import ComponentSwitch from '../components/form/switch';
import ComponentRadio from '../components/form/radio';
import ComponentModalDependentesPax from '../components/views/dependentes/index';
import ComponentLoading from '../components/views/loading/index';
import ComponentToast from '../components/views/toast/index';
import CompenentAddAnexos from '../components/views/anexos/index';
import ComponentCheckbox from '../components/form/checkbox';

function Contrato({ navigation }) {
  const toast = useToast();
  const [carregamentoTela, setCarregamentoTela] = useState(true);
  const [carregamentoSend, setCarregamentoSend] = useState(false);
  const [carregamentoRestanteFormulario, setCarregamentoRestanteFormulario] = useState(false);
  const [displayNoneContentCobranca, setDisplayNoneContentCobranca] = useState(false);
  const [displayButtonEnviarContrato, setDisplayButtonEnviarContrato] = useState(false);
  const [isTransferencia, setIsTransferencia] = useState(false);

  const [table] = useState('titulares');
  const [unidadeID, setUnidadeID] = useState(null);
  const [contratoID, setContratoID] = useState(null);
  const [templateID, setTemplateID] = useState(null);

  const [estadosCivil, setEstadosCivil] = useState([]);
  const [religioes, setReligioes] = useState([]);
  const [logradouros, setLogradouros] = useState([]);
  const [locaisCobrancas, setLocaisCobrancas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [anexos, setAnexos] = useState([]);

  const verificarDisplayButtonEnviarContrato = (display) => setDisplayButtonEnviarContrato(display);
  const verificarIsTransferencia = (display) => setIsTransferencia(display);
  const verificarDisplayContainerCobranca = (display) => setDisplayNoneContentCobranca(display);
  const getAnexos = (anexos) => setAnexos(anexos);
  const getTemplateID = (id) => setTemplateID(id);

  const criarNovoContrato = async () => {
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
  }

  const carregarPlanoFilial = async (id) => {
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
    setCarregamentoRestanteFormulario(true);

    try {
      const planosGet = await axiosAuth.get(`lista-planos/unidade-id=${id}`);

      if (planosGet && planosGet.data.planos) {
        setPlanos(planosGet.data.planos);
      }

      const templateGet = await axiosAuth.get(`lista-templates/unidade-id=${id}`);

      if (templateGet && templateGet.data.templates) {
        setTemplates(templateGet.data.templates);
        setCarregamentoRestanteFormulario(false);
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

  const sendContratoWebVendedor = async () => {
    setCarregamentoSend(true);

    try {
      /// validações
      if (!templateID) {
        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Template não foi selecionado!" />
          }
        });
      }

      if (!unidadeID) {
        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Unidade não foi selecionado!" />
          }
        });
      }

      await executarSQL(`update titulares set isOnline = 1 where id = '${contratoID}'`);

      const contrato = await executarSQL(`select * from titulares where id = '${contratoID}'`);

      if (!contrato) {
        return toast.show({
          placement: "top",
          render: () => {
            return <ComponentToast title="ATENÇÃO!" message="Contrato não localizado!" />
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
        ...contrato._array[0],
        dependentesPets: dependentesPets._array,
        dependentes: dependentesHumanos._array
      }

      let novoContratoBody = new FormData();

      anexos.map(async foto => {
        let fileExtension = foto.uri.substr(foto.uri.lastIndexOf(".") + 1);

        let nameArquivo = foto.uri.substr(
          foto.uri.lastIndexOf("ImagePicker/") + 12
        );

        await novoContratoBody.append("anexos[]", {
          type: `image/${fileExtension}`,
          uri: foto.uri,
          name: `anexo_${nameArquivo}`,
        });
      });

      novoContratoBody.append("body", JSON.stringify(contratoCliente));

      const request = await axiosAuth.post(`/cadastro-contrato/unidade-id=${unidadeID}/templeate-id=${templateID}`,
        novoContratoBody,
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

      setCarregamentoSend(false);

    } catch (e) {
      setCarregamentoSend(false);

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

  const setup = async () => {
    /// Criar contrato
    await criarNovoContrato();
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
      if (estadoCivil && estadoCivil.estadoCivil.length > 0)
        setEstadosCivil(estadoCivil.estadoCivil);
      if (religioes && religioes.religioes.length > 0)
        setReligioes(religioes.religioes);
      if (logradouros && logradouros.logradouros.length > 0)
        setLogradouros(logradouros.logradouros);
      if (locaisCobranca && locaisCobranca.locaisCobranca.length > 0)
        setLocaisCobrancas(locaisCobranca.locaisCobranca);
      if (locaisCobranca && locaisCobranca.locaisCobranca.length > 0)
        setLocaisCobrancas(locaisCobranca.locaisCobranca);
      if (unidades && unidades.unidades.length > 0)
        setUnidades(unidades.unidades)
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

  useEffect(() => {
    setup();
  }, []);

  return (
    <ScrollView h="100%">
      {
        carregamentoTela ?
          <ComponentLoading mensagem="Carregando informações" /> :
          <>
            <VStack m="1">
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
                          <ComponentInput
                            label="Data de contrato"
                            column="dataContrato"
                            placeholder='Digite a data de contrato:'
                            type="numeric"
                            id={contratoID}
                            table={table}
                            required
                          />
                        </Center>
                      </HStack>
                      <HStack space={2} justifyContent="center">
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
                    </VStack>
                  </Box>
                </Center>
              </Box>
            </VStack>
            {
              carregamentoRestanteFormulario ?
                <ComponentLoading mensagem=" Carregando adicionais do formulário" />
                :
                planos.length === 0 ? <></>
                  : <>
                    <VStack m="1">
                      <Box key="2" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                          <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                            Titular
                          </Heading>
                          <Heading mt="1" fontWeight="medium" size="xs">
                            Informe todas as informações corretamente!
                          </Heading>

                          <VStack space={3} mt="4">
                            <ComponentSwitch
                              label="Adicional cremação?"
                              column="isCremado"
                              id={contratoID}
                              table={table}
                              required
                            />
                            <HStack space={2} justifyContent="center">
                              <Center w="100%" rounded="md">
                                <ComponentInput
                                  label="Nome Completo"
                                  column="nomeTitular"
                                  placeholder='Digite o nome completo:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="CPF"
                                  column="cpfTitular"
                                  placeholder='Digite o CPF:'
                                  type="numeric"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="RG"
                                  column="rgTitular"
                                  placeholder='Digite o RG:'
                                  type="numeric"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Data Nascimento"
                                  column="dataNascTitular"
                                  placeholder='Data Nascimento:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentSelect
                                  label="Estado Civil"
                                  column="estadoCivilTitular"
                                  placeholder='Estado Civil:'
                                  array={estadosCivil}
                                  columnLabel="nome_estado_civil"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Nacionalidade"
                                  column="nacionalidadeTitular"
                                  placeholder='Digite a nacionalidade do titular:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Naturalidade"
                                  column="naturalidadeTitular"
                                  placeholder='Digite a naturalidade do titular:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentSelect
                                  label="Religião"
                                  column="religiaoTitular"
                                  placeholder='Selecione uma religião:'
                                  array={religioes}
                                  columnLabel="nome_religião"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentSelect
                                  label="Sexo"
                                  column="sexoTitular"
                                  placeholder='Selecione um gênero:'
                                  array={sexo}
                                  columnLabel="descricao"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Email"
                                  column="email1"
                                  placeholder='Digite um Email:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Telefone"
                                  column="telefone1"
                                  type="numeric"
                                  placeholder='Digite um telefone:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Email Secundário"
                                  column="email2"
                                  placeholder='Digite um Email:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Telefone Secundário"
                                  column="telefone2"
                                  type="numeric"
                                  placeholder='Digite um telefone:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="100%" rounded="md">
                                <ComponentInput
                                  label="Profissão"
                                  column="profissaoTitular"
                                  placeholder='Informe a profissão do titular:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                          </VStack>
                        </Box>
                      </Box>
                    </VStack>

                    <VStack m="1">
                      <Box key="3" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        {/* Endereço - Residencial */}
                        <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                          <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                            Endereço - Residencial
                          </Heading>
                          <Heading mt="1" fontWeight="medium" size="xs">
                            Informe todas as informações corretamente!
                          </Heading>
                          <VStack space={3} mt="4">
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentSelect
                                  label="Logradouro"
                                  column="tipoLogradouroResidencial"
                                  placeholder='Selecione um logradouro:'
                                  array={logradouros}
                                  columnLabel="nome_logradouro"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Rua"
                                  column="nomeLogradouroResidencial"
                                  placeholder='Informe o nome da rua:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Número"
                                  column="numeroResidencial"
                                  placeholder='Digite o número da residencia:'
                                  type="numeric"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Quadra"
                                  column="quadraResidencial"
                                  placeholder='Digite o número da quadra:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Lote"
                                  column="loteResidencial"
                                  placeholder='Digite o lote:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Complemento"
                                  column="complementoResidencial"
                                  placeholder='Complemento residencial:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Bairro"
                                  column="bairroResidencial"
                                  placeholder='Digite o nome do Bairro:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="CEP"
                                  column="cepResidencial"
                                  type="numeric"
                                  placeholder='Digite o CEP:'
                                  id={contratoID}
                                  table={table}
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Cidade"
                                  column="cidadeResidencial"
                                  placeholder='Digite o nome da cidade:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Estado"
                                  column="estadoResidencial"
                                  placeholder='Digite o estado:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                          </VStack>
                        </Box>
                      </Box>
                    </VStack>

                    <VStack m="1">
                      <Box key="4" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        {/* Endereço - Cobrança */}
                        <Box safeArea w="100%" pl="5" pr="5" mb="5" pb="5" >
                          <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                            Endereço - Cobrança
                          </Heading>
                          <Heading mt="1" fontWeight="medium" size="xs">
                            Informe todas as informações corretamente!
                          </Heading>
                          <VStack space={3} mt="4">
                            <ComponentSwitch
                              label="Endereço de cobrança será o mesmo do residencial?"
                              column="enderecoCobrancaIgualResidencial"
                              function={verificarDisplayContainerCobranca}
                              id={contratoID}
                              table={table}
                              required
                            />
                            {
                              displayNoneContentCobranca ? <></> :
                                <>
                                  <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                      <ComponentSelect
                                        label="Logradouro"
                                        column="tipoLogradouroCobranca"
                                        placeholder='Selecione um logradouro:'
                                        array={logradouros}
                                        columnLabel="nome_logradouro"
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Rua"
                                        column="nomeLogradouroCobranca"
                                        placeholder='Informe o nome da rua:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                  </HStack>
                                  <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Número"
                                        column="numeroCobranca"
                                        placeholder='Digite o número da residencia:'
                                        type="numeric"
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Quadra"
                                        column="quadraCobranca"
                                        placeholder='Digite o número da quadra:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                  </HStack>
                                  <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Lote"
                                        column="loteCobranca"
                                        placeholder='Digite o lote:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Complemento"
                                        column="complementoCobranca"
                                        placeholder='Complemento Cobranca:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                  </HStack>
                                  <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Bairro"
                                        column="bairroCobranca"
                                        placeholder='Digite o nome do Bairro:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="CEP"
                                        column="cepCobranca"
                                        type="numeric"
                                        placeholder='Digite o CEP:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                  </HStack>
                                  <HStack space={2} justifyContent="center">
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Cidade"
                                        column="cidadeCobranca"
                                        placeholder='Digite o nome da cidade:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                    <Center w="50%" rounded="md">
                                      <ComponentInput
                                        label="Estado"
                                        column="estadoCobranca"
                                        placeholder='Digite o estado:'
                                        id={contratoID}
                                        table={table}
                                      />
                                    </Center>
                                  </HStack>
                                </>
                            }
                          </VStack>
                        </Box>
                      </Box>
                    </VStack>

                    <VStack m="1">
                      <Box key="5" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
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
                                <ComponentSelect
                                  label="Plano"
                                  column="plano"
                                  placeholder='Selecione o optado pelo cliente:'
                                  array={planos}
                                  columnLabel="nome"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Dia do Vencimento"
                                  column="diaVencimento"
                                  placeholder='Digite o dia de vencimento:'
                                  type="numeric"
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Data Mensalidade"
                                  column="dataPrimeiraMensalidade"
                                  placeholder='Digite Data da Primeira Mensalidade:'
                                  id={contratoID}
                                  type="numeric"
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Dia para cobrança"
                                  column="melhorDia"
                                  type="numeric"
                                  placeholder='Melhor dia para cobrança:'
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                              <Center w="50%" rounded="md">
                                <ComponentInput
                                  label="Horário para cobrança"
                                  column="melhorHorario"
                                  placeholder='Melhor horário para cobrança:'
                                  id={contratoID}
                                  maxLength={7}
                                  type="numeric"
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="100%" rounded="md">
                                <ComponentRadio
                                  label="Local de Cobrança"
                                  column="localCobranca"
                                  columnLabel="nome_cobranca"
                                  array={locaisCobrancas}
                                  id={contratoID}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            <HStack space={2} justifyContent="center">
                              <Center w="100%" rounded="md">
                                <ComponentRadio
                                  label="Tipo de contrato"
                                  column="tipo"
                                  columnLabel="descricao"
                                  array={tiposContratos}
                                  id={contratoID}
                                  function={verificarIsTransferencia}
                                  table={table}
                                  required
                                />
                              </Center>
                            </HStack>
                            {
                              isTransferencia ?
                                <HStack space={2} justifyContent="center">
                                  <Center w="50%" rounded="md">
                                    <ComponentInput
                                      label="Número do contrato"
                                      column="numContratoAntigo"
                                      type="numeric"
                                      placeholder='Número do contrato:'
                                      id={contratoID}
                                      table={table}
                                      required
                                    />
                                  </Center>
                                  <Center w="50%" rounded="md">
                                    <ComponentInput
                                      label="Nome da Empresa"
                                      column="empresaAntiga"
                                      placeholder='Nome da Empresa:'
                                      id={contratoID}
                                      table={table}
                                      required
                                    />
                                  </Center>
                                </HStack>
                                : <></>
                            }
                          </VStack>
                        </Box>
                      </Box>
                    </VStack>
                    {/* Dependentes Pax Primavera */}
                    <VStack m="1">
                      <Box key="6" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <ComponentModalDependentesPax
                          contratoID={contratoID}
                          unidadeID={unidadeID}
                          title="Dependente(s) PAX"
                          isPet={false}
                        />
                      </Box>
                    </VStack>
                    {/* Dependentes Pet Primavera */}
                    <VStack m="1">
                      <Box key="7" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <ComponentModalDependentesPax
                          contratoID={contratoID}
                          unidadeID={unidadeID}
                          title="Dependente(s) PET"
                          isPet={true}
                        />
                      </Box>
                    </VStack>
                    {/* Anexos */}
                    <VStack m="1">
                      <Box key="8" maxW="100%" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <CompenentAddAnexos function={getAnexos} />
                      </Box>
                    </VStack>
                    {/* Templates */}
                    <VStack m="1">
                      <Box key="5" maxW="100%" rounded="lg" overflow="hidden" pt="5" pl="5" pr="5" mb="5" pb="5" borderColor="coolGray.200" borderWidth="1" _light={light} _web={web} >
                        <Heading size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1}>
                          Templates
                        </Heading>
                        <HStack space={2} justifyContent="center">
                          <Center w="100%" rounded="md">
                            <ComponentRadio
                              label="Selecione um template de contrato"
                              columnLabel="nome"
                              array={templates}
                              id={contratoID}
                              table={table}
                              function={getTemplateID}
                              required
                            />
                          </Center>
                        </HStack>
                      </Box>
                    </VStack>
                    {/* Gerais options */}
                    <VStack>
                      <Box key="8" mt="1" w="100%" pl="5" pr="5" mb="5" >
                        <ComponentCheckbox
                          label="Enviar contrato por WhatsApp?"
                          column="sendByWhatsApp"
                          id={contratoID}
                          table={table}
                        />
                        <ComponentCheckbox
                          label="Token por WhatsApp?"
                          column="envioToken"
                          id={contratoID}
                          table={table}
                        />
                        <ComponentCheckbox
                          label="Cliente concorda e aceita os termos?"
                          function={verificarDisplayButtonEnviarContrato}
                        />
                      </Box>
                    </VStack>
                    {/* Finalizar contrato */}
                    <VStack>
                      <Box key="8" mt="1" w="100%" pl="5" pr="5" mb="5" pb="5" >
                        <Button
                          size="lg"
                          isDisabled={!displayButtonEnviarContrato}
                          _text={styleButtonText}
                          _light={styleButton}
                          onPress={sendContratoWebVendedor}
                          isLoading={carregamentoSend}
                        >
                          Finalizar Contrato
                        </Button>
                      </Box>
                    </VStack>
                  </>
            }
          </>
      }
    </ScrollView >
  );
}

export { Contrato };
