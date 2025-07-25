import React, { useState, useEffect } from 'react';
import { executarSQL, insertIdSQL } from '../../../services/database/index.js';
import { styleButtonAdd, styleButtonTextAdd } from '../../../utils/styles/index';
import { Center, VStack, Icon, Heading, Box, useToast, Button } from "native-base";
import colors from '../../../utils/styles/colors.js';
import { Ionicons } from "@expo/vector-icons";
import axiosAuth from '../../../utils/config/axios/private.js';
import ComponentAddPax from './adicionais/pax.js';
import ComponentAddPet from './adicionais/pet.js';
import ComponentLoading from '../loading/index';
import { useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';

function modalDependentesPax(props) {
  const toast = useToast();
  const route = useRoute();
  const [table] = useState('dependente');
  const [dependentes, setDependentes] = useState([]);
  const [parentescos, setParentescos] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [racas, setRacas] = useState([]);
  const [carregamento, setCarregamento] = useState(false);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  const id = route.params.id;
  const { contratoID, unidadeID, title, isPet } = props;

  const setupSelecionarFilial = async () => {
    setCarregamento(true);
    try {
      setCarregamento(true);
      executarSQL(`select id, descricao from parentesco where unidadeId = ${unidadeID}`).then((response) => {
        setParentescos(response._array)
        setCarregamento(false);
      }), () => {
        Alert.alert('Erro ao executar SQL', sqlError.toString());
      }

      executarSQL(`select id, descricao from especie`).then((response) => {
        setEspecies(response._array)
        setCarregamento(false);
      }), () => {
        Alert.alert('Erro ao executar SQL', sqlError.toString());
      }

      executarSQL(`select id, descricao from raca`).then((response) => {
        setRacas(response._array)
        setCarregamento(false);
      }), () => {
        Alert.alert('Erro ao executar SQL', sqlError.toString());
      }
    } catch (e) {
      return toast.show({
        title: "Pax Vendedor",
        description: `Não foi possivel carregar informações da filial, contate o suporte: ${e.toString()}`,
        placement: "top"
      });
    };
  }

  const novoDependente = async () => {

    if (id == null) {
      const novoDependente = await insertIdSQL(`INSERT INTO dependente (is_pet, titular_id) values (${isPet}, ${contratoID});`);
      if (!novoDependente) {
        return toast.show({
          title: "Pax Vendedor",
          description: "Não foi possivel criar novo dependente!",
          placement: "top"
        });
      }
    } else {
      const novoDependente = await insertIdSQL(`INSERT INTO dependente (is_pet, titular_id) values (${isPet}, ${id});`);
      if (!novoDependente) {
        return toast.show({
          title: "Pax Vendedor",
          description: "Não foi possivel criar novo dependente!",
          placement: "top"
        });
      }
    }


    // Carregar dependentes
    loadDependentes();
  }

  const deletarDependente = async (id) => {
    const deleteDependente = await executarSQL(`delete from dependente where id = ${id}`);

    if (!deleteDependente) {
      return toast.show({
        title: "Pax Vendedor",
        description: "Não foi possivel deletar dependente!",
        placement: "top"
      });
    }
    // Carregar dependentes
    await loadDependentes();
  }

  const loadDependentes = async () => {
    setCarregamentoButton(true);
    if (id == null) {
      const dependentesGet = await executarSQL(`select * from dependente where is_pet = ${isPet} and titular_id = ${contratoID} order by id asc`);
      if (dependentesGet && dependentesGet._array) {
        setDependentes(dependentesGet._array);

        setCarregamentoButton(false);
      }
    } else {
      // Inicial carregamento dos dados locais 
      const dependentesGet = await executarSQL(`select * from dependente where is_pet = ${isPet} and titular_id = ${id} order by id asc`);
      if (dependentesGet && dependentesGet._array) {
        setDependentes(dependentesGet._array);
        setCarregamentoButton(false);
      }
    }
  }

  useEffect(() => {
    // Carregar dependentes do contratos
    loadDependentes();
    // Carregar informações sobre a filial
    setupSelecionarFilial();
  }, []);

  return (
    <VStack>
      {
        carregamento ? (
          <ComponentLoading mensagem="Carregando dependente(s)" />
        ) :
          <VStack m="1">
            <Center w="100%">
              <Box key="1" w="100%" pl="5" pr="5">
                <Heading size="lg" fontWeight="bold" color={colors.COLORS.PAXCOLOR_1} >
                  {title}
                </Heading>
                <Heading mt="2" mb="1" fontWeight="medium" size="sm">
                  Informe todas as informações corretamente!
                </Heading>
              </Box>
              {
                dependentes.map((item, index) => (
                  isPet === 1 ?
                    <ComponentAddPet
                      item={item}
                      table={table}
                      especies={especies}
                      racas={racas}
                      deletarDependente={deletarDependente}
                      key={index}
                    />
                    : <ComponentAddPax
                      item={item}
                      table={table}
                      parentescos={parentescos}
                      unidadeID={unidadeID}
                      deletarDependente={deletarDependente}
                      key={index}
                    />
                ))
              }
            </Center>
            <Button size="lg"
              m="5"
              leftIcon={<Icon as={Ionicons} name="add" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
              _light={styleButtonAdd}
              _text={styleButtonTextAdd}
              isLoading={carregamentoButton}
              variant="outline"
              onPress={() => novoDependente()}
            >
              Adicionar
            </Button>
          </VStack>
      }
    </VStack>
  );
}

export default modalDependentesPax;