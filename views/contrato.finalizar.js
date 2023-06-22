import React, { useEffect, useState } from "react";
import {
  Center,
  Box,
  VStack,
  Heading,
  HStack,
  ScrollView,
  useToast,
  Button,
  FormControl,
  Radio,
  Text,
  Switch,
} from "native-base";
import {
  web,
  light,
  styleButtonText,
  styleButton,
} from "../utils/styles/index";
import colors from "../utils/styles/colors";
import { useRoute } from "@react-navigation/native";
import { executarSQL } from "../services/database/index.js";
import ComponentToast from "../components/views/toast/index";
import ComponentLoading from "../components/views/loading/index";
import { Alert } from "react-native";
import { useRef } from "react";
import { templates, templatesSemPET, templatesSemPETSemCREM } from "../utils/generic/data";
import { dataMask, dataMaskEUA, cnpjMask } from "../utils/generic/format";
import moment from 'moment';
import { tiposContratos, tiposContratosPR, tiposContratosGO } from "../utils/generic/data";

function ContratoContentFinalizar({ navigation }) {
  /// Config
  const route = useRoute();
  const toast = useToast();
  /// Parametros
  const { contratoID, unidadeID, anexos } = route.params;
  const [templateID, setTemplateID] = useState(null);
  const [estado, setEstado] = useState(null);
  const [tipo, setTipo] = useState([]);
  /// Booleanos
  const [carregamentoTela, setCarregamentoTela] = useState(false);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  const ref = useRef();
  const [templatesContrato, setTemplatesContrato] = useState([]);

  const trimObject = (data) => {
    for (var property in data) {
      if (typeof data[property] === "string") {
        data[property] = data[property].trim();
      }
    }
    return data;
  };

  const setup = async () => {
    setCarregamentoTela(true)
    executarSQL(`select regiao, uf from unidade where id = ${unidadeID}`).then((response) => {
      setEstado(response._array[0].uf)
      if (response._array[0].regiao == 1) {
        setTemplatesContrato(templatesSemPET)
      } else if (response._array[0].regiao == 3) {
        setTemplatesContrato(templatesSemPETSemCREM)
      } else if (response._array[0].regiao == 2) {
        setTemplatesContrato(templates)
      } else {
        setTemplatesContrato(templates)
      }

      if (response._array[0].uf == 'MS') {
        if (response._array[0].regiao == 0) {

          {
            tiposContratos.map((item) => (
              setTipo(item.id)
            ))
          }

        } else {
          {
            tiposContratosPR.map((item) => (
              setTipo(item.id)
            ))
          }
        }

      } else if (response._array[0].uf == 'PR') {
        {
          tiposContratosPR.map((item) => (
            setTipo(item.id)
          ))
        }
      } else {
        {
          tiposContratosGO.map((item) => (
            setTipo(item.id)
          ))
        }
      }
    })

    setCarregamentoTela(false)

  }

  const finalizarContrato = async () => {
    setCarregamentoButton(true);
    try {
      if (!templateID) {
        Alert.alert("Aviso.", "Selecione um template!");
        return;
      }

      setCarregamentoTela(false);
      const unidade = await executarSQL(`select * from unidade where id = ${unidadeID}`);

      const unidadeTratado = trimObject(unidade._array[0]);

      //SELECIONA TODOS OS DADOS  DO CONTRATO
      const contrato = await executarSQL(
        `select case when a.valorAdesao is null then 0.00 else a.valorAdesao end as valorAdesao, 
        case when a.valorMensalidade is null then 0.00 else a.valorMensalidade end as valorMensalidade
        ,t.* 
        from titular t 
      left join adicional a on a.pet = 0 and t.unidadeId=${unidadeID} and isCremado =1
      where t.id = '${contratoID}'`
      );

      //VERIFICA SE O CONTRATO NÃO ESTÁ VAZIO
      if (!contrato) {
        Alert.alert("Aviso.", "Contrato não localizado!");
        return;
      }
      //COLOCA OS CONTRATOS EM UM ARRAY
      const contratoTratado = trimObject(contrato._array[0]);

      const result = tiposContratos.find(tipo => tipo.descricao === contratoTratado.tipo);

      //SELCIONA O PLANO DO CONTRATO E COLOCA EM UM ARRAY
      const plano = await executarSQL(`select id, descricao, valorMensalidade, valorAdicional, limiteDependente, carenciaNovo, ativo, unidadeId,
      case when "${contratoTratado.tipo}" not like '%Novo%' then (case when ("${contratoTratado.tipo}" like '%Transferência de Filial%' 
      OR "${contratoTratado.tipo}" like '%Transferência de Titularidade%' OR "${contratoTratado.tipo}" like '%SUPER LUXO para LUXO%') then 0.00 else valorAdesaoTransferencia end) else  valorAdesao end as valorAdesao 
      from plano where id = "${contratoTratado.plano}"`);

      const planoTratado = trimObject(plano._array[0])

      const dependentesHumanos = await executarSQL(`
                select distinct
                nome,
                dataNascimento,
                p.descricao as parentesco,
                p.adicional,
                cpfDependente,
                cremacao,
                is_pet,
                (select case when a.valorAdesao is null or d.cremacao = 0 then 0.00 else a.valorAdesao end as valorAdesao from adicional a where a.pet=d.is_pet and d.is_pet is false and a.unidadeId = ${unidadeID} limit 1) as valorAdesao,
                (select case when a.valorMensalidade is null  or d.cremacao = 0 then 0.00 else a.valorMensalidade end as valorMensalidade from adicional a where a.pet=d.is_pet and d.is_pet is false  and a.unidadeId = ${unidadeID} limit 1) as valorMensalidade
                from dependente d
                left join parentesco p on p.id=d.parentesco and p.unidadeId='${unidadeID}'
                where titular_id = '${contratoID}'
                and is_pet = 0
          `);


      const dependentesPets = await executarSQL(`
      select distinct
                nome,
                e.descricao as especie,
                porte,
                resgate,
                dataNascimento,
                r.descricao as raca,
                altura,
                peso,
                cor,
                is_pet,
                (select a.valorAdesao from adicional a where d.is_pet = 1 and a.porte=d.porte and a.unidadeId=${unidadeID} and (case when LOWER(d.resgate) = 'true' THEN 1 ELSE 0 END = a.resgate) limit 1) as valorAdesao,
                (select a.valorMensalidade from adicional a where d.is_pet = 1 and a.porte=d.porte and  a.unidadeId=${unidadeID} and (case when LOWER(d.resgate) = 'true' THEN 1 ELSE 0 END = a.resgate) limit 1) as valorMensalidade
                from dependente d
                left join raca r on r.id = d.raca
                left join especie e on e.id = d.especie
                where titular_id = '${contratoID}' and is_pet = 1
          `);

      const dependentes = [
        ...dependentesPets._array,
        ...dependentesHumanos._array,
      ];

      let htmlDependentesHumano = "";
      let htmlDependentesPet = "";
      let htmlCremacao = "";
      let htmlTitularCremado = "";

      let valorTotalAdesao = 0.00 + contrato._array[0].valorAdesao + plano._array[0].valorAdesao;
      let valorTotalMensalidade = 0.00 + contrato._array[0].valorMensalidade + + plano._array[0].valorMensalidade;
      let adesaoCremacao = 0.00 + contrato._array[0].valorAdesao;
      let mensalidadeCremacao = 0.00 + contrato._array[0].valorMensalidade;
      let adesaoHumano = adesaoCremacao;
      let mensalidadeHumano = mensalidadeCremacao;
      let adesaoPet = 0.00;
      let mensalidadePet = 0.00;
      let valorAdicional = 0.00;
      let qtdAdicional = 0;

      //verifica se o titular tem cremação
      if (contratoTratado.isCremado != false) {
        htmlTitularCremado = `
        <div class="edit">  
        <p>Nome: ${contratoTratado.nomeTitular}</p>
        <p>CPF: ${contratoTratado.cpfTitular}</p>
        <p>Parentesco: TITULAR</p>
        <p>Data de Nascimento:${contratoTratado.dataNascTitular}</p>
        <p><span style="color: inherit;"><br></span></p>
        </div>`;
      }
      //verifica quais dependentes humanos tem cremacao
      dependentes.map(async (dep, index) => {
        if (dep && dep.cremacao == "true") {
          return (htmlCremacao += `
              <div class="edit">  
              <p>Nome ${index}: ${dep.nome}</p>
              <p>CPF: ${dep.cpfDependente}</p>
              <p>Parentesco: ${dep.parentesco}</p>
              <p>Data de Nascimento:${moment(dep.dataNascimento).format('DD/MM/YYYY')}</p>
              </div>
              `);
        }
      });
      //insere os dependentes humanos ou pets no html
      dependentes.map(async (dep, index) => {
        valorTotalAdesao += dep.valorAdesao;
        valorTotalMensalidade += dep.valorMensalidade;
        adesaoCremacao += dep.valorAdesao;
        mensalidadeCremacao += dep.valorMensalidade;

        if (dep && dep.is_pet == 0) {
          if (plano._array[0].limiteDependente > 0) {
            valorTotalMensalidade += (index + 1 <= plano._array[0].limiteDependente ? 0.00 : plano._array[0].valorAdicional);
            qtdAdicional += (index + 1 <= plano._array[0].limiteDependente ? 0 : 1);
            valorAdicional += (index + 1 <= plano._array[0].limiteDependente ? 0.00 : plano._array[0].valorAdicional)
          } else {
            if (dep.adicional == 1) {
              qtdAdicional++;
              valorAdicional += plano._array[0].valorAdicional
              valorTotalMensalidade += plano._array[0].valorAdicional;
            }
          }
          adesaoHumano += dep.valorAdesao;
          mensalidadeHumano += dep.valorMensalidade;
          return (htmlDependentesHumano += `
              <div class="edit">
                <p>Dependente ${index}: ${dep.nome}</p>
                <p>CPF: ${dep.cpfDependente}</span>&nbsp;</p>
                <p>Data de Nascimento: ${moment(dep.dataNascimento).format('DD/MM/YYYY')}</p>
                <p>Parentesco: ${dep.parentesco}</p>
                <p><span style="color: inherit;"><br></span></p>
                </div>
              </div>
          `);
        }
        if (dep && dep.is_pet == 1) {
          adesaoPet += dep.valorAdesao;
          mensalidadePet += dep.valorMensalidade
        }
        return (htmlDependentesPet += `
          <div class="edit">
            <p>PET ${index + 1}:${dep.nome}</p>
              <p>Espécie: ${dep.especie}</p>
              <p>Raça: ${dep.raca}</p>
              <p>Altura: ${dep.altura} M</p>
              <p>Peso: ${dep.peso} Kg</p>
              <p>Porte: ${dep.porte}</p>
              <p>Cor: ${dep.cor}</p>
              <p>Data de Nascimento: ${moment(dep.dataNascimento).format('DD/MM/YYYY')}</p>
              <p>Modalidade: ${dep.resgate == "true" ? "Com resgate" : "Sem resgate"}</p>
              <p><span style="color: inherit;"><br></span></p>
          </div>
        `);
      });
      let cremHumano = dependentesHumanos._array.find((item) => !item.is_pet && item.cremacao);
      let cremPet = dependentesPets._array.find((item) => item.is_pet);

      //FORÇA O VENDEDOR SELECIONAR O TEMPLATE CORRETO
      if (contratoTratado.isCremado == true) {
        if (cremPet) {
          if (templateID != 4) {
            setCarregamentoButton(false)
            return toast.show({
              placement: "top",
              render: () => {
                return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário - Adc. Crem. Humana e PET!`} />
              }
            });
          }
        } else {
          if (templateID != 2) {
            setCarregamentoButton(false)
            return toast.show({
              placement: "top",
              render: () => {
                return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário - Adc. Crem. Humana!`} />
              }
            });
          }
        }
      } else {
        if (cremHumano) {
          if (cremPet) {
            if (templateID != 4) {
              setCarregamentoButton(false)
              return toast.show({
                placement: "top",
                render: () => {
                  return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário - Adc. Crem. Humana e PET!`} />
                }
              });
            }
          } else {
            if (templateID != 2) {
              setCarregamentoButton(false)
              return toast.show({
                placement: "top",
                render: () => {
                  return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário - Adc. Crem. Humana!`} />
                }
              });
            }
          }
        } else {
          if (cremPet) {
            if (templateID != 3) {
              setCarregamentoButton(false)
              return toast.show({
                placement: "top",
                render: () => {
                  return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário - Adc.Crem. PET!`} />
                }
              });
            }
          } else {
            if (templateID != 1) {
              setCarregamentoButton(false)
              return toast.show({
                placement: "top",
                render: () => {
                  return <ComponentToast message={`Selecionar template: TABLET VENDAS - Contrato Funerário!`} />
                }
              });
            }
          }
        }
      }

      const contratoCliente = {
        ...contratoTratado,
        dependentesPets: dependentesPets._array,
        dependentes: dependentesHumanos._array,
      };

      const contratoBody = new FormData();

      contratoBody.append("body", JSON.stringify(contratoCliente));

      let html;
      if (estado == 'PR') {
        if (templateID == 1) {
          html = `
                  <!DOCTYPE html>
  <html lang="pt-br">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  
  <body>
  
      <body>
          <div>
              <p style="text-align: center;"><b><span style="font-size: 16px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span></b><br>
              </p>
              <p></p>
          </div>
          <div>
              <p style="text-align: justify;"><span style="font-size: 14px;">Pelo
                      presente instrumento particular de contrato de prestação de serviços de
                      assistência funerária, de um lado, simplesmente denominada CONTRATADA, a
                      empresa ${unidadeTratado.razaoSocial}, pessoa jurídica de direito
                      privado, inscrita no CNPJ sob o nº ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro ${unidadeTratado.bairro}, CEP 79.826-110, ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
                      representante legal ao final assinado e do outro lado, o(a) consumidor(a),
                      identificado e qualificado na Ficha de Qualificação, parte integrante e
                      indissociável deste contrato, simplesmente denominado CONTRATANTE.</span><br>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>1.1</b>&nbsp;Pelo
                      presente instrumento a CONTRATADA, através de recursos próprios ou de empresas
                      designadas por ela, disponibilizará ao CONTRATANTE e seus beneficiários o Plano
                      de Assistência Familiar – Pax Primavera, objetivando prestação de serviços de
                      assistência funerária e outros benefícios extras que ficarão disponibilizados
                      para o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros do
                      plano optado e as condições especificadas abaixo:</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.2</b>&nbsp;Os
                      serviços de exumação, confecção de pedras, fotos, embelezamento e fornecimento
                      de jazigo/gaveta (túmulo), não serão cobertos neste contrato, sendo eventuais
                      despesas de inteira responsabilidade do CONTRATANTE.</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.3</b>&nbsp;Serviços
                      e despesas não contemplados neste contrato serão custeados pelo CONTRATANTE ou
                      o beneficiário responsável pelo funeral.</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.4</b>&nbsp;Todo
                      o serviço solicitado ou material adquirido que não atenda às especificações
                      deste contrato, bem como todo serviço ou produto adquirido junto a terceiros ou
                      empresas congêneres, sem autorização por escrito da CONTRATADA, será de inteira
                      e exclusiva responsabilidade do CONTRATANTE e seus dependentes, não cabendo
                      neste caso, qualquer tipo de restituição, reembolso, devolução ou indenização.</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA
                      GEOGRÁFICA</b>
              </h4>
          </div>
          <div>
              <p style="text-align: justify;"><span style="font-size: 14px;"><b>2.1</b>&nbsp;A
                      abrangência geográfica dos serviços disponibilizados pela CONTRATADA compreende
                      a localidade da sede Matriz e demais comarcas das filiais correspondentes.</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b><span style="font-size: 16px;">3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span></b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes serviços:<br></span>
              </p>
              <p></p>
              <ul>
                  <li><span style="font-size: 14px;">Plantão
                          24 horas para atendimento telefônico e auxílio de informações ao CONTRATANTE e
                          seus dependentes;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Atendimento
                          funerário nas localidades em que a empresa está instalada - Matriz ou filial;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Traslado
                          rodoviário para as áreas de atuação acima descritas, nos limites do plano
                          contratado e assinalado no Termo de Adesão;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Urna
                          mortuária estilo sextavado em conformidade com o plano adquirido;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Paramentação
                          conforme o credo religioso;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Carro
                          funerário para remoção, cortejo e sepultamento;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Decoração
                          de flores naturais e/ou artificiais na urna, conforme a disponibilidade de
                          mercado onde serão executados os serviços;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Velas;<br></span></li>
                  <li><span style="font-size: 14px;">Véu;<br></span></li>
                  <li><span style="font-size: 14px;">Livro
                          de presença;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Sala
                          de velório, apenas nas localidades onde a CONTRATADA mantém sala disponível.</span>
                  </li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE
                      ALIMENTAÇÃO</b></h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>4.1</b>&nbsp;Lanche
                      servido na capela: 50 (cinquenta) pães; 250g (duzentos e cinquenta gramas) de
                      manteiga; 02 (dois) litros de leite; 02 (dois) pacotes de bolacha de água e
                      sal; Chá e café à vontade.</span>
              </p>
              <p style=""><span style="font-size: 14px;"><b style="">4.2</b>&nbsp;Kit
                      lanche para residencial: 500g (quinhentos gramas) de chá; 500g (quinhentos
                      gramas) de café; 02kg (dois quilos) de açúcar; 01 (um) pacote de bolacha de
                      água e sal; 250g (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
                      café.</span>
              </p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo
                              Primeiro:</b> Eventual substituição de
                          produto em decorrência da falta de fabricação ou distribuição do mercado será
                          substituída por produto equivalente ou de igual valor.<br></span>
                  </p>
                  <p><span style="font-size: 12px;"><b>Parágrafo
                              Segundo:</b> Os itens compreendidos
                          acima fazem referência aos serviços e produtos mínimos ofertados para todos os
                          planos disponíveis da CONTRATADA.</span>
                  </p>
              </blockquote>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b><span style="font-size: 16px;">5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO </span></b></h4>
          <div>
              <p><span style="font-size: 14px;"><b>5.1</b> O meio de transporte a ser utlizadao para o translado do corpo
                      será
                      o rodoviário.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de inteira
                          responsabilidade do CONTRATANTE, podendo a CONTRATADA proceder apenas com a intermediação de
                          informações e apoio.</span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
                  <p><b style="color: inherit;">5.2</b><span style="color: inherit;"> Não haverá qualquer tipo de
                          reembolso de
                          quaisquer despesas efetuadas pelo CONTRATANTE em caso de solicitação de serviços não previstos
                          no
                          respectivo plano optado.</span><br></p>
              </span>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b><span style="font-size: 16px;">6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E
                      DEPENDENTES</span></b></h4>
          <div>
              <p><span style="font-size: 14px;"><b>6.1</b> A CONTRATADA fornecerá os serviços funerários correspondentes
                      ao
                      CONTRATANTE e seus dependentes, conforme plano escolhido no Termo de Adesão.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Primeiro:</b>&nbsp;Entende como beneficiários/dependentes
                          (pais, cônjuge, filhos enquanto solteiros mediante comprovação, filhos solteiros incapazes sem
                          limite de idade, ou dependentes com guarda judicial comprovada documentalmente). A alteração das
                          condições especificadas na cláusula acima excluirá a condição de dependentes e/ou beneficiários
                          do
                          respectivo contrato.</span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de novos
                          dependentes será considerada individualmente a obrigação do cumprimento da carência de 90
                          (noventa)
                          dias, que será contada a partir da data de sua inclusão.<br></span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha de
                          Qualificação, entre seus pais ou os pais do cônjuge, não sendo permitida a cobertura da
                          prestação
                          para ambos simultaneamente.<br></span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes prestadas
                          na
                          Ficha de Qualificação e no contrato de prestação de assistência funerária serão consideradas
                          verdadeiras, sob pena de responsabilidade civil e criminal do CONTRATANTE.<br></span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
                  <p><b style="color: inherit;">6.2</b><span style="color: inherit;"> O CONTRATANTE pagará a CONTRATADA no
                          ato
                          da assinatura do presente contrato, o valor estipulado no Termo de Adesão.</span><br></p>
              </span>
              <p></p>
              <p><span style="color: inherit; font-size: 14px;"><b>6.3</b> Todas as parcelas de preço terão seus
                      vencimentos
                      na data apontada no Termo de Adesão, salvo nos casos em que o vencimento recair em finais de semana
                      e
                      feriados nacionais e locais, hipótese em que serão automaticamente prorrogadas para o primeiro dia
                      útil
                      seguinte.<br></span></p>
              <p><span style="color: inherit; font-size: 14px;"><b>6.4</b> Caberá ao CONTRATANTE o pagamento da
                      mensalidade
                      total fixada para cada ano-base no Termo de Adesão, conforme tabela de preços descritos no Termo de
                      Adesão vigente à época, que estará sujeita a reajuste anual através da aplicação da variação
                      positiva do
                      índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que venha a substituí-lo, sendo que
                      a
                      data base para o reajuste se dará no primeiro dia de cada ano. A aplicação do índice poderá ser
                      revista
                      a qualquer tempo, sempre que houver necessidade de recomposição real de perdas inflacionárias não
                      refletidas no índice adotado ou quando a estrutura de custos da CONTRATADA assim o
                      exigir.<br></span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b style="font-size: 16px;">7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE
                  PAGAMENTO</b>
          </h4>
          <div>
              <p><span style="font-size: 14px;"><b>7.1</b> O presente contrato entrará em vigor na data em que houver o
                      efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60 (sessenta) meses, sendo
                      automaticamente renovado em caso de não manifestação contrária das Partes.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
                          “efetivo pagamento” será considerado o momento do recebimento do valor pactuado à vista em moeda
                          corrente;</span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
              <p><span style="font-size: 14px;"><b>7.2</b> Fica pactuado que o CONTRATANTE e os
                          dependentes terão direito a usufruir dos benefícios contratados relativos ao plano escolhido
                          após a
                          carência de 90 (noventa) dias, contados da data do pagamento integral da taxa de adesão ou da
                          primeira parcela.</span></p>
              </span>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                      <p><span style="font-size: 12px;"><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                              mora
                              a partir do primeiro dia do vencimento da primeira mensalidade referente ao plano aderido,
                              independente de notificação, ficando os serviços terminantemente suspensos;</span></p>
                      <p><span style="font-size: 12px;"><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                              rescindido após três meses de atraso.</span></p>
              </blockquote>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="font-size: 16px; text-align: center;"><b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>8.1</b>&nbsp;O
                      não pagamento das quantias devidas dentro do prazo convencionado na aquisição
                      do Termo de Adesão implicará na incidência de multa de 2,0% (dois por cento) do
                      valor devido e não pago, acrescida de juros de mora de 1,0%, (um por cento) ao mês
                      e correção monetária pela aplicação da variação positiva do IGP-M (Índice Geral
                      de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação da multa,
                      juros e atualização monetária é automática, inexistindo, de pleno direito, a
                      necessidade de comunicação prévia de qualquer das Partes a outra.</span><br>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS
                      PARTES</b></h4>
          </div>
          <div>
              <p><b>DA CONTRATADA:</b></p>
              <p><span style="font-size: 14px;"><b>9.1</b>&nbsp;Executar
                      os serviços contratados de forma objetiva ao CONTRATANTE;</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.2</b>&nbsp;Facilitar
                      acesso às informações necessárias dos serviços oferecidos aos beneficiários;</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.3</b> Cumprir
                      o plano contratado com estrita observância das condições e cláusulas descritas
                      neste contrato e anexos.</span>
              </p>
              <p><b>DO(A) CONTRATANTE</b></p>
              <p><span style="font-size: 14px;"><b>9.4</b>&nbsp;Manter
                      em dia o pagamento das mensalidades, bem como, seus dados cadastrais devidamente
                      atualizados.</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.5</b>&nbsp;Comunicar,
                      imediatamente, o falecimento de qualquer dos beneficiários do plano, para que
                      se possa usufruir dos serviços contratados;</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E
                      SEUS
                      EFEITOS</b></h4>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b>10.1</b>&nbsp;No
                          caso de inadimplência de três mensalidades, o contrato será rescindido sem que
                          haja a incidência de qualquer multa, desde que o CONTRATANTE e seus dependentes
                          não tenham utilizado os serviços fúnebres.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.2</b>&nbsp;Após
                          a prestação dos serviços fúnebres e caso o contrato vigente tenha mais de 60
                          (sessenta) meses de duração, poderão os herdeiros requisitar o cancelamento do
                          contrato sem qualquer ônus, no entanto, se o contrato for cancelado antes do
                          período citado e havendo a prestação de serviços fúnebres, caberá aos herdeiros
                          o pagamento do residual gasto com o serviço prestado, independente da
                          desvinculação pelo cancelamento contratual.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.3</b>&nbsp;Ensejando
                          no cancelamento do contrato e com a devida prestação dos serviços, a CONTRATADA
                          estará responsável pela apuração do saldo devedor para a devida quitação dos
                          serviços prestados, apresentando de forma objetiva e clara os custos dos
                          serviços para sua devida quitação.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.4</b>&nbsp;O
                          saldo remanescente deverá ser quitado na forma à vista, ou por meio de
                          confissão de dívida para emissão de boleto bancário.</span>
                  </p>
                  <p><span><span style="font-size: 14px;"><b>10.5</b>&nbsp;Emitido
                              o boleto, e não havendo o pagamento no vencimento, o devedor será inserido no SCPC
                              e Serasa, bem como, serão tomadas as medidas judiciais cabíveis para a devida
                              quitação da dívida.</span><br></span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE
                      TITULARIDADE</b></h1>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b>11.1</b>&nbsp;Em
                          caso de falecimento do CONTRATANTE, poderão os dependentes ou responsável
                          legal, assumir o contrato principal, passando assim a ser responsável dos
                          direitos e obrigações assumidos neste contrato, sendo respeitado a obrigação do
                          cumprimento da carência de 90 (noventa) dias para qualquer novo titular o
                          dependente, conforme especificado na Cláusula 6.1.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>11.2</b>&nbsp;Para
                          a transferência da titularidade, é imprescindível que o contrato esteja livre
                          de qualquer débito e haja a anuência do antigo e do novo titular.</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
              </h1>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b style="">12.1</b>&nbsp;Qualquer
                          documento, anexo ou outros instrumentos decorrentes de alterações contratuais,
                          substituições, consolidações e respectivas complementações faz parte integrante
                          do presente contrato, salvo se expressamente disposto de forma diversa.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>12.2</b>&nbsp;Caso
                          uma mesma pessoa seja designada beneficiária em mais de um contrato, será
                          válido apenas um dos contratos.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>12.3</b>&nbsp;Todas
                          as referências a quaisquer Partes deste contrato incluem seus sucessores,
                          beneficiários, representantes.</span>
                  </p>
                  <p><b style="font-size: 14px; color: inherit;">12.4</b><span
                          style="font-size: 14px; color: inherit;">&nbsp;Faz
                          parte integrante e indissociável deste contrato, como se nele estivessem
                          transcritos, a Ficha de Qualificação, o Termo de Adesão e demais anexos, cujo
                          conteúdo o CONTRATANTE declara haver tomado amplo conhecimento, tendo aceitado
                          todos os seus termos, sem qualquer restrição ou objeção.</span>
                  </p>
                  <p><b style="font-size: 14px; color: inherit;">12.5</b><span
                          style="font-size: 14px; color: inherit;">&nbsp;As Partes
                          reconhecem como válidas eficazes e suficientes às comunicações, notificações e
                          cobranças enviadas para o endereço indicado na Ficha de Qualificação, cabendo a
                          este informar a CONTRATADA sobre qualquer alteração de endereço ou de seus
                          dados cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
                          contados do evento.</span>
                  </p>
                  <p><span style="font-size: 14px; color: inherit;"><b>12.6&nbsp;</b>A
                          mensalidade tem como principal objetivo a manutenção e disponibilização de toda
                          a infraestrutura necessária ao atendimento desse serviço e, desta forma, a não
                          ocorrência de falecimento dos beneficiários não implica em qualquer forma de
                          reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os demais
                          serviços estavam sendo oferecidos.</span>
                  </p>
                  <p><span style="font-size: 14px; color: inherit;"><b>12.7</b>&nbsp;O
                          não exercício, da CONTRATADA, de quaisquer dos direitos ou prerrogativas
                          previstas neste contrato ou seus anexos, ou mesmo na legislação aplicável, será
                          tido como ato de mera liberalidade, não constituindo alteração ou novação das
                          obrigações ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
                          tempo, independentemente de comunicação prévia à outra parte.</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><strong>PARTES:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>,
                      nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                      CONTRATO, por estar plenamente ciente dos termos, reafirmo meu dever de observar e fazer cumprir as cláusulas aqui
                      estabelecidas.</span></p>
              <p><span style="font-size: 14px;"><strong>TESTEMUNHA:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do CONTRATO.</span></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b></h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b>DADOS DO TITULAR</b></p>
              <p>Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style="">${contratoCliente.nomeTitular}</span>&nbsp;</p>
              <p>R.G.:&nbsp;<span class="RG_TITULAR token_d4s">${contratoCliente.rgTitular}</span>&nbsp;</p>
              <p>CPF:&nbsp;<span class="CPF_TITULAR token_d4s">${contratoCliente.cpfTitular}</span>&nbsp;</p>
              <p>Sexo: <span class="SEXO_TITULAR token_d4s">${contratoCliente.sexoTitular}</span>&nbsp;</p>
              <p>Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"><span
                          class="DA_Nasc_Titular token_d4s"><span
                              class="DATA_NASC_TITULAR token_d4s">${contratoCliente.dataNascTitular}</span>&nbsp;</span></span>
              </p>
              <p>Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"><span
                          class="ESTADO_CIVIL_TITULAR token_d4s">${contratoCliente.estadoCivilTitular}</span>&nbsp;</span>
              </p>
              <p><span style="color: inherit;">Profissão: <span
                          class="PROFISSAO_TITULAR token_d4s">${contratoCliente.profissaoTitular}</span>&nbsp;</span></p>
              <p><span style="color: inherit;">Religião:&nbsp;<span class="Religiao_Titular token_d4s"><span
                              class="RELIGIAO_TITULAR token_d4s">${contratoCliente.religiaoTitular}</span>&nbsp;</span></span>
              </p>
              <p>Naturalidade: ${contratoCliente.naturalidadeTitular}</p>
              <p>Nacionalidade: <span
                      class="NACIONALIDADE_TITULAR token_d4s">${contratoCliente.nacionalidadeTitular}</span>&nbsp;</p>
              <p>Telefone 01: <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span>&nbsp;</p>
              <p>Telefone 02: <span class="TELEFONE_02 token_d4s">${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span>&nbsp;</p>
              <p>E-mail 01: <span class="EMAIL01 token_d4s"><span
                          class="EMAIL_01 token_d4s">${contratoCliente.email1}</span>&nbsp;</span>&nbsp;</p>
              <p>E-mail 02: <span class="EMAIL_02 token_d4s" style="">${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span>&nbsp;</p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><b>DADOS RESIDENCIAIS</b></p>
                  <p><span style="color: inherit;">Endereço Residencial:&nbsp;</span><span style="color: inherit;"><span
                              class="ENDERECO_RES token_d4s"><span
                                  class="ENDERECO_RESIDENCIAL token_d4s">${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}</span></span></span></p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.numeroResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.complementoResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.bairroResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.cepResidencial}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.cidadeResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.estadoResidencial}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
              <div class="edit">
                  <p><b>DADOS COMERCIAIS</b></p>
                  <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                  ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                  </p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><b>DEPENDENTES</b></p>
                      ${htmlDependentesHumano}
              </div>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b></h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 01</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, silk-screen
                          prateado, guarnição (friso) na tampa, madeira pinnus, tingida na cor nogueira, verniz alto
                          brilho,
                          fundo e tampa de eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor dourada,
                          forro
                          e babado rendão tecido 50g branco, taxas douradas, travesseiro solto. (Marca: De acordo com
                          fornecedor vigente)<br></span></li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação conforme o credo
                              religioso;</span><br></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 100Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 02</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA
                          MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais do fundo e tampa
                          entalhada em baixo relevo, 2 sobretampos entalhados em alto relevo, guarnição
                          (friso) na tampa, madeira pinnus tingida na cor mogno, verniz alto brilho,
                          fundo Eucatex, 6 fixadores tipo concha com varões, laterais dourados, 9
                          chavetas fundidas e pintadas na cor dourada, forrada em tecido branco com renda
                          larga, sobre babado (rendão) branco com 20 cm de largura, taxas douradas, visor
                          médio de vidro rodeado por renda larga, travesseiro solto. (Marca: De acordo
                          com fornecedor vigente)<br></span>
                  </li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação
                              conforme o credo religioso;</span><br></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">01
                              (uma) coroa de flores grande, naturais e/ou artificiais, conforme a
                              disponibilidade de mercado onde será executado os serviços;<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Abertura
                              de jazigo (não se confundindo com o fornecimento de túmulo / gaveta);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Tanatopraxia
                              (preparação do corpo);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">01
                              (uma) veste, disponível na ocasião;<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 250Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 03</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA
                          MORTUÁRIA: Estilo sextavado com 1,90m internamente, silk-screen prateado,
                          guarnição (friso) na tampa, madeira pinnus, tingida na cor nogueira, verniz
                          alto brilho, fundo e tampa de eucatex, 6 (seis) alças parreira, 4 (quatro)
                          chavetas, ambas na cor dourada, forro e babado rendão tecido 50g branco, taxas
                          douradas, travesseiro solto. (Marca: De acordo com fornecedor vigente)<br></span>
                  </li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação conforme o credo
                              religioso;</span><br></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Tanatopraxia
                              (preparação do corpo);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 150Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b style="font-size: 16px;">ANEXO 03 - TERMO DE ADESÃO</b>
              </h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b>DADOS DO CONTRATO</b></p>
              <p></p>
              <ul>
                  <li>Plano Selecionado:&nbsp;<span
                          class="PLANO_SELECIONADO token_d4s">${planoTratado.descricao}</span>&nbsp;
                  </li>
                  <li><span style="color: inherit;">Formato da&nbsp;Venda: </span><span
                          class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
                          style="color: inherit;">${contratoCliente.tipo}</span><span
                          style="color: inherit;">&nbsp;</span>
                  </li>
                  <ul>
                      <li><span style="font-size: 12px;"><b>Em caso de transferência:</b></span></li>
                      <ul>
                          <li><span style="font-size: 12px;">Empresa Anterior: <span
                                      class="EMPRESA_ANTERIOR token_d4s">${contratoCliente.empresaAntiga == 'null' ? " " : contratoCliente.empresaAntiga}</span>&nbsp;</span>
                          </li>
                          <li><span style="font-size: 12px;">Data de Assinatura do Contrato Anterior: <span
                                      class="DATA_CONTRATO_ANTERIOR token_d4s">${contratoCliente.dataContratoAntigo == 'null' ? " " : contratoCliente.dataContratoAntigo}</span>&nbsp;</span>
                          </li>
                      </ul>
                  </ul>
              </ul>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                      <p></p>
                  </blockquote>
              </blockquote>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b style="font-size: 14px;">TAXA DE ADESÃO</b></p>
              <p></p>
              <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
                  <li style="font-size: 14px;"><b style="font-size: 16px;">Total da Taxa de Adesão:R$ ${planoTratado.valorAdesao}</b></li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b style="font-size: 14px;">MENSALIDADE</b></p>
              <p></p>
              <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}&nbsp</li>
                  <li>Acréscimo de Adicionais: R$ ${valorAdicional}</li>
                  <li>Quantidade de Adicionais: ${qtdAdicional}</li>
                  <li><b><span style="font-size: 16px;">Total da Mensalidade: <span
                                  class="MENSALIDADE_TOTAL token_d4s">R$ ${valorTotalMensalidade}</span>&nbsp;</span></b></li>
              </ul>
              <p><b style="font-size: 14px;">REAJUSTE CONFORME IGPM</b></p>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>DADOS DE PAGAMENTO</b></span></p>
              <p></p>
              <ul>
                  <li>Data de Vencimento da Primeira Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
                  </li>
                  <li>Forma de Pagamento: <span
                          class="FORMA_PAGAMENTO token_d4s">${contratoCliente.localCobranca}</span>&nbsp;</li>
                  <ul>
                      <li>Em caso de cobrador, qual o endereço de cobrança?</li>
                      <ul>
                          <li>Endereço de Cobrança: <span
                                  class="ENDERECO_COBRANCA token_d4s">${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}, ${contratoCliente.numeroResidencial},
                                  QUADRA:
                                  ${contratoCliente.quadraResidencial}, LOTE: ${contratoCliente.loteResidencial},
                                  Complemento:
                                  ${contratoCliente.complementoResidencial}, Bairro: ${contratoCliente.bairroResidencial},
                                  ${contratoCliente.cepResidencial}</span>&nbsp;</li>
                          <li>Melhor Horário: <span
                                  class="HORARIO_COBRANCA token_d4s">${contratoCliente.melhorHorario}</span>&nbsp;</li>
                      </ul>
                  </ul>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <ul>
                  <li><span style="font-size: 14px;">Caso
                          a cobrança não seja efetuada até a data do vencimento, o CONTRATANTE se
                          responsabiliza a efetuar o pagamento no escritório da CONTRATADA.</span>
                  </li>
                  <li><span style="font-size: 14px;">A
                          CONTRATADA se reserva ao direito de alterar as formas de pagamento
                          disponibilizadas para o CONTRATANTE.</span><br>
                  </li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><strong>PARTES:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>,
                      nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                      CONTRATO, e,
                      por estar plenamente ciente dos termos, reafirmo meu dever de observar e fazer cumprir as cláusulas
                      aqui
                      estabelecidas.</span></p>
              <p><span style="font-size: 14px;"><strong>TESTEMUNHA:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a celebração,
                      entre as
                      partes, do CONTRATO.</span></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
      </body>
  </html>
                  `
        } else if (templateID == 2) {
          html = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Page Title</title>
                    </head>
                    <body>
                      <div>
                        <p style="text-align: center">
                          <b
                            ><span style="font-size: 16px"
                              >CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span
                            ></b
                          ><br />
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: justify">
                          <span style="font-size: 14px"
                            >Pelo presente instrumento particular de contrato de prestação de
                            serviços de assistência funerária, de um lado, simplesmente denominada
                            CONTRATADA, a empresa ${unidadeTratado.razaoSocial}, pessoa jurídica
                            de direito privado, inscrita no CNPJ sob o nº
                            ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua
                            ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro
                            ${unidadeTratado.bairro}, CEP 79.826-110,
                            ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
                            representante legal ao final assinado e do outro lado, o(a)
                            consumidor(a), identificado e qualificado na Ficha de Qualificação,
                            parte integrante e indissociável deste contrato, simplesmente
                            denominado CONTRATANTE.</span
                          ><br />
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.1</b>&nbsp;Pelo presente instrumento a CONTRATADA, através de
                            recursos próprios ou de empresas designadas por ela, disponibilizará
                            ao CONTRATANTE e seus beneficiários o Plano de Assistência Familiar –
                            Pax Primavera, objetivando prestação de serviços de assistência
                            funerária e outros benefícios extras que ficarão disponibilizados para
                            o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros
                            do plano optado e as condições especificadas abaixo:</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.2</b>&nbsp;Os serviços de exumação, confecção de pedras, fotos,
                            embelezamento e fornecimento de jazigo/gaveta (túmulo), não serão
                            cobertos neste contrato, sendo eventuais despesas de inteira
                            responsabilidade do CONTRATANTE.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.3</b>&nbsp;Serviços e despesas não contemplados neste contrato
                            serão custeados pelo CONTRATANTE ou o beneficiário responsável pelo
                            funeral.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.4</b>&nbsp;Todo o serviço solicitado ou material adquirido que
                            não atenda às especificações deste contrato, bem como todo serviço ou
                            produto adquirido junto a terceiros ou empresas congêneres, sem
                            autorização por escrito da CONTRATADA, será de inteira e exclusiva
                            responsabilidade do CONTRATANTE e seus dependentes, não cabendo neste
                            caso, qualquer tipo de restituição, reembolso, devolução ou
                            indenização.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA GEOGRÁFICA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p style="text-align: justify">
                          <span style="font-size: 14px"
                            ><b>2.1</b>&nbsp;A abrangência geográfica dos serviços
                            disponibilizados pela CONTRATADA compreende a localidade da sede
                            Matriz e demais comarcas das filiais correspondentes.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b
                            ><span style="font-size: 16px"
                              >3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span
                            ></b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes
                            serviços:</span>
                        </p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Plantão 24 horas para atendimento telefônico e auxílio de
                              informações ao CONTRATANTE e seus dependentes;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Atendimento funerário nas localidades em que a empresa está
                              instalada - Matriz ou filial;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Traslado rodoviário para as áreas de atuação acima descritas, nos
                              limites do plano contratado e assinalado no Termo de Adesão;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Urna mortuária estilo sextavado em conformidade com o plano
                              adquirido;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Paramentação conforme o credo religioso;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Carro funerário para remoção, cortejo e sepultamento;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Decoração de flores naturais e/ou artificiais na urna, conforme a
                              disponibilidade de mercado onde serão executados os serviços;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Velas;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Véu;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Livro de presença;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Sala de velório, apenas nas localidades onde a CONTRATADA mantém
                              sala disponível.</span
                            >
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE ALIMENTAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>4.1</b>&nbsp;Lanche servido na capela: 50 (cinquenta) pães; 250g
                            (duzentos e cinquenta gramas) de manteiga; 02 (dois) litros de leite;
                            02 (dois) pacotes de bolacha de água e sal; Chá e café à
                            vontade.</span
                          >
                        </p>
                        <p style="">
                          <span style="font-size: 14px"
                            ><b style="">4.2</b>&nbsp;Kit lanche para residencial: 500g
                            (quinhentos gramas) de chá; 500g (quinhentos gramas) de café; 02kg
                            (dois quilos) de açúcar; 01 (um) pacote de bolacha de água e sal; 250g
                            (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
                            café.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Primeiro:</b> Eventual substituição de produto em
                              decorrência da falta de fabricação ou distribuição do mercado será
                              substituída por produto equivalente ou de igual valor.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Segundo:</b> Os itens compreendidos acima fazem
                              referência aos serviços e produtos mínimos ofertados para todos os
                              planos disponíveis da CONTRATADA.</span
                            >
                          </p>
                        </blockquote>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b
                          ><span style="font-size: 16px"
                            >5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO
                          </span></b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>5.1</b> O meio de transporte a ser utlizadao para o translado do
                            corpo será o rodoviário.</span
                          >
                        </p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de
                              inteira responsabilidade do CONTRATANTE, podendo a CONTRATADA
                              proceder apenas com a intermediação de informações e apoio.</span
                            >
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">5.2</b
                            ><span style="color: inherit">
                              Não haverá qualquer tipo de reembolso de quaisquer despesas
                              efetuadas pelo CONTRATANTE em caso de solicitação de serviços não
                              previstos no respectivo plano optado.</span
                            ><br />
                          </p>
                        </span>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b
                          ><span style="font-size: 16px"
                            >6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E DEPENDENTES</span
                          ></b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>6.1</b> A CONTRATADA fornecerá os serviços funerários
                            correspondentes ao CONTRATANTE e seus dependentes, conforme plano
                            escolhido no Termo de Adesão.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Primeiro:</b>&nbsp;Entende como
                              beneficiários/dependentes (pais, cônjuge, filhos enquanto solteiros
                              mediante comprovação, filhos solteiros incapazes sem limite de
                              idade, ou dependentes com guarda judicial comprovada
                              documentalmente). A alteração das condições especificadas na
                              cláusula acima excluirá a condição de dependentes e/ou beneficiários
                              do respectivo contrato.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de
                              novos dependentes será considerada individualmente a obrigação do
                              cumprimento da carência de 90 (noventa) dias, que será contada a
                              partir da data de sua inclusão.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha
                              de Qualificação, entre seus pais ou os pais do cônjuge, não sendo
                              permitida a cobertura da prestação para ambos simultaneamente.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes
                              prestadas na Ficha de Qualificação e no contrato de prestação de
                              assistência funerária serão consideradas verdadeiras, sob pena de
                              responsabilidade civil e criminal do CONTRATANTE.<br
                            /></span>
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">6.2</b
                            ><span style="color: inherit">
                              O CONTRATANTE pagará a CONTRATADA no ato da assinatura do presente
                              contrato, o valor estipulado no Termo de Adesão.</span
                            ><br />
                          </p>
                        </span>
                        <p></p>
                        <p>
                          <span style="color: inherit; font-size: 14px"
                            ><b>6.3</b> Todas as parcelas de preço terão seus vencimentos na data
                            apontada no Termo de Adesão, salvo nos casos em que o vencimento
                            recair em finais de semana e feriados nacionais e locais, hipótese em
                            que serão automaticamente prorrogadas para o primeiro dia útil
                            seguinte.<br
                          /></span>
                        </p>
                        <p>
                          <span style="color: inherit; font-size: 14px"
                            ><b>6.4</b> Caberá ao CONTRATANTE o pagamento da mensalidade total
                            fixada para cada ano-base no Termo de Adesão, conforme tabela de
                            preços descritos no Termo de Adesão vigente à época, que estará
                            sujeita a reajuste anual através da aplicação da variação positiva do
                            índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que
                            venha a substituí-lo, sendo que a data base para o reajuste se dará no
                            primeiro dia de cada ano. A aplicação do índice poderá ser revista a
                            qualquer tempo, sempre que houver necessidade de recomposição real de
                            perdas inflacionárias não refletidas no índice adotado ou quando a
                            estrutura de custos da CONTRATADA assim o exigir.<br
                          /></span>
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b style="font-size: 16px"
                          >7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE PAGAMENTO</b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.1</b> O presente contrato entrará em vigor na data em que houver
                            o efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60
                            (sessenta) meses, sendo automaticamente renovado em caso de não
                            manifestação contrária das Partes.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
                              “efetivo pagamento” será considerado o momento do recebimento do
                              valor pactuado à vista em moeda corrente;</span
                            >
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">7.2</b
                            ><span style="color: inherit">
                              Fica pactuado que o CONTRATANTE e os dependentes terão direito a
                              usufruir dos benefícios contratados relativos ao plano escolhido
                              após a carência de 90 (noventa) dias, contados da data do pagamento
                              integral da taxa de adesão ou da primeira parcela.</span
                            ><br />
                          </p>
                        </span>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p></p>
                          <div class="edit">
                            <p>
                              <span style="font-size: 12px"
                                ><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                                mora a partir do primeiro dia do vencimento da primeira
                                mensalidade referente ao plano aderido, independente de
                                notificação, ficando os serviços terminantemente suspensos;</span
                              >
                            </p>
                          </div>
                          <p></p>
                          <p></p>
                          <div class="edit">
                            <p>
                              <span style="font-size: 12px"
                                ><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                                rescindido após três meses de atraso.</span
                              >
                            </p>
                          </div>
                          <p></p>
                        </blockquote>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="font-size: 16px; text-align: center">
                          <b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>8.1</b>&nbsp;O não pagamento das quantias devidas dentro do prazo
                            convencionado na aquisição do Termo de Adesão implicará na incidência
                            de multa de 2,0% (dois por cento) do valor devido e não pago,
                            acrescida de juros de mora de 1,0%, (um por cento) ao mês e correção
                            monetária pela aplicação da variação positiva do IGP-M (Índice Geral
                            de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação
                            da multa, juros e atualização monetária é automática, inexistindo, de
                            pleno direito, a necessidade de comunicação prévia de qualquer das
                            Partes a outra.</span
                          ><br />
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS PARTES</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p><b>DA CONTRATADA:</b></p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.1</b>&nbsp;Executar os serviços contratados de forma objetiva ao
                            CONTRATANTE;</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.2</b>&nbsp;Facilitar acesso às informações necessárias dos
                            serviços oferecidos aos beneficiários;</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.3</b> Cumprir o plano contratado com estrita observância das
                            condições e cláusulas descritas neste contrato e anexos.</span
                          >
                        </p>
                        <p><b>DO(A) CONTRATANTE</b></p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.4</b>&nbsp;Manter em dia o pagamento das mensalidades, bem como,
                            seus dados cadastrais devidamente atualizados.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.5</b>&nbsp;Comunicar, imediatamente, o falecimento de qualquer
                            dos beneficiários do plano, para que se possa usufruir dos serviços
                            contratados;</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E SEUS EFEITOS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.1</b>&nbsp;No caso de inadimplência de três mensalidades, o
                              contrato será rescindido sem que haja a incidência de qualquer
                              multa, desde que o CONTRATANTE e seus dependentes não tenham
                              utilizado os serviços fúnebres.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.2</b>&nbsp;Após a prestação dos serviços fúnebres e caso o
                              contrato vigente tenha mais de 60 (sessenta) meses de duração,
                              poderão os herdeiros requisitar o cancelamento do contrato sem
                              qualquer ônus, no entanto, se o contrato for cancelado antes do
                              período citado e havendo a prestação de serviços fúnebres, caberá
                              aos herdeiros o pagamento do residual gasto com o serviço prestado,
                              independente da desvinculação pelo cancelamento contratual.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.3</b>&nbsp;Ensejando no cancelamento do contrato e com a
                              devida prestação dos serviços, a CONTRATADA estará responsável pela
                              apuração do saldo devedor para a devida quitação dos serviços
                              prestados, apresentando de forma objetiva e clara os custos dos
                              serviços para sua devida quitação.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.4</b>&nbsp;O saldo remanescente deverá ser quitado na forma à
                              vista, ou por meio de confissão de dívida para emissão de boleto
                              bancário.</span
                            >
                          </p>
                          <p>
                            <span
                              ><span style="font-size: 14px"
                                ><b>10.5</b>&nbsp;Emitido o boleto, e não havendo o pagamento no
                                vencimento, o devedor será inserido no SCPC e Serasa, bem como,
                                serão tomadas as medidas judiciais cabíveis para a devida quitação
                                da dívida.</span
                              ><br
                            /></span>
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE TITULARIDADE</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b>11.1</b>&nbsp;Em caso de falecimento do CONTRATANTE, poderão os
                              dependentes ou responsável legal, assumir o contrato principal,
                              passando assim a ser responsável dos direitos e obrigações assumidos
                              neste contrato, sendo respeitado a obrigação do cumprimento da
                              carência de 90 (noventa) dias para qualquer novo titular o
                              dependente, conforme especificado na Cláusula 6.1.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>11.2</b>&nbsp;Para a transferência da titularidade, é
                              imprescindível que o contrato esteja livre de qualquer débito e haja
                              a anuência do antigo e do novo titular.</span
                            >
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b style="">12.1</b>&nbsp;Qualquer documento, anexo ou outros
                              instrumentos decorrentes de alterações contratuais, substituições,
                              consolidações e respectivas complementações faz parte integrante do
                              presente contrato, salvo se expressamente disposto de forma
                              diversa.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>12.2</b>&nbsp;Caso uma mesma pessoa seja designada beneficiária
                              em mais de um contrato, será válido apenas um dos contratos.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>12.3</b>&nbsp;Todas as referências a quaisquer Partes deste
                              contrato incluem seus sucessores, beneficiários,
                              representantes.</span
                            >
                          </p>
                          <p>
                            <b style="font-size: 14px; color: inherit">12.4</b
                            ><span style="font-size: 14px; color: inherit"
                              >&nbsp;Faz parte integrante e indissociável deste contrato, como se
                              nele estivessem transcritos, a Ficha de Qualificação, o Termo de
                              Adesão e demais anexos, cujo conteúdo o CONTRATANTE declara haver
                              tomado amplo conhecimento, tendo aceitado todos os seus termos, sem
                              qualquer restrição ou objeção.</span
                            >
                          </p>
                          <p>
                            <b style="font-size: 14px; color: inherit">12.5</b
                            ><span style="font-size: 14px; color: inherit"
                              >&nbsp;As Partes reconhecem como válidas eficazes e suficientes às
                              comunicações, notificações e cobranças enviadas para o endereço
                              indicado na Ficha de Qualificação, cabendo a este informar a
                              CONTRATADA sobre qualquer alteração de endereço ou de seus dados
                              cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
                              contados do evento.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px; color: inherit"
                              ><b>12.6&nbsp;</b>A mensalidade tem como principal objetivo a
                              manutenção e disponibilização de toda a infraestrutura necessária ao
                              atendimento desse serviço e, desta forma, a não ocorrência de
                              falecimento dos beneficiários não implica em qualquer forma de
                              reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os
                              demais serviços estavam sendo oferecidos.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px; color: inherit"
                              ><b>12.7</b>&nbsp;O não exercício, da CONTRATADA, de quaisquer dos
                              direitos ou prerrogativas previstas neste contrato ou seus anexos,
                              ou mesmo na legislação aplicável, será tido como ato de mera
                              liberalidade, não constituindo alteração ou novação das obrigações
                              ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
                              tempo, independentemente de comunicação prévia à outra parte.</span
                            >
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>DADOS DO TITULAR</b></p>
                        <p>
                          Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style=""
                            >${contratoCliente.nomeTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          R.G.:&nbsp;<span class="RG_TITULAR token_d4s"
                            >${contratoCliente.rgTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          CPF:&nbsp;<span class="CPF_TITULAR token_d4s"
                            >${contratoCliente.cpfTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Sexo:
                          <span class="SEXO_TITULAR token_d4s"
                            >${contratoCliente.sexoTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"
                            ><span class="DA_Nasc_Titular token_d4s"
                              ><span class="DATA_NASC_TITULAR token_d4s"
                                >${contratoCliente.dataNascTitular}</span
                              >&nbsp;</span
                            ></span
                          >
                        </p>
                        <p>
                          Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"
                            ><span class="ESTADO_CIVIL_TITULAR token_d4s"
                              >${contratoCliente.estadoCivilTitular}</span
                            >&nbsp;</span
                          >
                        </p>
                        <p>
                          <span style="color: inherit"
                            >Profissão:
                            <span class="PROFISSAO_TITULAR token_d4s"
                              >${contratoCliente.profissaoTitular}</span
                            >&nbsp;</span
                          >
                        </p>
                        <p>
                          <span style="color: inherit"
                            >Religião:&nbsp;<span class="Religiao_Titular token_d4s"
                              ><span class="RELIGIAO_TITULAR token_d4s"
                                >${contratoCliente.religiaoTitular}</span
                              >&nbsp;</span
                            ></span
                          ><br />
                        </p>
                        <p>Naturalidade:${contratoCliente.naturalidadeTitular}<br /></p>
                        <p>
                          Nacionalidade:
                          <span class="NACIONALIDADE_TITULAR token_d4s"
                            >${contratoCliente.nacionalidadeTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Telefone 01:
                          <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span
                          >&nbsp;
                        </p>
                        <p>
                          Telefone 02:
                          <span class="TELEFONE_02 token_d4s"
                            >${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span
                          >&nbsp;
                        </p>
                        <p>
                          E-mail 01:
                          <span class="EMAIL01 token_d4s"
                            ><span class="EMAIL_01 token_d4s">${contratoCliente.email1}</span
                            >&nbsp;</span
                          >&nbsp;
                        </p>
                        <p>
                          E-mail 02:
                          <span class="EMAIL_02 token_d4s" style=""
                            >${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span
                          >&nbsp;
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p><b>DADOS RESIDENCIAIS</b></p>
                          <p>
                            <span style="color: inherit">Endereço Residencial:&nbsp;</span
                            ><span style="color: inherit"
                              ><span class="ENDERECO_RES token_d4s"
                                ><span class="ENDERECO_RESIDENCIAL token_d4s"
                                  >${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}</span
                                ></span
                              ></span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Número:
                              <span class="NUMERO_END_RESIDENCIAL token_d4s"
                                >${contratoCliente.numeroResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Complemento:
                              <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                                >${contratoCliente.complementoResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Bairro:
                              <span class="BAIRRO_RESIDENCIAL token_d4s"
                                >${contratoCliente.bairroResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >CEP:
                              <span class="CEP_RESIDENCIAL token_d4s"
                                >${contratoCliente.cepResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Cidade:
                              <span class="CIDADE_RESIDENCIAL token_d4s"
                                >${contratoCliente.cidadeResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >U.F:
                              <span class="ESTADO_RESIDENCIAL token_d4s"
                                >${contratoCliente.estadoResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                        </div>
                        <p></p>
                        <div class="edit">
                  <p><b>DADOS COMERCIAIS</b></p>
                  <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                  ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                  </p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p><b>DEPENDENTES</b></p>
                          ${htmlDependentesHumano}
                        </div>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 01</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 100Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 02</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais
                              do fundo e tampa entalhada em baixo relevo, 2 sobretampos entalhados
                              em alto relevo, guarnição (friso) na tampa, madeira pinnus tingida
                              na cor mogno, verniz alto brilho, fundo Eucatex, 6 fixadores tipo
                              concha com varões, laterais dourados, 9 chavetas fundidas e pintadas
                              na cor dourada, forrada em tecido branco com renda larga, sobre
                              babado (rendão) branco com 20 cm de largura, taxas douradas, visor
                              médio de vidro rodeado por renda larga, travesseiro solto. (Marca:
                              De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                                conforme a disponibilidade de mercado onde será executado os
                                serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Abertura de jazigo (não se confundindo com o fornecimento de
                                túmulo / gaveta);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Tanatopraxia (preparação do corpo);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >01 (uma) veste, disponível na ocasião;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 250Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 03</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Tanatopraxia (preparação do corpo);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 150Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b style="font-size: 16px">ANEXO 03 - TERMO DE ADESÃO</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>DADOS DO CONTRATO</b></p>
                        <p></p>
                        <ul>
                          <li>
                            Plano Selecionado:&nbsp;<span class="PLANO_SELECIONADO token_d4s"
                              >${planoTratado.descricao}</span
                            >&nbsp;
                          </li>
                          <li>
                            <span style="color: inherit">Formato da&nbsp;Venda: </span
                            ><span
                              class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
                              style="color: inherit"
                              >${contratoCliente.tipo}</span
                            ><span style="color: inherit">&nbsp;</span>
                          </li>
                          <ul>
                            <li>
                              <span style="font-size: 12px"
                                ><b>Em caso de transferência:</b></span
                              >
                            </li>
                            <ul>
                              <li>
                                <span style="font-size: 12px"
                                  >Empresa Anterior:
                                  <span class="EMPRESA_ANTERIOR token_d4s"
                                    >${contratoCliente.empresaAntiga == 'null' ? " " :
              contratoCliente.empresaAntiga}</span
                                  >&nbsp;</span
                                >
                              </li>
                              <li>
                                <span style="font-size: 12px"
                                  >Data de Assinatura do Contrato Anterior:
                                  <span class="DATA_CONTRATO_ANTERIOR token_d4s"
                                    >${contratoCliente.dataContratoAntigo == 'null' ? " " :
              contratoCliente.dataContratoAntigo}</span
                                  >&nbsp;</span
                                >
                              </li>
                            </ul>
                          </ul>
                        </ul>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                            <p></p>
                          </blockquote>
                        </blockquote>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b style="font-size: 14px">TAXA DE ADESÃO</b></p>
                        <p></p>
                        <ul>
                          <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
                          <li>Adicional de Cremação Humana: R$ ${result.id >= 2 ? 0 : adesaoHumano}</li>
                          <li style="font-size: 14px">
                            <b style="font-size: 16px"
                              >Total da Taxa de Adesão:R$ ${result.id >= 2 ? planoTratado.valorAdesao : valorTotalAdesao}</b
                            >
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
              <p><b style="font-size: 14px;">MENSALIDADE</b></p>
              <p></p>
              <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}&nbsp</li>
                  <li>Acréscimo de Adicionais: R$ ${valorAdicional}</li>
                  <li>Quantidade de Adicionais: ${qtdAdicional}</li>
                  <li><b><span style="font-size: 16px;">Total da Mensalidade: <span
                                  class="MENSALIDADE_TOTAL token_d4s">R$ ${valorTotalMensalidade}</span>&nbsp;</span></b></li>
              </ul>
              <p><b style="font-size: 14px;">REAJUSTE CONFORME IGPM</b></p>
              <p></p>
          </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"><b>DADOS DE PAGAMENTO</b></span>
                        </p>
                        <p></p>
                        <ul>
                          <li>
                            Data de Vencimento da Primeira
                            Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
                          </li>
                          <li>
                            Forma de Pagamento:
                            <span class="FORMA_PAGAMENTO token_d4s"
                              >${contratoCliente.localCobranca}</span
                            >&nbsp;
                          </li>
                          <ul>
                            <li>Em caso de cobrador, qual o endereço de cobrança?</li>
                            <ul>
                              <li>
                                Endereço de Cobrança:
                                <span class="ENDERECO_COBRANCA token_d4s"
                                  >${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial},
                                  ${contratoCliente.numeroResidencial}, QUADRA:
                                  ${contratoCliente.quadraResidencial == null ? "" : contratoCliente.quadraResidencial}, LOTE:
                                  ${contratoCliente.loteResidencial == null ? "" : contratoCliente.loteResidencial}, Complemento:
                                  ${contratoCliente.complementoResidencial}, Bairro:
                                  ${contratoCliente.bairroResidencial},
                                  ${contratoCliente.cepResidencial}</span
                                >&nbsp;
                              </li>
                              <li>
                                Melhor Horário:
                                <span class="HORARIO_COBRANCA token_d4s"
                                  >${contratoCliente.melhorHorario}</span
                                >&nbsp;
                              </li>
                            </ul>
                          </ul>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Caso a cobrança não seja efetuada até a data do vencimento, o
                              CONTRATANTE se responsabiliza a efetuar o pagamento no escritório da
                              CONTRATADA.</span
                            >
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >A CONTRATADA se reserva ao direito de alterar as formas de
                              pagamento disponibilizadas para o CONTRATANTE.</span
                            ><br />
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >ANEXO 04 - SERVIÇO ADICIONAL DE CREMAÇÃO HUMANA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px">1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA </b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.1</b>&nbsp;Em caso de adesão, por parte do CONTRATANTE, ao
                            serviço adicional de cremação humana, o aludido serviço será regulado
                            pelo presente instrumento, que é parte integrante do contrato de
                            prestação de serviços de assistência funerária.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único: </b>No caso de adesão ao serviço adicional de
                              cremação humana posterior ao contrato de prestação de serviços de
                              assistência funerária, o prazo contratual é contado em conformidade
                              com a Cláusula 3° do presente instrumento.&nbsp;</span
                            ><br />
                          </p>
                        </blockquote>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px">2. CLÁUSULA SEGUNDA - DO OBJETO</b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b style="">2.1</b>&nbsp;Constitui objeto do presente instrumento a
                            prestação dos serviços especializados de cremação em favor do
                            CONTRATANTE ou de qualquer dos beneficiários indicados no termo de
                            adesão, a serem executados sob a responsabilidade da CONTRATADA e o
                            fornecimento de 01 (uma) urna cinerária padrão, modelo Basic, 23 cm,
                            4.600 cm³, chapa galvanizada, ou outro que venha a substitui-lo, para
                            armazenamento das cinzas.</span
                          >
                        </p>
                        <p>
                          <span style=""
                            ><span style="font-size: 14px"
                              ><b style="">2.2</b> A cremação é um processo moderno, prático e
                              ecológico, feito através de fornos crematórios, utilizados
                              exclusivamente para esta finalidade. Ao final do processo restam
                              apenas as cinzas que são entregues a família ou representante legal
                              em uma urna cinerária.</span
                            ><br
                          /></span>
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >3. CLÁUSULA TERCEIRA - DO PRAZO E CARÊNCIA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na data
                            em que houver o efetivo pagamento da taxa de adesão e permanecerá pelo
                            prazo de 60 (sessenta) meses, sendo automaticamente renovado em caso
                            de não manifestação contrária das Partes.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.2</b> Fica pactuado que as pessoas adicionadas terão direito a
                              usufruir do serviço de cremação contratado após a carência de 90
                              (noventa) dias, contados da data do pagamento integral da taxa de
                              adesão do serviço adicional ou da primeira parcela.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.3</b> Se o contrato for cancelado antes do período descrito na
                              Cláusula 3 – Do Prazo e Carência e havendo a prestação do serviço de
                              cremação, caberá ao CONTRATANTE e aos seus herdeiros o pagamento do
                              residual gasto com o serviço prestado, independente da desvinculação
                              pelo cancelamento contratual.</span
                            ></span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.4</b> A mensalidade estará sujeita a reajuste anual calculado
                              através da aplicação da variação positiva do IGP-M (Índice Geral de
                              Preços do Mercado) ou outro que venha a substituí-lo. A aplicação do
                              índice poderá ser revista a qualquer tempo, sempre que houver
                              necessidade de recomposição real de perdas inflacionárias não
                              refletidas no índice adotado ou quando a estrutura de custos da
                              CONTRATADA assim o exigir. A aplicação da multa, juros e atualização
                              monetária é automática, inexistindo, de pleno direito, a necessidade
                              de comunicação prévia de qualquer das Partes a outra.</span
                            ></span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b style="">4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                            seguintes serviços:</span
                          >
                        </p>
                        <p></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Serviços de atendimento telefônico e auxílio de informações;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Carro Funerário para remoção e cortejo do funeral até o crematório,
                              limitado ao munícipio de Dourados;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Cremação unitária;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Armazenamento em câmara de refrigeração por prazo determinado de 24
                              horas.</span
                            >
                          </li>
                        </ul>
                        <span style="font-size: 14px"
                          >Remoção do corpo do local do velório até o local da cremação não terá
                          custo adicional, desde que o percurso esteja dentro da área urbana do
                          município de Dourados.<br
                        /></span>
                        <p></p>
                        <p>
                          <span style="font-size: 14px"
                            >Em caso de armazenamento em câmara de refrigeração além do prazo de
                            24 horas será cobrado valor adicional.</span
                          ><br />
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
                            CREMAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>5.1</b>&nbsp;Para que o corpo da pessoa falecida por morte natural
                            seja cremado é necessário à apresentação de atestado de óbito assinado
                            por dois médicos ou por um médico legista contendo o número do CRM e o
                            endereço profissional, em via original ou cópia autenticada e a
                            autorização de cremação assinada antecedentemente pela pessoa falecida
                            ou pelo representante legal na forma pública ou particular.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>5.2</b> A cremação para o caso de morte violenta derivado de
                              crimes ou sob investigação da autoridade será necessário o atestado
                              de óbito assinado por um médico legista contendo o número do
                              registro CRM, endereço profissional em via original ou cópia
                              autenticada e alvará judicial por meio do qual o juiz não se opõe a
                              cremação do corpo.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>5.3</b> A cremação de estrangeiros não residentes no país em
                              caso de morte natural é necessária autorização judicial competente,
                              mediante solicitação formulada pelo consulado do país, do qual
                              conste o nome e o cargo de quem a formulou, autorização de cremação,
                              autorização judicial de cremação requerida pelo consulado, xerox dos
                              documentos de identidade e passaporte do falecido.</span
                            ></span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A
                            CREMAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as suas expensas,
                            a retirada de todo e qualquer tipo de aparelho ou equipamento que
                            tenha sido implantado no corpo a ser incinerado, tais como, marca
                            passo ou qualquer outro aparelho ou equipamento que se utilize de
                            pilhas ou baterias.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.2</b> Excepcionalmente, caso seja notada a existência de
                              aparelhos ou equipamentos implantados no corpo a ser cremado, a
                              CONTRATADA poderá a qualquer tempo, recusar-se a prestar o serviço
                              ou, caso não seja detectada a existência dos referidos aparelhos e a
                              cremação acabe sendo realizada, fica o CONTRATANTE, obrigado a
                              reparar integralmente todo e qualquer dano que venha a ser causado
                              em decorrência de tal ato.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.3</b> A cremação será realizada após o prazo de 24 horas do
                              óbito, podendo ser realizada a qualquer tempo, sendo que este
                              período até a cremação, o corpo permanecerá preservado em ambiente
                              refrigerado tecnicamente apropriado.</span
                            ></span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.4</b> O CONTRATANTE ou seu responsável legal deverá entrar em
                              contato com a CONTRATADA para fazer o agendamento da cremação logo
                              após o óbito, devendo ser respeitado à agenda de disponibilidade
                              oferecida pela CONTRATADA.<br /></span
                          ></span>
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.1</b>&nbsp;O prazo para entrega das cinzas são de até 15
                            (quinze) dias úteis, contados a partir da cremação, disponibilizadas
                            na secretaria do crematório para serem retiradas, mediante a
                            assinatura de termo de recebimento das cinzas e apresentação de
                            documento de identificação.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"><b>7.2&nbsp;</b></span></span
                          ><span style="font-size: 14px; color: inherit"
                            >Caso a urna com os restos das cinzas não seja retirada no local
                            dentro do prazo descrito acima, a CONTRATADA deixará disponível junto
                            ao columbário pelo prazo de 60 (sessenta) dias ininterruptos, sendo
                            que após essa data será destinado junto à empresa competente.</span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                      <p style="text-align: center; font-size: 14px">
                      ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                    </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >ANEXO 05 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO HUMANA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>PESSOAS ADICIONADAS NO SERVIÇO DE CREMAÇÃO HUMANA</b></p>
                        ${htmlTitularCremado}
                        ${htmlCremacao}
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
                    </body>
                  </html> 
                  
                  `
        } else {
          return toast.show({
            placement: "top",
            render: () => {
              return <ComponentToast message={`Selecione um template!`} />
            }
          });
        }
      } else if (estado == 'MS') {
        if (templateID == 1) {
          html = `
                  <!DOCTYPE html>
  <html lang="pt-br">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  
  <body>
  
      <body>
          <div>
              <p style="text-align: center;"><b><span style="font-size: 16px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span></b><br>
              </p>
              <p></p>
          </div>
          <div>
              <p style="text-align: justify;"><span style="font-size: 14px;">Pelo
                      presente instrumento particular de contrato de prestação de serviços de
                      assistência funerária, de um lado, simplesmente denominada CONTRATADA, a
                      empresa ${unidadeTratado.razaoSocial}, pessoa jurídica de direito
                      privado, inscrita no CNPJ sob o nº ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro ${unidadeTratado.bairro}, CEP 79.826-110, ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
                      representante legal ao final assinado e do outro lado, o(a) consumidor(a),
                      identificado e qualificado na Ficha de Qualificação, parte integrante e
                      indissociável deste contrato, simplesmente denominado CONTRATANTE.</span><br>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>1.1</b>&nbsp;Pelo
                      presente instrumento a CONTRATADA, através de recursos próprios ou de empresas
                      designadas por ela, disponibilizará ao CONTRATANTE e seus beneficiários o Plano
                      de Assistência Familiar – Pax Primavera, objetivando prestação de serviços de
                      assistência funerária e outros benefícios extras que ficarão disponibilizados
                      para o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros do
                      plano optado e as condições especificadas abaixo:</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.2</b>&nbsp;Os
                      serviços de exumação, confecção de pedras, fotos, embelezamento e fornecimento
                      de jazigo/gaveta (túmulo), não serão cobertos neste contrato, sendo eventuais
                      despesas de inteira responsabilidade do CONTRATANTE.</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.3</b>&nbsp;Serviços
                      e despesas não contemplados neste contrato serão custeados pelo CONTRATANTE ou
                      o beneficiário responsável pelo funeral.</span>
              </p>
              <p><span style="font-size: 14px;"><b>1.4</b>&nbsp;Todo
                      o serviço solicitado ou material adquirido que não atenda às especificações
                      deste contrato, bem como todo serviço ou produto adquirido junto a terceiros ou
                      empresas congêneres, sem autorização por escrito da CONTRATADA, será de inteira
                      e exclusiva responsabilidade do CONTRATANTE e seus dependentes, não cabendo
                      neste caso, qualquer tipo de restituição, reembolso, devolução ou indenização.</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA
                      GEOGRÁFICA</b>
              </h4>
          </div>
          <div>
              <p style="text-align: justify;"><span style="font-size: 14px;"><b>2.1</b>&nbsp;A
                      abrangência geográfica dos serviços disponibilizados pela CONTRATADA compreende
                      a localidade da sede Matriz e demais comarcas das filiais correspondentes.</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b><span style="font-size: 16px;">3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span></b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes serviços:<br></span>
              </p>
              <p></p>
              <ul>
                  <li><span style="font-size: 14px;">Plantão
                          24 horas para atendimento telefônico e auxílio de informações ao CONTRATANTE e
                          seus dependentes;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Atendimento
                          funerário nas localidades em que a empresa está instalada - Matriz ou filial;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Traslado
                          rodoviário para as áreas de atuação acima descritas, nos limites do plano
                          contratado e assinalado no Termo de Adesão;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Urna
                          mortuária estilo sextavado em conformidade com o plano adquirido;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Paramentação
                          conforme o credo religioso;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Carro
                          funerário para remoção, cortejo e sepultamento;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Decoração
                          de flores naturais e/ou artificiais na urna, conforme a disponibilidade de
                          mercado onde serão executados os serviços;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Velas;<br></span></li>
                  <li><span style="font-size: 14px;">Véu;<br></span></li>
                  <li><span style="font-size: 14px;">Livro
                          de presença;<br></span>
                  </li>
                  <li><span style="font-size: 14px;">Sala
                          de velório, apenas nas localidades onde a CONTRATADA mantém sala disponível.</span>
                  </li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE
                      ALIMENTAÇÃO</b></h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>4.1</b>&nbsp;Lanche
                      servido na capela: 50 (cinquenta) pães; 250g (duzentos e cinquenta gramas) de
                      manteiga; 02 (dois) litros de leite; 02 (dois) pacotes de bolacha de água e
                      sal; Chá e café à vontade.</span>
              </p>
              <p style=""><span style="font-size: 14px;"><b style="">4.2</b>&nbsp;Kit
                      lanche para residencial: 500g (quinhentos gramas) de chá; 500g (quinhentos
                      gramas) de café; 02kg (dois quilos) de açúcar; 01 (um) pacote de bolacha de
                      água e sal; 250g (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
                      café.</span>
              </p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo
                              Primeiro:</b> Eventual substituição de
                          produto em decorrência da falta de fabricação ou distribuição do mercado será
                          substituída por produto equivalente ou de igual valor.<br></span>
                  </p>
                  <p><span style="font-size: 12px;"><b>Parágrafo
                              Segundo:</b> Os itens compreendidos
                          acima fazem referência aos serviços e produtos mínimos ofertados para todos os
                          planos disponíveis da CONTRATADA.</span>
                  </p>
              </blockquote>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b><span style="font-size: 16px;">5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO </span></b></h4>
          <div>
              <p><span style="font-size: 14px;"><b>5.1</b> O meio de transporte a ser utlizadao para o translado do corpo
                      será
                      o rodoviário.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de inteira
                          responsabilidade do CONTRATANTE, podendo a CONTRATADA proceder apenas com a intermediação de
                          informações e apoio.</span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
                  <p><b style="color: inherit;">5.2</b><span style="color: inherit;"> Não haverá qualquer tipo de
                          reembolso de
                          quaisquer despesas efetuadas pelo CONTRATANTE em caso de solicitação de serviços não previstos
                          no
                          respectivo plano optado.</span><br></p>
              </span>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b><span style="font-size: 16px;">6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E
                      DEPENDENTES</span></b></h4>
          <div>
              <p><span style="font-size: 14px;"><b>6.1</b> A CONTRATADA fornecerá os serviços funerários correspondentes
                      ao
                      CONTRATANTE e seus dependentes, conforme plano escolhido no Termo de Adesão.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Primeiro:</b>&nbsp;Entende como beneficiários/dependentes
                          (pais, cônjuge, filhos enquanto solteiros mediante comprovação, filhos solteiros incapazes sem
                          limite de idade, ou dependentes com guarda judicial comprovada documentalmente). A alteração das
                          condições especificadas na cláusula acima excluirá a condição de dependentes e/ou beneficiários
                          do
                          respectivo contrato.</span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de novos
                          dependentes será considerada individualmente a obrigação do cumprimento da carência de 90
                          (noventa)
                          dias, que será contada a partir da data de sua inclusão.<br></span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha de
                          Qualificação, entre seus pais ou os pais do cônjuge, não sendo permitida a cobertura da
                          prestação
                          para ambos simultaneamente.<br></span></p>
                  <p><span style="font-size: 12px;"><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes prestadas
                          na
                          Ficha de Qualificação e no contrato de prestação de assistência funerária serão consideradas
                          verdadeiras, sob pena de responsabilidade civil e criminal do CONTRATANTE.<br></span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
                  <p><b style="color: inherit;">6.2</b><span style="color: inherit;"> O CONTRATANTE pagará a CONTRATADA no
                          ato
                          da assinatura do presente contrato, o valor estipulado no Termo de Adesão.</span><br></p>
              </span>
              <p></p>
              <p><span style="color: inherit; font-size: 14px;"><b>6.3</b> Todas as parcelas de preço terão seus
                      vencimentos
                      na data apontada no Termo de Adesão, salvo nos casos em que o vencimento recair em finais de semana
                      e
                      feriados nacionais e locais, hipótese em que serão automaticamente prorrogadas para o primeiro dia
                      útil
                      seguinte.<br></span></p>
              <p><span style="color: inherit; font-size: 14px;"><b>6.4</b> Caberá ao CONTRATANTE o pagamento da
                      mensalidade
                      total fixada para cada ano-base no Termo de Adesão, conforme tabela de preços descritos no Termo de
                      Adesão vigente à época, que estará sujeita a reajuste anual através da aplicação da variação
                      positiva do
                      índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que venha a substituí-lo, sendo que
                      a
                      data base para o reajuste se dará no primeiro dia de cada ano. A aplicação do índice poderá ser
                      revista
                      a qualquer tempo, sempre que houver necessidade de recomposição real de perdas inflacionárias não
                      refletidas no índice adotado ou quando a estrutura de custos da CONTRATADA assim o
                      exigir.<br></span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <h4 style="text-align: center;"><b style="font-size: 16px;">7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE
                  PAGAMENTO</b>
          </h4>
          <div>
              <p><span style="font-size: 14px;"><b>7.1</b> O presente contrato entrará em vigor na data em que houver o
                      efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60 (sessenta) meses, sendo
                      automaticamente renovado em caso de não manifestação contrária das Partes.</span></p>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <p><span style="font-size: 12px;"><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
                          “efetivo pagamento” será considerado o momento do recebimento do valor pactuado à vista em moeda
                          corrente;</span></p>
              </blockquote>
              <span style="color: inherit; font-size: 14px;">
              <p><span style="font-size: 14px;"><b>7.2</b> Fica pactuado que o CONTRATANTE e os
                          dependentes terão direito a usufruir dos benefícios contratados relativos ao plano escolhido
                          após a
                          carência de 90 (noventa) dias, contados da data do pagamento integral da taxa de adesão ou da
                          primeira parcela.</span></p>
              </span>
              <p></p>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                      <p><span style="font-size: 12px;"><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                              mora
                              a partir do primeiro dia do vencimento da primeira mensalidade referente ao plano aderido,
                              independente de notificação, ficando os serviços terminantemente suspensos;</span></p>
                      <p><span style="font-size: 12px;"><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                              rescindido após três meses de atraso.</span></p>
              </blockquote>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="font-size: 16px; text-align: center;"><b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
              </h4>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>8.1</b>&nbsp;O
                      não pagamento das quantias devidas dentro do prazo convencionado na aquisição
                      do Termo de Adesão implicará na incidência de multa de 2,0% (dois por cento) do
                      valor devido e não pago, acrescida de juros de mora de 1,0%, (um por cento) ao mês
                      e correção monetária pela aplicação da variação positiva do IGP-M (Índice Geral
                      de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação da multa,
                      juros e atualização monetária é automática, inexistindo, de pleno direito, a
                      necessidade de comunicação prévia de qualquer das Partes a outra.</span><br>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS
                      PARTES</b></h4>
          </div>
          <div>
              <p><b>DA CONTRATADA:</b></p>
              <p><span style="font-size: 14px;"><b>9.1</b>&nbsp;Executar
                      os serviços contratados de forma objetiva ao CONTRATANTE;</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.2</b>&nbsp;Facilitar
                      acesso às informações necessárias dos serviços oferecidos aos beneficiários;</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.3</b> Cumprir
                      o plano contratado com estrita observância das condições e cláusulas descritas
                      neste contrato e anexos.</span>
              </p>
              <p><b>DO(A) CONTRATANTE</b></p>
              <p><span style="font-size: 14px;"><b>9.4</b>&nbsp;Manter
                      em dia o pagamento das mensalidades, bem como, seus dados cadastrais devidamente
                      atualizados.</span>
              </p>
              <p><span style="font-size: 14px;"><b>9.5</b>&nbsp;Comunicar,
                      imediatamente, o falecimento de qualquer dos beneficiários do plano, para que
                      se possa usufruir dos serviços contratados;</span>
              </p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h4 style="text-align: center;"><b style="font-size: 16px;">10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E
                      SEUS
                      EFEITOS</b></h4>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b>10.1</b>&nbsp;No
                          caso de inadimplência de três mensalidades, o contrato será rescindido sem que
                          haja a incidência de qualquer multa, desde que o CONTRATANTE e seus dependentes
                          não tenham utilizado os serviços fúnebres.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.2</b>&nbsp;Após
                          a prestação dos serviços fúnebres e caso o contrato vigente tenha mais de 60
                          (sessenta) meses de duração, poderão os herdeiros requisitar o cancelamento do
                          contrato sem qualquer ônus, no entanto, se o contrato for cancelado antes do
                          período citado e havendo a prestação de serviços fúnebres, caberá aos herdeiros
                          o pagamento do residual gasto com o serviço prestado, independente da
                          desvinculação pelo cancelamento contratual.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.3</b>&nbsp;Ensejando
                          no cancelamento do contrato e com a devida prestação dos serviços, a CONTRATADA
                          estará responsável pela apuração do saldo devedor para a devida quitação dos
                          serviços prestados, apresentando de forma objetiva e clara os custos dos
                          serviços para sua devida quitação.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>10.4</b>&nbsp;O
                          saldo remanescente deverá ser quitado na forma à vista, ou por meio de
                          confissão de dívida para emissão de boleto bancário.</span>
                  </p>
                  <p><span><span style="font-size: 14px;"><b>10.5</b>&nbsp;Emitido
                              o boleto, e não havendo o pagamento no vencimento, o devedor será inserido no SCPC
                              e Serasa, bem como, serão tomadas as medidas judiciais cabíveis para a devida
                              quitação da dívida.</span><br></span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE
                      TITULARIDADE</b></h1>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b>11.1</b>&nbsp;Em
                          caso de falecimento do CONTRATANTE, poderão os dependentes ou responsável
                          legal, assumir o contrato principal, passando assim a ser responsável dos
                          direitos e obrigações assumidos neste contrato, sendo respeitado a obrigação do
                          cumprimento da carência de 90 (noventa) dias para qualquer novo titular o
                          dependente, conforme especificado na Cláusula 6.1.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>11.2</b>&nbsp;Para
                          a transferência da titularidade, é imprescindível que o contrato esteja livre
                          de qualquer débito e haja a anuência do antigo e do novo titular.</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
              </h1>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><span style="font-size: 14px;"><b style="">12.1</b>&nbsp;Qualquer
                          documento, anexo ou outros instrumentos decorrentes de alterações contratuais,
                          substituições, consolidações e respectivas complementações faz parte integrante
                          do presente contrato, salvo se expressamente disposto de forma diversa.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>12.2</b>&nbsp;Caso
                          uma mesma pessoa seja designada beneficiária em mais de um contrato, será
                          válido apenas um dos contratos.</span>
                  </p>
                  <p><span style="font-size: 14px;"><b>12.3</b>&nbsp;Todas
                          as referências a quaisquer Partes deste contrato incluem seus sucessores,
                          beneficiários, representantes.</span>
                  </p>
                  <p><b style="font-size: 14px; color: inherit;">12.4</b><span
                          style="font-size: 14px; color: inherit;">&nbsp;Faz
                          parte integrante e indissociável deste contrato, como se nele estivessem
                          transcritos, a Ficha de Qualificação, o Termo de Adesão e demais anexos, cujo
                          conteúdo o CONTRATANTE declara haver tomado amplo conhecimento, tendo aceitado
                          todos os seus termos, sem qualquer restrição ou objeção.</span>
                  </p>
                  <p><b style="font-size: 14px; color: inherit;">12.5</b><span
                          style="font-size: 14px; color: inherit;">&nbsp;As Partes
                          reconhecem como válidas eficazes e suficientes às comunicações, notificações e
                          cobranças enviadas para o endereço indicado na Ficha de Qualificação, cabendo a
                          este informar a CONTRATADA sobre qualquer alteração de endereço ou de seus
                          dados cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
                          contados do evento.</span>
                  </p>
                  <p><span style="font-size: 14px; color: inherit;"><b>12.6&nbsp;</b>A
                          mensalidade tem como principal objetivo a manutenção e disponibilização de toda
                          a infraestrutura necessária ao atendimento desse serviço e, desta forma, a não
                          ocorrência de falecimento dos beneficiários não implica em qualquer forma de
                          reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os demais
                          serviços estavam sendo oferecidos.</span>
                  </p>
                  <p><span style="font-size: 14px; color: inherit;"><b>12.7</b>&nbsp;O
                          não exercício, da CONTRATADA, de quaisquer dos direitos ou prerrogativas
                          previstas neste contrato ou seus anexos, ou mesmo na legislação aplicável, será
                          tido como ato de mera liberalidade, não constituindo alteração ou novação das
                          obrigações ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
                          tempo, independentemente de comunicação prévia à outra parte.</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><strong>PARTES:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>,
                      nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                      CONTRATO, por estar plenamente ciente dos termos, reafirmo meu dever de observar e fazer cumprir as cláusulas aqui
                      estabelecidas.</span></p>
              <p><span style="font-size: 14px;"><strong>TESTEMUNHA:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do CONTRATO.</span></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b></h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b>DADOS DO TITULAR</b></p>
              <p>Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style="">${contratoCliente.nomeTitular}</span>&nbsp;</p>
              <p>R.G.:&nbsp;<span class="RG_TITULAR token_d4s">${contratoCliente.rgTitular}</span>&nbsp;</p>
              <p>CPF:&nbsp;<span class="CPF_TITULAR token_d4s">${contratoCliente.cpfTitular}</span>&nbsp;</p>
              <p>Sexo: <span class="SEXO_TITULAR token_d4s">${contratoCliente.sexoTitular}</span>&nbsp;</p>
              <p>Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"><span
                          class="DA_Nasc_Titular token_d4s"><span
                              class="DATA_NASC_TITULAR token_d4s">${contratoCliente.dataNascTitular}</span>&nbsp;</span></span>
              </p>
              <p>Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"><span
                          class="ESTADO_CIVIL_TITULAR token_d4s">${contratoCliente.estadoCivilTitular}</span>&nbsp;</span>
              </p>
              <p><span style="color: inherit;">Profissão: <span
                          class="PROFISSAO_TITULAR token_d4s">${contratoCliente.profissaoTitular}</span>&nbsp;</span></p>
              <p><span style="color: inherit;">Religião:&nbsp;<span class="Religiao_Titular token_d4s"><span
                              class="RELIGIAO_TITULAR token_d4s">${contratoCliente.religiaoTitular}</span>&nbsp;</span></span>
              </p>
              <p>Naturalidade: ${contratoCliente.naturalidadeTitular}</p>
              <p>Nacionalidade: <span class="NACIONALIDADE_TITULAR token_d4s">${contratoCliente.nacionalidadeTitular}</span>&nbsp;</p>
              <p>Telefone 01: <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span>&nbsp;</p>
              <p>Telefone 02: <span class="TELEFONE_02 token_d4s">${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span>&nbsp;</p>
              <p>E-mail 01: <span class="EMAIL01 token_d4s"><span
                          class="EMAIL_01 token_d4s">${contratoCliente.email1}</span>&nbsp;</span>&nbsp;</p>
              <p>E-mail 02: <span class="EMAIL_02 token_d4s" style="">${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span>&nbsp;</p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><b>DADOS RESIDENCIAIS</b></p>
                  <p><span style="color: inherit;">Endereço Residencial:&nbsp;</span><span style="color: inherit;"><span
                              class="ENDERECO_RES token_d4s"><span
                                  class="ENDERECO_RESIDENCIAL token_d4s">${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}</span></span></span></p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.numeroResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.complementoResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.bairroResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.cepResidencial}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.cidadeResidencial}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.estadoResidencial}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
              <div class="edit">
                  <p><b>DADOS COMERCIAIS</b></p>
                  <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                  ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                  </p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <div class="edit">
                  <p><b>DEPENDENTES</b></p>
                      ${htmlDependentesHumano}
              </div>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b></h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 01 - BÁSICO</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, silk-screen
                          prateado, guarnição (friso) na tampa, madeira pinnus, tingida na cor nogueira, verniz alto
                          brilho,
                          fundo e tampa de eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor dourada,
                          forro
                          e babado rendão tecido 50g branco, taxas douradas, travesseiro solto. (Marca: De acordo com
                          fornecedor vigente)<br></span></li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação conforme o credo
                              religioso;</span><br></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 100Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 02 - SUPER-LUXO</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA
                          MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais do fundo e tampa
                          entalhada em baixo relevo, 2 sobretampos entalhados em alto relevo, guarnição
                          (friso) na tampa, madeira pinnus tingida na cor mogno, verniz alto brilho,
                          fundo Eucatex, 6 fixadores tipo concha com varões, laterais dourados, 9
                          chavetas fundidas e pintadas na cor dourada, forrada em tecido branco com renda
                          larga, sobre babado (rendão) branco com 20 cm de largura, taxas douradas, visor
                          médio de vidro rodeado por renda larga, travesseiro solto. (Marca: De acordo
                          com fornecedor vigente)<br></span>
                  </li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação
                              conforme o credo religioso;</span><br></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">01
                              (uma) coroa de flores grande, naturais e/ou artificiais, conforme a
                              disponibilidade de mercado onde será executado os serviços;<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Abertura
                              de jazigo (não se confundindo com o fornecimento de túmulo / gaveta);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Tanatopraxia
                              (preparação do corpo);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">01
                              (uma) veste, disponível na ocasião;<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 250Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b><span style="font-size: 14px;">PLANO 03 - LUXO</span></b></p>
              <p style="text-align: justify;"></p>
              <ul>
                  <li><span style="font-size: 14px;">URNA
                          MORTUÁRIA: Estilo sextavado com 1,90m internamente, silk-screen prateado,
                          guarnição (friso) na tampa, madeira pinnus, tingida na cor nogueira, verniz
                          alto brilho, fundo e tampa de eucatex, 6 (seis) alças parreira, 4 (quatro)
                          chavetas, ambas na cor dourada, forro e babado rendão tecido 50g branco, taxas
                          douradas, travesseiro solto. (Marca: De acordo com fornecedor vigente)<br></span>
                  </li>
                  <li><span style="font-size: 14px;"><span style="color: inherit;">Paramentação conforme o credo
                              religioso;</span><br></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Velas;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Carro funerário para remoção e
                              sepultamento;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Véu;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Sala de velório, se necessário nas
                              localidades onde o grupo mantém sala;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Decoração de flores naturais e/ou
                              artificiais na urna, conforme a disponibilidade de mercado onde será executado os
                              serviços;<br></span></span></li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Tanatopraxia
                              (preparação do corpo);<br></span></span>
                  </li>
                  <li><span style="color: inherit;"><span style="font-size: 14px;">Transporte de até 150Km.</span></span>
                  </li>
              </ul>
              <p></p>
              <p></p>
          </div>
          <div style="page-break-after: always;" class="pagebreak">&nbsp;</div>
          <div>
              <h1 style="font-size: 16px; text-align: center;"><b style="font-size: 16px;">ANEXO 03 - TERMO DE ADESÃO</b>
              </h1>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b>DADOS DO CONTRATO</b></p>
              <p></p>
              <ul>
                  <li>Plano Selecionado:&nbsp;<span
                          class="PLANO_SELECIONADO token_d4s">${planoTratado.descricao}</span>&nbsp;
                  </li>
                  <li><span style="color: inherit;">Formato da&nbsp;Venda: </span><span
                          class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
                          style="color: inherit;">${contratoCliente.tipo}</span><span
                          style="color: inherit;">&nbsp;</span>
                  </li>
                  <ul>
                      <li><span style="font-size: 12px;"><b>Em caso de transferência:</b></span></li>
                      <ul>
                          <li><span style="font-size: 12px;">Empresa Anterior: <span
                                      class="EMPRESA_ANTERIOR token_d4s">${contratoCliente.empresaAntiga == 'null' ? " " : contratoCliente.empresaAntiga}</span>&nbsp;</span>
                          </li>
                          <li><span style="font-size: 12px;">Data de Assinatura do Contrato Anterior: <span
                                      class="DATA_CONTRATO_ANTERIOR token_d4s">${contratoCliente.dataContratoAntigo == 'null' ? " " : contratoCliente.dataContratoAntigo}</span>&nbsp;</span>
                          </li>
                      </ul>
                  </ul>
              </ul>
              <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                  <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;">
                      <p></p>
                  </blockquote>
              </blockquote>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b style="font-size: 14px;">TAXA DE ADESÃO</b></p>
              <p></p>
              <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
                  <li style="font-size: 14px;"><b style="font-size: 16px;">Total da Taxa de Adesão:R$ ${planoTratado.valorAdesao}</b></li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><b style="font-size: 14px;">MENSALIDADE</b></p>
              <p></p>
              <ul>
                  <li>Plano Funerário: <span
                          class="MENSALIDADE_PLANOFUNERARIO token_d4s">R$ ${planoTratado.valorMensalidade}</span>&nbsp;</li>
                  <li><b><span style="font-size: 16px;">Total da Mensalidade: <span
                                  class="MENSALIDADE_TOTAL token_d4s">R$ ${planoTratado.valorMensalidade}</span>&nbsp;</span></b></li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><b>DADOS DE PAGAMENTO</b></span></p>
              <p></p>
              <ul>
                  <li>Data de Vencimento da Primeira Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
                  </li>
                  <li>Forma de Pagamento: <span
                          class="FORMA_PAGAMENTO token_d4s">${contratoCliente.localCobranca}</span>&nbsp;</li>
                  <ul>
                      <li>Em caso de cobrador, qual o endereço de cobrança?</li>
                      <ul>
                          <li>Endereço de Cobrança: <span
                                  class="ENDERECO_COBRANCA token_d4s">${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}, ${contratoCliente.numeroResidencial},
                                  QUADRA:${contratoCliente.quadraResidencial == null ? "" : contratoCliente.quadraResidencial}, 
                                  LOTE: ${contratoCliente.loteResidencial == null ? "" : contratoCliente.loteResidencial},
                                  Complemento:
                                  ${contratoCliente.complementoResidencial}, Bairro: ${contratoCliente.bairroResidencial},
                                  ${contratoCliente.cepResidencial}</span>&nbsp;</li>
                          <li>Melhor Horário: <span
                                  class="HORARIO_COBRANCA token_d4s">${contratoCliente.melhorHorario}</span>&nbsp;</li>
                      </ul>
                  </ul>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p></p>
              <ul>
                  <li><span style="font-size: 14px;">Caso
                          a cobrança não seja efetuada até a data do vencimento, o CONTRATANTE se
                          responsabiliza a efetuar o pagamento no escritório da CONTRATADA.</span>
                  </li>
                  <li><span style="font-size: 14px;">A
                          CONTRATADA se reserva ao direito de alterar as formas de pagamento
                          disponibilizadas para o CONTRATANTE.</span><br>
                  </li>
              </ul>
              <p></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p><span style="font-size: 14px;"><strong>PARTES:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>,
                      nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                      CONTRATO, e,
                      por estar plenamente ciente dos termos, reafirmo meu dever de observar e fazer cumprir as cláusulas
                      aqui
                      estabelecidas.</span></p>
              <p><span style="font-size: 14px;"><strong>TESTEMUNHA:</strong> Confirmo, <strong>via assinatura
                          eletrônica</strong>, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a celebração,
                      entre as
                      partes, do CONTRATO.</span></p>
          </div>
          <div>
              <p></p>
              <hr>
              <p></p>
          </div>
          <div>
              <p style="text-align: center; font-size: 14px;">${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}</p>
          </div>
      </body>
  </html>
                  `
        } else if (templateID == 2) {
          html = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Page Title</title>
                    </head>
                    <body>
                      <div>
                        <p style="text-align: center">
                          <b
                            ><span style="font-size: 16px"
                              >CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span
                            ></b
                          ><br />
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: justify">
                          <span style="font-size: 14px"
                            >Pelo presente instrumento particular de contrato de prestação de
                            serviços de assistência funerária, de um lado, simplesmente denominada
                            CONTRATADA, a empresa ${unidadeTratado.razaoSocial}, pessoa jurídica
                            de direito privado, inscrita no CNPJ sob o nº
                            ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua
                            ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro
                            ${unidadeTratado.bairro}, CEP 79.826-110,
                            ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
                            representante legal ao final assinado e do outro lado, o(a)
                            consumidor(a), identificado e qualificado na Ficha de Qualificação,
                            parte integrante e indissociável deste contrato, simplesmente
                            denominado CONTRATANTE.</span
                          ><br />
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.1</b>&nbsp;Pelo presente instrumento a CONTRATADA, através de
                            recursos próprios ou de empresas designadas por ela, disponibilizará
                            ao CONTRATANTE e seus beneficiários o Plano de Assistência Familiar –
                            Pax Primavera, objetivando prestação de serviços de assistência
                            funerária e outros benefícios extras que ficarão disponibilizados para
                            o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros
                            do plano optado e as condições especificadas abaixo:</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.2</b>&nbsp;Os serviços de exumação, confecção de pedras, fotos,
                            embelezamento e fornecimento de jazigo/gaveta (túmulo), não serão
                            cobertos neste contrato, sendo eventuais despesas de inteira
                            responsabilidade do CONTRATANTE.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.3</b>&nbsp;Serviços e despesas não contemplados neste contrato
                            serão custeados pelo CONTRATANTE ou o beneficiário responsável pelo
                            funeral.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.4</b>&nbsp;Todo o serviço solicitado ou material adquirido que
                            não atenda às especificações deste contrato, bem como todo serviço ou
                            produto adquirido junto a terceiros ou empresas congêneres, sem
                            autorização por escrito da CONTRATADA, será de inteira e exclusiva
                            responsabilidade do CONTRATANTE e seus dependentes, não cabendo neste
                            caso, qualquer tipo de restituição, reembolso, devolução ou
                            indenização.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA GEOGRÁFICA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p style="text-align: justify">
                          <span style="font-size: 14px"
                            ><b>2.1</b>&nbsp;A abrangência geográfica dos serviços
                            disponibilizados pela CONTRATADA compreende a localidade da sede
                            Matriz e demais comarcas das filiais correspondentes.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b
                            ><span style="font-size: 16px"
                              >3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span
                            ></b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes
                            serviços:</span>
                        </p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Plantão 24 horas para atendimento telefônico e auxílio de
                              informações ao CONTRATANTE e seus dependentes;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Atendimento funerário nas localidades em que a empresa está
                              instalada - Matriz ou filial;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Traslado rodoviário para as áreas de atuação acima descritas, nos
                              limites do plano contratado e assinalado no Termo de Adesão;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Urna mortuária estilo sextavado em conformidade com o plano
                              adquirido;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Paramentação conforme o credo religioso;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Carro funerário para remoção, cortejo e sepultamento;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Decoração de flores naturais e/ou artificiais na urna, conforme a
                              disponibilidade de mercado onde serão executados os serviços;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Velas;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Véu;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Livro de presença;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Sala de velório, apenas nas localidades onde a CONTRATADA mantém
                              sala disponível.</span
                            >
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE ALIMENTAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>4.1</b>&nbsp;Lanche servido na capela: 50 (cinquenta) pães; 250g
                            (duzentos e cinquenta gramas) de manteiga; 02 (dois) litros de leite;
                            02 (dois) pacotes de bolacha de água e sal; Chá e café à
                            vontade.</span
                          >
                        </p>
                        <p style="">
                          <span style="font-size: 14px"
                            ><b style="">4.2</b>&nbsp;Kit lanche para residencial: 500g
                            (quinhentos gramas) de chá; 500g (quinhentos gramas) de café; 02kg
                            (dois quilos) de açúcar; 01 (um) pacote de bolacha de água e sal; 250g
                            (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
                            café.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Primeiro:</b> Eventual substituição de produto em
                              decorrência da falta de fabricação ou distribuição do mercado será
                              substituída por produto equivalente ou de igual valor.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Segundo:</b> Os itens compreendidos acima fazem
                              referência aos serviços e produtos mínimos ofertados para todos os
                              planos disponíveis da CONTRATADA.</span
                            >
                          </p>
                        </blockquote>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b
                          ><span style="font-size: 16px"
                            >5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO
                          </span></b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>5.1</b> O meio de transporte a ser utlizadao para o translado do
                            corpo será o rodoviário.</span
                          >
                        </p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de
                              inteira responsabilidade do CONTRATANTE, podendo a CONTRATADA
                              proceder apenas com a intermediação de informações e apoio.</span
                            >
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">5.2</b
                            ><span style="color: inherit">
                              Não haverá qualquer tipo de reembolso de quaisquer despesas
                              efetuadas pelo CONTRATANTE em caso de solicitação de serviços não
                              previstos no respectivo plano optado.</span
                            ><br />
                          </p>
                        </span>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b
                          ><span style="font-size: 16px"
                            >6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E DEPENDENTES</span
                          ></b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>6.1</b> A CONTRATADA fornecerá os serviços funerários
                            correspondentes ao CONTRATANTE e seus dependentes, conforme plano
                            escolhido no Termo de Adesão.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Primeiro:</b>&nbsp;Entende como
                              beneficiários/dependentes (pais, cônjuge, filhos enquanto solteiros
                              mediante comprovação, filhos solteiros incapazes sem limite de
                              idade, ou dependentes com guarda judicial comprovada
                              documentalmente). A alteração das condições especificadas na
                              cláusula acima excluirá a condição de dependentes e/ou beneficiários
                              do respectivo contrato.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de
                              novos dependentes será considerada individualmente a obrigação do
                              cumprimento da carência de 90 (noventa) dias, que será contada a
                              partir da data de sua inclusão.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha
                              de Qualificação, entre seus pais ou os pais do cônjuge, não sendo
                              permitida a cobertura da prestação para ambos simultaneamente.<br
                            /></span>
                          </p>
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes
                              prestadas na Ficha de Qualificação e no contrato de prestação de
                              assistência funerária serão consideradas verdadeiras, sob pena de
                              responsabilidade civil e criminal do CONTRATANTE.<br
                            /></span>
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">6.2</b
                            ><span style="color: inherit">
                              O CONTRATANTE pagará a CONTRATADA no ato da assinatura do presente
                              contrato, o valor estipulado no Termo de Adesão.</span
                            ><br />
                          </p>
                        </span>
                        <p></p>
                        <p>
                          <span style="color: inherit; font-size: 14px"
                            ><b>6.3</b> Todas as parcelas de preço terão seus vencimentos na data
                            apontada no Termo de Adesão, salvo nos casos em que o vencimento
                            recair em finais de semana e feriados nacionais e locais, hipótese em
                            que serão automaticamente prorrogadas para o primeiro dia útil
                            seguinte.<br
                          /></span>
                        </p>
                        <p>
                          <span style="color: inherit; font-size: 14px"
                            ><b>6.4</b> Caberá ao CONTRATANTE o pagamento da mensalidade total
                            fixada para cada ano-base no Termo de Adesão, conforme tabela de
                            preços descritos no Termo de Adesão vigente à época, que estará
                            sujeita a reajuste anual através da aplicação da variação positiva do
                            índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que
                            venha a substituí-lo, sendo que a data base para o reajuste se dará no
                            primeiro dia de cada ano. A aplicação do índice poderá ser revista a
                            qualquer tempo, sempre que houver necessidade de recomposição real de
                            perdas inflacionárias não refletidas no índice adotado ou quando a
                            estrutura de custos da CONTRATADA assim o exigir.<br
                          /></span>
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <h4 style="text-align: center">
                        <b style="font-size: 16px"
                          >7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE PAGAMENTO</b
                        >
                      </h4>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.1</b> O presente contrato entrará em vigor na data em que houver
                            o efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60
                            (sessenta) meses, sendo automaticamente renovado em caso de não
                            manifestação contrária das Partes.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
                              “efetivo pagamento” será considerado o momento do recebimento do
                              valor pactuado à vista em moeda corrente;</span
                            >
                          </p>
                        </blockquote>
                        <span style="color: inherit; font-size: 14px">
                          <p>
                            <b style="color: inherit">7.2</b
                            ><span style="color: inherit">
                              Fica pactuado que o CONTRATANTE e os dependentes terão direito a
                              usufruir dos benefícios contratados relativos ao plano escolhido
                              após a carência de 90 (noventa) dias, contados da data do pagamento
                              integral da taxa de adesão ou da primeira parcela.</span
                            ><br />
                          </p>
                        </span>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p></p>
                          <div class="edit">
                            <p>
                              <span style="font-size: 12px"
                                ><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                                mora a partir do primeiro dia do vencimento da primeira
                                mensalidade referente ao plano aderido, independente de
                                notificação, ficando os serviços terminantemente suspensos;</span
                              >
                            </p>
                          </div>
                          <p></p>
                          <p></p>
                          <div class="edit">
                            <p>
                              <span style="font-size: 12px"
                                ><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                                rescindido após três meses de atraso.</span
                              >
                            </p>
                          </div>
                          <p></p>
                        </blockquote>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="font-size: 16px; text-align: center">
                          <b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>8.1</b>&nbsp;O não pagamento das quantias devidas dentro do prazo
                            convencionado na aquisição do Termo de Adesão implicará na incidência
                            de multa de 2,0% (dois por cento) do valor devido e não pago,
                            acrescida de juros de mora de 1,0%, (um por cento) ao mês e correção
                            monetária pela aplicação da variação positiva do IGP-M (Índice Geral
                            de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação
                            da multa, juros e atualização monetária é automática, inexistindo, de
                            pleno direito, a necessidade de comunicação prévia de qualquer das
                            Partes a outra.</span
                          ><br />
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS PARTES</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p><b>DA CONTRATADA:</b></p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.1</b>&nbsp;Executar os serviços contratados de forma objetiva ao
                            CONTRATANTE;</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.2</b>&nbsp;Facilitar acesso às informações necessárias dos
                            serviços oferecidos aos beneficiários;</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.3</b> Cumprir o plano contratado com estrita observância das
                            condições e cláusulas descritas neste contrato e anexos.</span
                          >
                        </p>
                        <p><b>DO(A) CONTRATANTE</b></p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.4</b>&nbsp;Manter em dia o pagamento das mensalidades, bem como,
                            seus dados cadastrais devidamente atualizados.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>9.5</b>&nbsp;Comunicar, imediatamente, o falecimento de qualquer
                            dos beneficiários do plano, para que se possa usufruir dos serviços
                            contratados;</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E SEUS EFEITOS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.1</b>&nbsp;No caso de inadimplência de três mensalidades, o
                              contrato será rescindido sem que haja a incidência de qualquer
                              multa, desde que o CONTRATANTE e seus dependentes não tenham
                              utilizado os serviços fúnebres.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.2</b>&nbsp;Após a prestação dos serviços fúnebres e caso o
                              contrato vigente tenha mais de 60 (sessenta) meses de duração,
                              poderão os herdeiros requisitar o cancelamento do contrato sem
                              qualquer ônus, no entanto, se o contrato for cancelado antes do
                              período citado e havendo a prestação de serviços fúnebres, caberá
                              aos herdeiros o pagamento do residual gasto com o serviço prestado,
                              independente da desvinculação pelo cancelamento contratual.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.3</b>&nbsp;Ensejando no cancelamento do contrato e com a
                              devida prestação dos serviços, a CONTRATADA estará responsável pela
                              apuração do saldo devedor para a devida quitação dos serviços
                              prestados, apresentando de forma objetiva e clara os custos dos
                              serviços para sua devida quitação.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>10.4</b>&nbsp;O saldo remanescente deverá ser quitado na forma à
                              vista, ou por meio de confissão de dívida para emissão de boleto
                              bancário.</span
                            >
                          </p>
                          <p>
                            <span
                              ><span style="font-size: 14px"
                                ><b>10.5</b>&nbsp;Emitido o boleto, e não havendo o pagamento no
                                vencimento, o devedor será inserido no SCPC e Serasa, bem como,
                                serão tomadas as medidas judiciais cabíveis para a devida quitação
                                da dívida.</span
                              ><br
                            /></span>
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE TITULARIDADE</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b>11.1</b>&nbsp;Em caso de falecimento do CONTRATANTE, poderão os
                              dependentes ou responsável legal, assumir o contrato principal,
                              passando assim a ser responsável dos direitos e obrigações assumidos
                              neste contrato, sendo respeitado a obrigação do cumprimento da
                              carência de 90 (noventa) dias para qualquer novo titular o
                              dependente, conforme especificado na Cláusula 6.1.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>11.2</b>&nbsp;Para a transferência da titularidade, é
                              imprescindível que o contrato esteja livre de qualquer débito e haja
                              a anuência do antigo e do novo titular.</span
                            >
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p>
                            <span style="font-size: 14px"
                              ><b style="">12.1</b>&nbsp;Qualquer documento, anexo ou outros
                              instrumentos decorrentes de alterações contratuais, substituições,
                              consolidações e respectivas complementações faz parte integrante do
                              presente contrato, salvo se expressamente disposto de forma
                              diversa.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>12.2</b>&nbsp;Caso uma mesma pessoa seja designada beneficiária
                              em mais de um contrato, será válido apenas um dos contratos.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><b>12.3</b>&nbsp;Todas as referências a quaisquer Partes deste
                              contrato incluem seus sucessores, beneficiários,
                              representantes.</span
                            >
                          </p>
                          <p>
                            <b style="font-size: 14px; color: inherit">12.4</b
                            ><span style="font-size: 14px; color: inherit"
                              >&nbsp;Faz parte integrante e indissociável deste contrato, como se
                              nele estivessem transcritos, a Ficha de Qualificação, o Termo de
                              Adesão e demais anexos, cujo conteúdo o CONTRATANTE declara haver
                              tomado amplo conhecimento, tendo aceitado todos os seus termos, sem
                              qualquer restrição ou objeção.</span
                            >
                          </p>
                          <p>
                            <b style="font-size: 14px; color: inherit">12.5</b
                            ><span style="font-size: 14px; color: inherit"
                              >&nbsp;As Partes reconhecem como válidas eficazes e suficientes às
                              comunicações, notificações e cobranças enviadas para o endereço
                              indicado na Ficha de Qualificação, cabendo a este informar a
                              CONTRATADA sobre qualquer alteração de endereço ou de seus dados
                              cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
                              contados do evento.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px; color: inherit"
                              ><b>12.6&nbsp;</b>A mensalidade tem como principal objetivo a
                              manutenção e disponibilização de toda a infraestrutura necessária ao
                              atendimento desse serviço e, desta forma, a não ocorrência de
                              falecimento dos beneficiários não implica em qualquer forma de
                              reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os
                              demais serviços estavam sendo oferecidos.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px; color: inherit"
                              ><b>12.7</b>&nbsp;O não exercício, da CONTRATADA, de quaisquer dos
                              direitos ou prerrogativas previstas neste contrato ou seus anexos,
                              ou mesmo na legislação aplicável, será tido como ato de mera
                              liberalidade, não constituindo alteração ou novação das obrigações
                              ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
                              tempo, independentemente de comunicação prévia à outra parte.</span
                            >
                          </p>
                        </div>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>DADOS DO TITULAR</b></p>
                        <p>
                          Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style=""
                            >${contratoCliente.nomeTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          R.G.:&nbsp;<span class="RG_TITULAR token_d4s"
                            >${contratoCliente.rgTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          CPF:&nbsp;<span class="CPF_TITULAR token_d4s"
                            >${contratoCliente.cpfTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Sexo:
                          <span class="SEXO_TITULAR token_d4s"
                            >${contratoCliente.sexoTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"
                            ><span class="DA_Nasc_Titular token_d4s"
                              ><span class="DATA_NASC_TITULAR token_d4s"
                                >${contratoCliente.dataNascTitular}</span
                              >&nbsp;</span
                            ></span
                          >
                        </p>
                        <p>
                          Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"
                            ><span class="ESTADO_CIVIL_TITULAR token_d4s"
                              >${contratoCliente.estadoCivilTitular}</span
                            >&nbsp;</span
                          >
                        </p>
                        <p>
                          <span style="color: inherit"
                            >Profissão:
                            <span class="PROFISSAO_TITULAR token_d4s"
                              >${contratoCliente.profissaoTitular}</span
                            >&nbsp;</span
                          >
                        </p>
                        <p>
                          <span style="color: inherit"
                            >Religião:&nbsp;<span class="Religiao_Titular token_d4s"
                              ><span class="RELIGIAO_TITULAR token_d4s"
                                >${contratoCliente.religiaoTitular}</span
                              >&nbsp;</span
                            ></span
                          ><br />
                        </p>
                        <p>Naturalidade:${contratoCliente.naturalidadeTitular}<br />
                        </p>
                        <p>
                          Nacionalidade:
                          <span class="NACIONALIDADE_TITULAR token_d4s"
                            >${contratoCliente.nacionalidadeTitular}</span
                          >&nbsp;
                        </p>
                        <p>
                          Telefone 01:
                          <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span
                          >&nbsp;
                        </p>
                        <p>
                          Telefone 02:
                          <span class="TELEFONE_02 token_d4s"
                            >${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span
                          >&nbsp;
                        </p>
                        <p>
                          E-mail 01:
                          <span class="EMAIL01 token_d4s"
                            ><span class="EMAIL_01 token_d4s">${contratoCliente.email1}</span
                            >&nbsp;</span
                          >&nbsp;
                        </p>
                        <p>
                          E-mail 02:
                          <span class="EMAIL_02 token_d4s" style=""
                            >${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span
                          >&nbsp;
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p><b>DADOS RESIDENCIAIS</b></p>
                          <p>
                            <span style="color: inherit">Endereço Residencial:&nbsp;</span
                            ><span style="color: inherit"
                              ><span class="ENDERECO_RES token_d4s"
                                ><span class="ENDERECO_RESIDENCIAL token_d4s"
                                  >${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial}</span
                                ></span
                              ></span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Número:
                              <span class="NUMERO_END_RESIDENCIAL token_d4s"
                                >${contratoCliente.numeroResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Complemento:
                              <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                                >${contratoCliente.complementoResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Bairro:
                              <span class="BAIRRO_RESIDENCIAL token_d4s"
                                >${contratoCliente.bairroResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >CEP:
                              <span class="CEP_RESIDENCIAL token_d4s"
                                >${contratoCliente.cepResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >Cidade:
                              <span class="CIDADE_RESIDENCIAL token_d4s"
                                >${contratoCliente.cidadeResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                          <p>
                            <span style="color: inherit"
                              >U.F:
                              <span class="ESTADO_RESIDENCIAL token_d4s"
                                >${contratoCliente.estadoResidencial}</span
                              >&nbsp;</span
                            >
                          </p>
                        </div>
                        <p></p>
                        <div class="edit">
                        <p><b>DADOS COMERCIAIS</b></p>
                        <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                        ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                        </p>
                        <p><span style="color: inherit;">Número: <span
                                    class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                        </p>
                        <p><span style="color: inherit;">Complemento: <span
                                    class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                        </p>
                        <p><span style="color: inherit;">Bairro: <span
                                    class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                        </p>
                        <p><span style="color: inherit;">CEP: <span
                                    class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                        <p><span style="color: inherit;">Cidade: <span
                                    class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                        </p>
                        <p><span style="color: inherit;">U.F: <span
                                    class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                        </p>
                    </div>
                    <p></p>
                        
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <div class="edit">
                          <p><b>DEPENDENTES</b></p>
                          ${htmlDependentesHumano}
                        </div>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div> 
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 01 - BÁSICO</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 100Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 02 - SUPER-LUXO</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais
                              do fundo e tampa entalhada em baixo relevo, 2 sobretampos entalhados
                              em alto relevo, guarnição (friso) na tampa, madeira pinnus tingida
                              na cor mogno, verniz alto brilho, fundo Eucatex, 6 fixadores tipo
                              concha com varões, laterais dourados, 9 chavetas fundidas e pintadas
                              na cor dourada, forrada em tecido branco com renda larga, sobre
                              babado (rendão) branco com 20 cm de largura, taxas douradas, visor
                              médio de vidro rodeado por renda larga, travesseiro solto. (Marca:
                              De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                                conforme a disponibilidade de mercado onde será executado os
                                serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Abertura de jazigo (não se confundindo com o fornecimento de
                                túmulo / gaveta);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Tanatopraxia (preparação do corpo);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >01 (uma) veste, disponível na ocasião;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 250Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <b><span style="font-size: 14px">PLANO 03 - LUXO</span></b>
                        </p>
                        <p style="text-align: justify"></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              ><span style="color: inherit"
                                >Paramentação conforme o credo religioso;</span
                              ><br
                            /></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Velas;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Carro funerário para remoção e sepultamento;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Véu;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Sala de velório, se necessário nas localidades onde o grupo
                                mantém sala;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                                disponibilidade de mercado onde será executado os serviços;<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px"
                                >Tanatopraxia (preparação do corpo);<br /></span
                            ></span>
                          </li>
                          <li>
                            <span style="color: inherit"
                              ><span style="font-size: 14px">Transporte de até 150Km.</span></span
                            >
                          </li>
                        </ul>
                        <p></p>
                        <p></p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h1 style="font-size: 16px; text-align: center">
                          <b style="font-size: 16px">ANEXO 03 - TERMO DE ADESÃO</b>
                        </h1>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>DADOS DO CONTRATO</b></p>
                        <p></p>
                        <ul>
                          <li>
                            Plano Selecionado:&nbsp;<span class="PLANO_SELECIONADO token_d4s"
                              >${planoTratado.descricao}</span
                            >&nbsp;
                          </li>
                          <li>
                            <span style="color: inherit">Formato da&nbsp;Venda: </span
                            ><span
                              class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
                              style="color: inherit"
                              >${contratoCliente.tipo}</span
                            ><span style="color: inherit">&nbsp;</span>
                          </li>
                          <ul>
                            <li>
                              <span style="font-size: 12px"
                                ><b>Em caso de transferência:</b></span
                              >
                            </li>
                            <ul>
                              <li>
                                <span style="font-size: 12px"
                                  >Empresa Anterior:
                                  <span class="EMPRESA_ANTERIOR token_d4s"
                                    >${contratoCliente.empresaAntiga == 'null' ? " " :
              contratoCliente.empresaAntiga}</span
                                  >&nbsp;</span
                                >
                              </li>
                              <li>
                                <span style="font-size: 12px"
                                  >Data de Assinatura do Contrato Anterior:
                                  <span class="DATA_CONTRATO_ANTERIOR token_d4s"
                                    >${contratoCliente.dataContratoAntigo == 'null' ? " " :
              contratoCliente.dataContratoAntigo}</span
                                  >&nbsp;</span
                                >
                              </li>
                            </ul>
                          </ul>
                        </ul>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                            <p></p>
                          </blockquote>
                        </blockquote>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b style="font-size: 14px">TAXA DE ADESÃO</b></p>
                        <p></p>
                        <ul>
                          <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
                          <li>Adicional de Cremação Humana: R$ ${result.id >= 2 ? 0 : adesaoHumano}</li>
                          <li style="font-size: 14px">
                            <b style="font-size: 16px"
                              >Total da Taxa de Adesão:R$ ${result.id >= 2 ? planoTratado.valorAdesao : valorTotalAdesao}</b
                            >
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b style="font-size: 14px">MENSALIDADE</b></p>
                        <p></p>
                        <ul>
                          <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}</li>
                          <li>Adicional de Cremação Humana:R$ ${mensalidadeHumano}</li>
                          <li>
                            <b>Total da Mensalidade:R$ ${valorTotalMensalidade}</b>
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"><b>DADOS DE PAGAMENTO</b></span>
                        </p>
                        <p></p>
                        <ul>
                          <li>
                            Data de Vencimento da Primeira
                            Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
                          </li>
                          <li>
                            Forma de Pagamento:
                            <span class="FORMA_PAGAMENTO token_d4s"
                              >${contratoCliente.localCobranca}</span
                            >&nbsp;
                          </li>
                          <ul>
                            <li>Em caso de cobrador, qual o endereço de cobrança?</li>
                            <ul>
                              <li>
                                Endereço de Cobrança:
                                <span class="ENDERECO_COBRANCA token_d4s"
                                  >${contratoCliente.tipoLogradouroResidencial}
                                  ${contratoCliente.nomeLogradouroResidencial},
                                  ${contratoCliente.numeroResidencial}, QUADRA:
                                  ${contratoCliente.quadraResidencial}, LOTE:
                                  ${contratoCliente.loteResidencial}, Complemento:
                                  ${contratoCliente.complementoResidencial}, Bairro:
                                  ${contratoCliente.bairroResidencial},
                                  ${contratoCliente.cepResidencial}</span
                                >&nbsp;
                              </li>
                              <li>
                                Melhor Horário:
                                <span class="HORARIO_COBRANCA token_d4s"
                                  >${contratoCliente.melhorHorario}</span
                                >&nbsp;
                              </li>
                            </ul>
                          </ul>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Caso a cobrança não seja efetuada até a data do vencimento, o
                              CONTRATANTE se responsabiliza a efetuar o pagamento no escritório da
                              CONTRATADA.</span
                            >
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >A CONTRATADA se reserva ao direito de alterar as formas de
                              pagamento disponibilizadas para o CONTRATANTE.</span
                            ><br />
                          </li>
                        </ul>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf},
                          ${contratoCliente.dataContrato}
                        </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >ANEXO 04 - SERVIÇO ADICIONAL DE CREMAÇÃO HUMANA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px">1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA </b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>1.1</b>&nbsp;Em caso de adesão, por parte do CONTRATANTE, ao
                            serviço adicional de cremação humana, o aludido serviço será regulado
                            pelo presente instrumento, que é parte integrante do contrato de
                            prestação de serviços de assistência funerária.</span
                          >
                        </p>
                        <p></p>
                        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                          <p>
                            <span style="font-size: 12px"
                              ><b>Parágrafo Único: </b>No caso de adesão ao serviço adicional de
                              cremação humana posterior ao contrato de prestação de serviços de
                              assistência funerária, o prazo contratual é contado em conformidade
                              com a Cláusula 3° do presente instrumento.&nbsp;</span
                            ><br />
                          </p>
                        </blockquote>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px">2. CLÁUSULA SEGUNDA - DO OBJETO</b>
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b style="">2.1</b>&nbsp;Constitui objeto do presente instrumento a
                            prestação dos serviços especializados de cremação em favor do
                            CONTRATANTE ou de qualquer dos beneficiários indicados no termo de
                            adesão, a serem executados sob a responsabilidade da CONTRATADA e o
                            fornecimento de 01 (uma) urna cinerária padrão, modelo Basic, 23 cm,
                            4.600 cm³, chapa galvanizada, ou outro que venha a substitui-lo, para
                            armazenamento das cinzas.</span
                          >
                        </p>
                        <p>
                          <span style=""
                            ><span style="font-size: 14px"
                              ><b style="">2.2</b> A cremação é um processo moderno, prático e
                              ecológico, feito através de fornos crematórios, utilizados
                              exclusivamente para esta finalidade. Ao final do processo restam
                              apenas as cinzas que são entregues a família ou representante legal
                              em uma urna cinerária.</span
                            ><br
                          /></span>
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >3. CLÁUSULA TERCEIRA - DO PRAZO E CARÊNCIA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na data
                            em que houver o efetivo pagamento da taxa de adesão e permanecerá pelo
                            prazo de 60 (sessenta) meses, sendo automaticamente renovado em caso
                            de não manifestação contrária das Partes.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.2</b> Fica pactuado que as pessoas adicionadas terão direito a
                              usufruir do serviço de cremação contratado após a carência de 90
                              (noventa) dias, contados da data do pagamento integral da taxa de
                              adesão do serviço adicional ou da primeira parcela.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.3</b> Se o contrato for cancelado antes do período descrito na
                              Cláusula 3 – Do Prazo e Carência e havendo a prestação do serviço de
                              cremação, caberá ao CONTRATANTE e aos seus herdeiros o pagamento do
                              residual gasto com o serviço prestado, independente da desvinculação
                              pelo cancelamento contratual.</span
                            ></span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>3.4</b> A mensalidade estará sujeita a reajuste anual calculado
                              através da aplicação da variação positiva do IGP-M (Índice Geral de
                              Preços do Mercado) ou outro que venha a substituí-lo. A aplicação do
                              índice poderá ser revista a qualquer tempo, sempre que houver
                              necessidade de recomposição real de perdas inflacionárias não
                              refletidas no índice adotado ou quando a estrutura de custos da
                              CONTRATADA assim o exigir. A aplicação da multa, juros e atualização
                              monetária é automática, inexistindo, de pleno direito, a necessidade
                              de comunicação prévia de qualquer das Partes a outra.</span
                            ></span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b style="">4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                            seguintes serviços:</span
                          >
                        </p>
                        <p></p>
                        <ul>
                          <li>
                            <span style="font-size: 14px"
                              >Serviços de atendimento telefônico e auxílio de informações;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Carro Funerário para remoção e cortejo do funeral até o crematório,
                              limitado ao munícipio de Dourados;<br
                            /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px">Cremação unitária;<br /></span>
                          </li>
                          <li>
                            <span style="font-size: 14px"
                              >Armazenamento em câmara de refrigeração por prazo determinado de 24
                              horas.</span
                            >
                          </li>
                        </ul>
                        <span style="font-size: 14px"
                          >Remoção do corpo do local do velório até o local da cremação não terá
                          custo adicional, desde que o percurso esteja dentro da área urbana do
                          município de Dourados.<br
                        /></span>
                        <p></p>
                        <p>
                          <span style="font-size: 14px"
                            >Em caso de armazenamento em câmara de refrigeração além do prazo de
                            24 horas será cobrado valor adicional.</span
                          ><br />
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
                            CREMAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>5.1</b>&nbsp;Para que o corpo da pessoa falecida por morte natural
                            seja cremado é necessário à apresentação de atestado de óbito assinado
                            por dois médicos ou por um médico legista contendo o número do CRM e o
                            endereço profissional, em via original ou cópia autenticada e a
                            autorização de cremação assinada antecedentemente pela pessoa falecida
                            ou pelo representante legal na forma pública ou particular.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>5.2</b> A cremação para o caso de morte violenta derivado de
                              crimes ou sob investigação da autoridade será necessário o atestado
                              de óbito assinado por um médico legista contendo o número do
                              registro CRM, endereço profissional em via original ou cópia
                              autenticada e alvará judicial por meio do qual o juiz não se opõe a
                              cremação do corpo.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>5.3</b> A cremação de estrangeiros não residentes no país em
                              caso de morte natural é necessária autorização judicial competente,
                              mediante solicitação formulada pelo consulado do país, do qual
                              conste o nome e o cargo de quem a formulou, autorização de cremação,
                              autorização judicial de cremação requerida pelo consulado, xerox dos
                              documentos de identidade e passaporte do falecido.</span
                            ></span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A
                            CREMAÇÃO</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as suas expensas,
                            a retirada de todo e qualquer tipo de aparelho ou equipamento que
                            tenha sido implantado no corpo a ser incinerado, tais como, marca
                            passo ou qualquer outro aparelho ou equipamento que se utilize de
                            pilhas ou baterias.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.2</b> Excepcionalmente, caso seja notada a existência de
                              aparelhos ou equipamentos implantados no corpo a ser cremado, a
                              CONTRATADA poderá a qualquer tempo, recusar-se a prestar o serviço
                              ou, caso não seja detectada a existência dos referidos aparelhos e a
                              cremação acabe sendo realizada, fica o CONTRATANTE, obrigado a
                              reparar integralmente todo e qualquer dano que venha a ser causado
                              em decorrência de tal ato.</span
                            ><br
                          /></span>
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.3</b> A cremação será realizada após o prazo de 24 horas do
                              óbito, podendo ser realizada a qualquer tempo, sendo que este
                              período até a cremação, o corpo permanecerá preservado em ambiente
                              refrigerado tecnicamente apropriado.</span
                            ></span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"
                              ><b>6.4</b> O CONTRATANTE ou seu responsável legal deverá entrar em
                              contato com a CONTRATADA para fazer o agendamento da cremação logo
                              após o óbito, devendo ser respeitado à agenda de disponibilidade
                              oferecida pela CONTRATADA.<br /></span
                          ></span>
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.1</b>&nbsp;O prazo para entrega das cinzas são de até 15
                            (quinze) dias úteis, contados a partir da cremação, disponibilizadas
                            na secretaria do crematório para serem retiradas, mediante a
                            assinatura de termo de recebimento das cinzas e apresentação de
                            documento de identificação.</span
                          >
                        </p>
                        <p>
                          <span
                            ><span style="font-size: 14px"><b>7.2&nbsp;</b></span></span
                          ><span style="font-size: 14px; color: inherit"
                            >Caso a urna com os restos das cinzas não seja retirada no local
                            dentro do prazo descrito acima, a CONTRATADA deixará disponível junto
                            ao columbário pelo prazo de 60 (sessenta) dias ininterruptos, sendo
                            que após essa data será destinado junto à empresa competente.</span
                          >
                        </p>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                      <p style="text-align: center; font-size: 14px">
                      ${unidadeTratado.municipio} - ${unidadeTratado.uf},
                      ${contratoCliente.dataContrato}
                    </p>
                      </div>
                      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
                      <div>
                        <h4 style="text-align: center">
                          <b style="font-size: 16px"
                            >ANEXO 05 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO HUMANA</b
                          >
                        </h4>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p><b>PESSOAS ADICIONADAS NO SERVIÇO DE CREMAÇÃO HUMANA</b></p>
                        ${htmlTitularCremado}
                        ${htmlCremacao}
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                            dever de observar e fazer cumprir as cláusulas aqui
                            estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong> Confirmo,
                            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                            CONTRATO.</span
                          >
                        </p>
                      </div>
                      <div>
                        <p></p>
                        <hr />
                        <p></p>
                      </div>
                      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} - ${unidadeTratado.uf},
                          ${contratoCliente.dataContrato}
                        </p>
                      </div>
                    </body>
                  </html>
                  
                  `
        } else if (templateID == 3) {
          html = `
          <!DOCTYPE html>
  <html>
    <head>
      <title>Page Title</title>
    </head>
    <body>
      <div>
        <p style="text-align: center">
          <b
            ><span style="font-size: 16px"
              >CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span
            ></b
          ><br />
        </p>
        <p></p>
      </div>
      <div>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            >Pelo presente instrumento particular de contrato de prestação de
            serviços de assistência funerária, de um lado, simplesmente denominada
            CONTRATADA, a empresa ${unidadeTratado.razaoSocial}, pessoa jurídica
            de direito privado, inscrita no CNPJ sob o nº
            ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua
            ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro
            ${unidadeTratado.bairro}, CEP 79.826-110,
            ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
            representante legal ao final assinado e do outro lado, o(a)
            consumidor(a), identificado e qualificado na Ficha de Qualificação,
            parte integrante e indissociável deste contrato, simplesmente
            denominado CONTRATANTE.</span
          ><br />
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b
          >
        </h4>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>1.1</b>&nbsp;Pelo presente instrumento a CONTRATADA, através de
            recursos próprios ou de empresas designadas por ela, disponibilizará
            ao CONTRATANTE e seus beneficiários o Plano de Assistência Familiar –
            Pax Primavera, objetivando prestação de serviços de assistência
            funerária e outros benefícios extras que ficarão disponibilizados para
            o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros
            do plano optado e as condições especificadas abaixo:</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>1.2</b>&nbsp;Os serviços de exumação, confecção de pedras, fotos,
            embelezamento e fornecimento de jazigo/gaveta (túmulo), não serão
            cobertos neste contrato, sendo eventuais despesas de inteira
            responsabilidade do CONTRATANTE.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>1.3</b>&nbsp;Serviços e despesas não contemplados neste contrato
            serão custeados pelo CONTRATANTE ou o beneficiário responsável pelo
            funeral.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>1.4</b>&nbsp;Todo o serviço solicitado ou material adquirido que
            não atenda às especificações deste contrato, bem como todo serviço ou
            produto adquirido junto a terceiros ou empresas congêneres, sem
            autorização por escrito da CONTRATADA, será de inteira e exclusiva
            responsabilidade do CONTRATANTE e seus dependentes, não cabendo neste
            caso, qualquer tipo de restituição, reembolso, devolução ou
            indenização.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA GEOGRÁFICA</b
          >
        </h4>
      </div>
      <div>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>2.1</b>&nbsp;A abrangência geográfica dos serviços
            disponibilizados pela CONTRATADA compreende a localidade da sede
            Matriz e demais comarcas das filiais correspondentes.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b
            ><span style="font-size: 16px"
              >3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span
            ></b
          >
        </h4>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes
            serviços:<br
          /></span>
        </p>
        <p></p>
        <ul>
          <li>
            <span style="font-size: 14px"
              >Plantão 24 horas para atendimento telefônico e auxílio de
              informações ao CONTRATANTE e seus dependentes;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Atendimento funerário nas localidades em que a empresa está
              instalada - Matriz ou filial;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Traslado rodoviário para as áreas de atuação acima descritas, nos
              limites do plano contratado e assinalado no Termo de Adesão;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Urna mortuária estilo sextavado em conformidade com o plano
              adquirido;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Paramentação conforme o credo religioso;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Carro funerário para remoção, cortejo e sepultamento;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Decoração de flores naturais e/ou artificiais na urna, conforme a
              disponibilidade de mercado onde serão executados os serviços;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px">Velas;<br /></span>
          </li>
          <li>
            <span style="font-size: 14px">Véu;<br /></span>
          </li>
          <li>
            <span style="font-size: 14px">Livro de presença;<br /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Sala de velório, apenas nas localidades onde a CONTRATADA mantém
              sala disponível.</span
            >
          </li>
        </ul>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE ALIMENTAÇÃO</b
          >
        </h4>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>4.1</b>&nbsp;Lanche servido na capela: 50 (cinquenta) pães; 250g
            (duzentos e cinquenta gramas) de manteiga; 02 (dois) litros de leite;
            02 (dois) pacotes de bolacha de água e sal; Chá e café à
            vontade.</span
          >
        </p>
        <p style="">
          <span style="font-size: 14px"
            ><b style="">4.2</b>&nbsp;Kit lanche para residencial: 500g
            (quinhentos gramas) de chá; 500g (quinhentos gramas) de café; 02kg
            (dois quilos) de açúcar; 01 (um) pacote de bolacha de água e sal; 250g
            (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
            café.</span
          >
        </p>
        <p></p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Primeiro:</b> Eventual substituição de produto em
              decorrência da falta de fabricação ou distribuição do mercado será
              substituída por produto equivalente ou de igual valor.<br
            /></span>
          </p>
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Segundo:</b> Os itens compreendidos acima fazem
              referência aos serviços e produtos mínimos ofertados para todos os
              planos disponíveis da CONTRATADA.</span
            >
          </p>
        </blockquote>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <h4 style="text-align: center">
        <b
          ><span style="font-size: 16px"
            >5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO
          </span></b
        >
      </h4>
      <div style="text-align: center">
        <h1></h1>
        <p></p>
      </div>
      <div style="text-align: center">
        <h1></h1>
        <p></p>
      </div>
      <div style="text-align: center">
        <h1></h1>
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>5.1</b> O meio de transporte a ser utlizadao para o translado do
            corpo será o rodoviário.</span
          >
        </p>
        <p></p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de
              inteira responsabilidade do CONTRATANTE, podendo a CONTRATADA
              proceder apenas com a intermediação de informações e apoio.</span
            >
          </p>
        </blockquote>
        <span style="color: inherit; font-size: 14px">
          <p>
            <b style="color: inherit">5.2</b
            ><span style="color: inherit">
              Não haverá qualquer tipo de reembolso de quaisquer despesas
              efetuadas pelo CONTRATANTE em caso de solicitação de serviços não
              previstos no respectivo plano optado.</span
            ><br />
          </p>
        </span>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <h4 style="text-align: center">
        <b
          ><span style="font-size: 16px"
            >6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E DEPENDENTES</span
          ></b
        >
      </h4>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>6.1</b> A CONTRATADA fornecerá os serviços funerários
            correspondentes ao CONTRATANTE e seus dependentes, conforme plano
            escolhido no Termo de Adesão.</span
          >
        </p>
        <p></p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Primeiro:</b>&nbsp;Entende como
              beneficiários/dependentes (pais, cônjuge, filhos enquanto solteiros
              mediante comprovação, filhos solteiros incapazes sem limite de
              idade, ou dependentes com guarda judicial comprovada
              documentalmente). A alteração das condições especificadas na
              cláusula acima excluirá a condição de dependentes e/ou beneficiários
              do respectivo contrato.</span
            >
          </p>
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de
              novos dependentes será considerada individualmente a obrigação do
              cumprimento da carência de 90 (noventa) dias, que será contada a
              partir da data de sua inclusão.<br
            /></span>
          </p>
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha
              de Qualificação, entre seus pais ou os pais do cônjuge, não sendo
              permitida a cobertura da prestação para ambos simultaneamente.<br
            /></span>
          </p>
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes
              prestadas na Ficha de Qualificação e no contrato de prestação de
              assistência funerária serão consideradas verdadeiras, sob pena de
              responsabilidade civil e criminal do CONTRATANTE.<br
            /></span>
          </p>
        </blockquote>
        <span style="color: inherit; font-size: 14px">
          <p>
            <span style="color: inherit; font-size: 14px"><br /></span>
          </p>
          <b>6.2</b> O CONTRATANTE pagará a CONTRATADA no ato da assinatura do
          presente contrato, o valor estipulado no Termo de Adesão.
        </span>
        <br />
        <p></p>
        <p>
          <span style="color: inherit; font-size: 14px"
            ><b>6.3</b> Todas as parcelas de preço terão seus vencimentos na data
            apontada no Termo de Adesão, salvo nos casos em que o vencimento
            recair em finais de semana e feriados nacionais e locais, hipótese em
            que serão automaticamente prorrogadas para o primeiro dia útil
            seguinte.<br
          /></span>
        </p>
        <p>
          <span style="color: inherit; font-size: 14px"
            ><b>6.4</b> Caberá ao CONTRATANTE o pagamento da mensalidade total
            fixada para cada ano-base no Termo de Adesão, conforme tabela de
            preços descritos no Termo de Adesão vigente à época, que estará
            sujeita a reajuste anual através da aplicação da variação positiva do
            índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que
            venha a substituí-lo, sendo que a data base para o reajuste se dará no
            primeiro dia de cada ano. A aplicação do índice poderá ser revista a
            qualquer tempo, sempre que houver necessidade de recomposição real de
            perdas inflacionárias não refletidas no índice adotado ou quando a
            estrutura de custos da CONTRATADA assim o exigir.<br
          /></span>
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <h4 style="text-align: center">
        <b style="font-size: 16px"
          >7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE PAGAMENTO</b
        >
      </h4>
      <div>
        <h1></h1>
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>7.1</b> O presente contrato entrará em vigor na data em que houver
            o efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60
            (sessenta) meses, sendo automaticamente renovado em caso de não
            manifestação contrária das Partes.</span
          >
        </p>
        <p></p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p>
            <span style="font-size: 12px"
              ><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
              “efetivo pagamento” será considerado o momento do recebimento do
              valor pactuado à vista em moeda corrente;</span
            >
          </p>
        </blockquote>
        <span style="color: inherit; font-size: 14px">
          <p>
            <b style="color: inherit">7.2</b
            ><span style="color: inherit">
              Fica pactuado que o CONTRATANTE e os dependentes terão direito a
              usufruir dos benefícios contratados relativos ao plano escolhido
              após a carência de 90 (noventa) dias, contados da data do pagamento
              integral da taxa de adesão ou da primeira parcela.</span
            ><br />
          </p>
        </span>
        <p></p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p></p>
          <div class="edit">
            <p>
              <span style="font-size: 12px"
                ><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                mora a partir do primeiro dia do vencimento da primeira
                mensalidade referente ao plano aderido, independente de
                notificação, ficando os serviços terminantemente suspensos;</span
              >
            </p>
          </div>
          <p></p>
          <p></p>
          <div class="edit">
            <p>
              <span style="font-size: 12px"
                ><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                rescindido após três meses de atraso.</span
              >
            </p>
          </div>
          <p></p>
        </blockquote>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="font-size: 16px; text-align: center">
          <b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
        </h4>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>8.1</b>&nbsp;O não pagamento das quantias devidas dentro do prazo
            convencionado na aquisição do Termo de Adesão implicará na incidência
            de multa de 2,0% (dois por cento) do valor devido e não pago,
            acrescida de juros de mora de 1,0%, (um por cento) ao mês e correção
            monetária pela aplicação da variação positiva do IGP-M (Índice Geral
            de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação
            da multa, juros e atualização monetária é automática, inexistindo, de
            pleno direito, a necessidade de comunicação prévia de qualquer das
            Partes a outra.</span
          ><br />
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS PARTES</b
          >
        </h4>
      </div>
      <div>
        <p><b>DA CONTRATADA:</b></p>
        <p>
          <span style="font-size: 14px"
            ><b>9.1</b>&nbsp;Executar os serviços contratados de forma objetiva ao
            CONTRATANTE;</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>9.2</b>&nbsp;Facilitar acesso às informações necessárias dos
            serviços oferecidos aos beneficiários;</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>9.3</b> Cumprir o plano contratado com estrita observância das
            condições e cláusulas descritas neste contrato e anexos.</span
          >
        </p>
        <p><b>DO(A) CONTRATANTE</b></p>
        <p>
          <span style="font-size: 14px"
            ><b>9.4</b>&nbsp;Manter em dia o pagamento das mensalidades, bem como,
            seus dados cadastrais devidamente atualizados.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><b>9.5</b>&nbsp;Comunicar, imediatamente, o falecimento de qualquer
            dos beneficiários do plano, para que se possa usufruir dos serviços
            contratados;</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E SEUS EFEITOS</b
          >
        </h4>
      </div>
      <div>
        <p></p>
        <div class="edit">
          <p>
            <span style="font-size: 14px"
              ><b>10.1</b>&nbsp;No caso de inadimplência de três mensalidades, o
              contrato será rescindido sem que haja a incidência de qualquer
              multa, desde que o CONTRATANTE e seus dependentes não tenham
              utilizado os serviços fúnebres.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>10.2</b>&nbsp;Após a prestação dos serviços fúnebres e caso o
              contrato vigente tenha mais de 60 (sessenta) meses de duração,
              poderão os herdeiros requisitar o cancelamento do contrato sem
              qualquer ônus, no entanto, se o contrato for cancelado antes do
              período citado e havendo a prestação de serviços fúnebres, caberá
              aos herdeiros o pagamento do residual gasto com o serviço prestado,
              independente da desvinculação pelo cancelamento contratual.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>10.3</b>&nbsp;Ensejando no cancelamento do contrato e com a
              devida prestação dos serviços, a CONTRATADA estará responsável pela
              apuração do saldo devedor para a devida quitação dos serviços
              prestados, apresentando de forma objetiva e clara os custos dos
              serviços para sua devida quitação.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>10.4</b>&nbsp;O saldo remanescente deverá ser quitado na forma à
              vista, ou por meio de confissão de dívida para emissão de boleto
              bancário.</span
            >
          </p>
          <p>
            <span
              ><span style="font-size: 14px"
                ><b>10.5</b>&nbsp;Emitido o boleto, e não havendo o pagamento no
                vencimento, o devedor será inserido no SCPC e Serasa, bem como,
                serão tomadas as medidas judiciais cabíveis para a devida quitação
                da dívida.</span
              ><br
            /></span>
          </p>
        </div>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h1 style="font-size: 16px; text-align: center">
          <b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE TITULARIDADE</b>
        </h1>
      </div>
      <div>
        <p></p>
        <div class="edit">
          <p>
            <span style="font-size: 14px"
              ><b>11.1</b>&nbsp;Em caso de falecimento do CONTRATANTE, poderão os
              dependentes ou responsável legal, assumir o contrato principal,
              passando assim a ser responsável dos direitos e obrigações assumidos
              neste contrato, sendo respeitado a obrigação do cumprimento da
              carência de 90 (noventa) dias para qualquer novo titular o
              dependente, conforme especificado na Cláusula 6.1.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>11.2</b>&nbsp;Para a transferência da titularidade, é
              imprescindível que o contrato esteja livre de qualquer débito e haja
              a anuência do antigo e do novo titular.</span
            >
          </p>
        </div>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h1 style="font-size: 16px; text-align: center">
          <b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
        </h1>
      </div>
      <div>
        <p></p>
        <div class="edit">
          <p>
            <span style="font-size: 14px"
              ><b style="">12.1</b>&nbsp;Qualquer documento, anexo ou outros
              instrumentos decorrentes de alterações contratuais, substituições,
              consolidações e respectivas complementações faz parte integrante do
              presente contrato, salvo se expressamente disposto de forma
              diversa.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>12.2</b>&nbsp;Caso uma mesma pessoa seja designada beneficiária
              em mais de um contrato, será válido apenas um dos contratos.</span
            >
          </p>
          <p>
            <span style="font-size: 14px"
              ><b>12.3</b>&nbsp;Todas as referências a quaisquer Partes deste
              contrato incluem seus sucessores, beneficiários,
              representantes.</span
            >
          </p>
          <p>
            <b style="font-size: 14px; color: inherit">12.4</b
            ><span style="font-size: 14px; color: inherit"
              >&nbsp;Faz parte integrante e indissociável deste contrato, como se
              nele estivessem transcritos, a Ficha de Qualificação, o Termo de
              Adesão e demais anexos, cujo conteúdo o CONTRATANTE declara haver
              tomado amplo conhecimento, tendo aceitado todos os seus termos, sem
              qualquer restrição ou objeção.</span
            >
          </p>
          <p>
            <b style="font-size: 14px; color: inherit">12.5</b
            ><span style="font-size: 14px; color: inherit"
              >&nbsp;As Partes reconhecem como válidas eficazes e suficientes às
              comunicações, notificações e cobranças enviadas para o endereço
              indicado na Ficha de Qualificação, cabendo a este informar a
              CONTRATADA sobre qualquer alteração de endereço ou de seus dados
              cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
              contados do evento.</span
            >
          </p>
          <p>
            <span style="font-size: 14px; color: inherit"
              ><b>12.6&nbsp;</b>A mensalidade tem como principal objetivo a
              manutenção e disponibilização de toda a infraestrutura necessária ao
              atendimento desse serviço e, desta forma, a não ocorrência de
              falecimento dos beneficiários não implica em qualquer forma de
              reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os
              demais serviços estavam sendo oferecidos.</span
            >
          </p>
          <p>
            <span style="font-size: 14px; color: inherit"
              ><b>12.7</b>&nbsp;O não exercício, da CONTRATADA, de quaisquer dos
              direitos ou prerrogativas previstas neste contrato ou seus anexos,
              ou mesmo na legislação aplicável, será tido como ato de mera
              liberalidade, não constituindo alteração ou novação das obrigações
              ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
              tempo, independentemente de comunicação prévia à outra parte.</span
            >
          </p>
        </div>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui
            estabelecidas.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><strong>TESTEMUNHA:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
            CONTRATO.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
      <div>
        <h1 style="font-size: 16px; text-align: center">
          <b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b>
        </h1>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p><b>DADOS DO TITULAR</b></p>
        <p>
          Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style=""
            >${contratoCliente.nomeTitular}</span
          >&nbsp;
        </p>
        <p>
          R.G.:&nbsp;<span class="RG_TITULAR token_d4s"
            >${contratoCliente.rgTitular}</span
          >&nbsp;
        </p>
        <p>
          CPF:&nbsp;<span class="CPF_TITULAR token_d4s"
            >${contratoCliente.cpfTitular}</span
          >&nbsp;
        </p>
        <p>
          Sexo:
          <span class="SEXO_TITULAR token_d4s"
            >${contratoCliente.sexoTitular}</span
          >&nbsp;
        </p>
        <p>
          Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"
            ><span class="DA_Nasc_Titular token_d4s"
              ><span class="DATA_NASC_TITULAR token_d4s"
                >${contratoCliente.dataNascTitular}</span
              >&nbsp;</span
            ></span
          >
        </p>
        <p>
          Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"
            ><span class="ESTADO_CIVIL_TITULAR token_d4s"
              >${contratoCliente.estadoCivilTitular}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Profissão:
            <span class="PROFISSAO_TITULAR token_d4s"
              >${contratoCliente.profissaoTitular}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Religião:&nbsp;<span class="Religiao_Titular token_d4s"
              ><span class="RELIGIAO_TITULAR token_d4s"
                >${contratoCliente.religiaoTitular}</span
              >&nbsp;</span
            ></span
          ><br />
        </p>
        <p>Naturalidade:${contratoCliente.naturalidadeTitular}<br />
        </p>
        <p>
          Nacionalidade:
          <span class="NACIONALIDADE_TITULAR token_d4s"
            >${contratoCliente.nacionalidadeTitular}</span
          >&nbsp;
        </p>
        <p>
          Telefone 01:
          <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span
          >&nbsp;
        </p>
        <p>
          Telefone 02:
          <span class="TELEFONE_02 token_d4s"
            >${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span
          >&nbsp;
        </p>
        <p>
          E-mail 01:
          <span class="EMAIL01 token_d4s"
            ><span class="EMAIL_01 token_d4s">${contratoCliente.email1}</span
            >&nbsp;</span
          >&nbsp;
        </p>
        <p>
          E-mail 02:
          <span class="EMAIL_02 token_d4s" style=""
            >${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span
          >&nbsp;
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p></p>
        <div class="edit">
          <p><b>DADOS RESIDENCIAIS</b></p>
          <p>
            <span style="color: inherit">Endereço Residencial:&nbsp;</span
            ><span style="color: inherit"
              ><span class="ENDERECO_RES token_d4s"
                ><span class="ENDERECO_RESIDENCIAL token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial}</span
                ></span
              ></span
            >
          </p>
          <p>
            <span style="color: inherit"
              >Número:
              <span class="NUMERO_END_RESIDENCIAL token_d4s"
                >${contratoCliente.numeroResidencial}</span
              >&nbsp;</span
            >
          </p>
          <p>
            <span style="color: inherit"
              >Complemento:
              <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                >${contratoCliente.complementoResidencial}</span
              >&nbsp;</span
            >
          </p>
          <p>
            <span style="color: inherit"
              >Bairro:
              <span class="BAIRRO_RESIDENCIAL token_d4s"
                >${contratoCliente.bairroResidencial}</span
              >&nbsp;</span
            >
          </p>
          <p>
            <span style="color: inherit"
              >CEP:
              <span class="CEP_RESIDENCIAL token_d4s"
                >${contratoCliente.cepResidencial}</span
              >&nbsp;</span
            >
          </p>
          <p>
            <span style="color: inherit"
              >Cidade:
              <span class="CIDADE_RESIDENCIAL token_d4s"
                >${contratoCliente.cidadeResidencial}</span
              >&nbsp;</span
            >
          </p>
          <p>
            <span style="color: inherit"
              >U.F:
              <span class="ESTADO_RESIDENCIAL token_d4s"
                >${contratoCliente.estadoResidencial}</span
              >&nbsp;</span
            >
          </p>
        </div>
        <p></p>
        <div class="edit">
                  <p><b>DADOS COMERCIAIS</b></p>
                  <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                  ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                  </p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p></p>
        <div class="edit">
          <p><b>DEPENDENTES</b></p>
          ${htmlDependentesHumano}
        </div>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
      <div>
        <h1 style="font-size: 16px; text-align: center">
          <b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b>
        </h1>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <b><span style="font-size: 14px">PLANO 01 - BÁSICO</span></b>
        </p>
        <p style="text-align: justify"></p>
        <ul>
          <li>
            <span style="font-size: 14px"
              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              ><span style="color: inherit"
                >Paramentação conforme o credo religioso;</span
              ><br
            /></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Velas;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Carro funerário para remoção e sepultamento;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Véu;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Sala de velório, se necessário nas localidades onde o grupo
                mantém sala;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                disponibilidade de mercado onde será executado os serviços;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Transporte de até 100Km.</span></span
            >
          </li>
        </ul>
        <p></p>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <b><span style="font-size: 14px">PLANO 02 - SUPER-LUXO</span></b>
        </p>
        <p style="text-align: justify"></p>
        <ul>
          <li>
            <span style="font-size: 14px"
              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais
              do fundo e tampa entalhada em baixo relevo, 2 sobretampos entalhados
              em alto relevo, guarnição (friso) na tampa, madeira pinnus tingida
              na cor mogno, verniz alto brilho, fundo Eucatex, 6 fixadores tipo
              concha com varões, laterais dourados, 9 chavetas fundidas e pintadas
              na cor dourada, forrada em tecido branco com renda larga, sobre
              babado (rendão) branco com 20 cm de largura, taxas douradas, visor
              médio de vidro rodeado por renda larga, travesseiro solto. (Marca:
              De acordo com fornecedor vigente)<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              ><span style="color: inherit"
                >Paramentação conforme o credo religioso;</span
              ><br
            /></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Velas;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Carro funerário para remoção e sepultamento;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Véu;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Sala de velório, se necessário nas localidades onde o grupo
                mantém sala;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                disponibilidade de mercado onde será executado os serviços;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                conforme a disponibilidade de mercado onde será executado os
                serviços;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Abertura de jazigo (não se confundindo com o fornecimento de
                túmulo / gaveta);<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Tanatopraxia (preparação do corpo);<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >01 (uma) veste, disponível na ocasião;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Transporte de até 250Km.</span></span
            >
          </li>
        </ul>
        <p></p>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <b><span style="font-size: 14px">PLANO 03 - LUXO</span></b>
        </p>
        <p style="text-align: justify"></p>
        <ul>
          <li>
            <span style="font-size: 14px"
              >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
              silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
              tingida na cor nogueira, verniz alto brilho, fundo e tampa de
              eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
              dourada, forro e babado rendão tecido 50g branco, taxas douradas,
              travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              ><span style="color: inherit"
                >Paramentação conforme o credo religioso;</span
              ><br
            /></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Velas;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Carro funerário para remoção e sepultamento;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Véu;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Sala de velório, se necessário nas localidades onde o grupo
                mantém sala;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Decoração de flores naturais e/ou artificiais na urna, conforme a
                disponibilidade de mercado onde será executado os serviços;<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px"
                >Tanatopraxia (preparação do corpo);<br /></span
            ></span>
          </li>
          <li>
            <span style="color: inherit"
              ><span style="font-size: 14px">Transporte de até 150Km.</span></span
            >
          </li>
        </ul>
        <p></p>
        <p></p>
      </div>
      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
      <div>
        <h1 style="font-size: 16px; text-align: center">
          <b style="font-size: 16px">ANEXO 03 - TERMO DE ADESÃO</b>
        </h1>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p><b>DADOS DO CONTRATO</b></p>
        <p></p>
        <ul>
          <li>
            Plano Selecionado:&nbsp;<span class="PLANO_SELECIONADO token_d4s"
              >${planoTratado.descricao}</span
            >&nbsp;
          </li>
          <li>
            <span style="color: inherit">Formato da&nbsp;Venda: </span
            ><span
              class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
              style="color: inherit"
              >${contratoCliente.tipo}</span
            ><span style="color: inherit">&nbsp;</span>
          </li>
          <ul>
            <li>
              <span style="font-size: 12px"
                ><b>Em caso de transferência:</b></span
              >
            </li>
            <ul>
              <li>
                <span style="font-size: 12px"
                  >Empresa Anterior:
                  <span class="EMPRESA_ANTERIOR token_d4s"
                    >${contratoCliente.empresaAntiga == 'null' ? " " :
              contratoCliente.empresaAntiga}</span
                  >&nbsp;</span
                >
              </li>
              <li>
                <span style="font-size: 12px"
                  >Data de Assinatura do Contrato Anterior:
                  <span class="DATA_CONTRATO_ANTERIOR token_d4s"
                    >${contratoCliente.dataContratoAntigo == 'null' ? " " :
              contratoCliente.dataContratoAntigo}</span
                  >&nbsp;</span
                >
              </li>
            </ul>
          </ul>
        </ul>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
            <p></p>
          </blockquote>
        </blockquote>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p><b style="font-size: 14px">TAXA DE ADESÃO</b></p>
        <p></p>
        <ul>
          <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
          <li>Adicional de Cremação PET: R$ ${result.id >= 2 ? 0 : adesaoPet}</li>
          <li style="font-size: 14px">
            <b style="font-size: 16px"
              >Total da Taxa de Adesão:R$ ${result.id >= 2 ? planoTratado.valorAdesao : valorTotalAdesao}</b
            >
          </li>
        </ul>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p><b style="font-size: 14px">MENSALIDADE</b></p>
        <p></p>
        <ul>
          <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}</li>
          <li>Adicional de Cremação PET:R$ ${mensalidadePet}</li>
          <li>
            <b>Total da Mensalidade:R$ ${valorTotalMensalidade}</b>
          </li>
        </ul>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"><b>DADOS DE PAGAMENTO</b></span>
        </p>
        <p></p>
        <ul>
          <li>
            Data de Vencimento da Primeira
            Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
          </li>
          <li>
            Forma de Pagamento:
            <span class="FORMA_PAGAMENTO token_d4s"
              >${contratoCliente.localCobranca}</span
            >&nbsp;
          </li>
          <ul>
            <li>Em caso de cobrador, qual o endereço de cobrança?</li>
            <ul>
              <li>
                Endereço de Cobrança:
                <span class="ENDERECO_COBRANCA token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial},
                  ${contratoCliente.numeroResidencial}, QUADRA:
                  ${contratoCliente.quadraResidencial == 'null' ? "" : contratoCliente.quadraResidencial}, LOTE:
                  ${contratoCliente.loteResidencial == 'null' ? "" : contratoCliente.loteResidencial}, Complemento:
                  ${contratoCliente.complementoResidencial}, Bairro:
                  ${contratoCliente.bairroResidencial},
                  ${contratoCliente.cepResidencial}</span
                >&nbsp;
              </li>
              <li>
                Melhor Horário:
                <span class="HORARIO_COBRANCA token_d4s"
                  >${contratoCliente.melhorHorario}</span
                >&nbsp;
              </li>
            </ul>
          </ul>
        </ul>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p></p>
        <ul>
          <li>
            <span style="font-size: 14px"
              >Caso a cobrança não seja efetuada até a data do vencimento, o
              CONTRATANTE se responsabiliza a efetuar o pagamento no escritório da
              CONTRATADA.</span
            >
          </li>
          <li>
            <span style="font-size: 14px"
              >A CONTRATADA se reserva ao direito de alterar as formas de
              pagamento disponibilizadas para o CONTRATANTE.</span
            ><br />
          </li>
        </ul>
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui
            estabelecidas.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><strong>TESTEMUNHA:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
            CONTRATO.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
      <h4 style="text-align: center">
        <b style="font-size: 16px"
          >ANEXO 04 - SERVIÇO ADICIONAL DE CREMAÇÃO DE ANIMAIS</b
        >
      </h4>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px">1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA</b>
        </h4>
      </div>
      <div>
        <p style="font-size: 14px">
          <b>1.1</b>&nbsp;<span style="color: inherit"
            >Em caso de adesão por parte do CONTRATANTE ao serviço adicional de
            cremação de animais, o aludido serviço será regulado pelo presente
            instrumento, que é parte integrante do contrato de prestação de
            serviços de assistência funerária.</span
          >
        </p>
        <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
          <p>
            <span style="color: inherit"
              ><span style="font-size: 12px"
                ><b>Parágrafo Único:</b> No caso de adesão ao serviço adicional de
                cremação de animal posterior ao contrato de prestação de serviços
                de assistência funerária, o prazo contratual é contado em
                conformidade com a Cláusula 3° do presente
                instrumento.&nbsp;</span
              ><br
            /></span>
          </p>
        </blockquote>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px">2. CLÁUSULA SEGUNDA - DO OBJETO</b>
        </h4>
      </div>
      <div>
        <p style="font-size: 14px">
          <b>2.1</b>&nbsp;<span style="color: inherit"
            >Constitui objeto do presente instrumento a prestação dos serviços
            especializados de cremação de animais domésticos em favor do
            CONTRATANTE sob a responsabilidade da CONTRATADA na forma com resgate
            de cinzas ou sem resgate de cinzas.</span
          >
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>2.2</b> A cremação é um processo moderno, prático e ecológico,
            feito através de fornos crematórios, utilizados exclusivamente para
            esta finalidade. Ao final do processo restam apenas as cinzas que são
            entregues ao responsável em uma urna cinerária feita especialmente
            para os restos do animal.<br
          /></span>
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >3. CLÁUSULA TERCEIRA - DO PRAZO DE PAGAMENTO</b
          >
        </h4>
      </div>
      <div>
        <p style="font-size: 14px">
          <b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na data em
          que houver o efetivo pagamento da taxa de adesão e permanecerá pelo
          prazo de 60 (sessenta) meses, sendo automaticamente renovado em caso de
          não manifestação contrária das Partes.
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>3.2</b> Fica pactuado que os animais adicionados terão direito a
            usufruir do serviço de cremação contratado após a carência de 90
            (noventa) dias, contados da data do pagamento integral da taxa de
            adesão ou da primeira parcela.<br
          /></span>
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>3.3</b> Se o contrato for cancelado antes do período descrito na
            Cláusula 3 – Do Prazo e Carência e havendo a prestação do serviço de
            cremação, caberá ao CONTRATANTE e aos seus herdeiros o pagamento do
            residual gasto com o serviço prestado, independente da desvinculação
            pelo cancelamento contratual.<br
          /></span>
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>3.4</b> A mensalidade estará sujeita a reajuste anual calculado
            através da aplicação da variação positiva do IGP-M (Índice Geral de
            Preços do Mercado) ou outro que venha a substituí-lo. A aplicação do
            índice poderá ser revista a qualquer tempo, sempre que houver
            necessidade de recomposição real de perdas inflacionárias não
            refletidas no índice adotado ou quando a estrutura de custos da
            CONTRATADA assim o exigir.<br
          /></span>
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS</b
          >
        </h4>
      </div>
      <div>
        <p style="">
          <span style="font-size: 14px"
            ><b style="">4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
            seguintes serviços:</span
          >
        </p>
        <p style=""></p>
        <ul style="">
          <li>
            <span style="font-size: 14px"
              >Serviços de atendimento telefônico e auxílio de informações;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Veículo para remoção domiciliar ou em clínica / hospital
              veterinário que estejam dentro do perímetro urbano de
              Dourados-MS;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Cremação do animal nas formas: (i) com regaste de cinzas; e (ii)
              sem resgate de cinzas;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Urna cinerária, apenas nos casos de cremação com resgate de
              cinzas;<br
            /></span>
          </li>
          <li>
            <span style="font-size: 14px">Certificado de cremação;<br /></span>
          </li>
          <li>
            <span style="font-size: 14px"
              >Armazenamento em câmara de refrigeração por prazo determinado de 24
              horas.<br
            /></span>
          </li>
        </ul>
        <span style="font-size: 14px"
          >Remoção do animal até o local da cremação não terá custo adicional,
          desde que o percurso esteja dentro da área urbana do município de
          Dourados.<br
        /></span>
        <p></p>
        <p style="">
          <span style="font-size: 14px"
            >Em caso de armazenamento em câmara de refrigeração além do prazo de
            24 horas será cobrado valor adicional.</span
          ><br />
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
            CREMAÇÃO</b
          >
        </h4>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b style="">5.1</b>&nbsp;O CONTRATANTE deverá apresentar os
            documentos pessoais juntamente com a cópia do contrato diretamente no
            setor administrativo, bem como, firmar declaração de que o animal
            objeto da prestação de serviço é de sua propriedade e que requer a
            prestação de serviço pactuado no animal indicado.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A
            CREMAÇÃO</b
          >
        </h4>
      </div>
      <div>
        <p style="font-size: 14px">
          <b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as suas expensas, a
          retirada de todo e qualquer tipo de aparelho ou equipamento que utilize
          de pilhas ou baterias, que tenha sido implantado no animal a ser
          cremado.
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>6.2</b> Excepcionalmente, caso seja notada a existência de
            aparelhos ou equipamentos implantados no corpo do animal a ser
            cremado, a CONTRATADA poderá a qualquer tempo, recusar-se a prestar o
            serviço ou, caso não seja detectada a existência dos referidos
            aparelhos e a cremação acabe sendo realizada, fica o CONTRATANTE
            obrigado a reparar integralmente todo e qualquer dano que venha a ser
            causado em decorrência de tal ato.<br
          /></span>
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>6.3</b> O CONTRATANTE deverá entrar em contato com a CONTRATADA
            para fazer o agendamento da cremação logo após o óbito, devendo ser
            respeitado à agenda de disponibilidade oferecida pela
            CONTRATADA.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS NO CASO DE
            CREMAÇÃO COM RESGATE DE CINZAS</b
          >
        </h4>
      </div>
      <div>
        <p style="font-size: 14px">
          <b>7.1</b>&nbsp;O prazo para retirada das cinzas são de até 15 (quinze)
          dias úteis, contados a partir da cremação, disponibilizadas na
          secretária do crematório para serem retiradas, mediante a assinatura de
          termo de recebimento das cinzas e apresentação de documento de
          identificação.
        </p>
        <p style="font-size: 14px">
          <span style="color: inherit"
            ><b>7.2</b> Caso a urna cinerária com os restos das cinzas não seja
            retirada no local dentro do prazo descrito acima, a CONTRATADA
            procederá para realizar a destinação junto à empresa competente.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui
            estabelecidas.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><strong>TESTEMUNHA:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
            CONTRATO.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
      <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
      <div>
        <h4 style="text-align: center">
          <b style="font-size: 16px"
            >ANEXO 05 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO DE
            ANIMAIS</b
          >
        </h4>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><b>ANIMAIS ADICIONADOS NO SERVIÇO DE CREMAÇÃO PET</b></span
          >
        </p>
        ${htmlDependentesPet}
        <p></p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui
            estabelecidas.</span
          >
        </p>
        <p>
          <span style="font-size: 14px"
            ><strong>TESTEMUNHA:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
            CONTRATO.</span
          >
        </p>
      </div>
      <div>
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
    </body>
  </html>
  
                  `
        } else {
          html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Page Title</title>
            </head>
            <body>
              <div>
                <p style="text-align: center">
                  <b
                    ><span style="font-size: 16px"
                      >CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span
                    ></b
                  ><br />
                </p>
                <p></p>
              </div>
              <div>
                <p style="text-align: justify">
                  <span style="font-size: 14px"
                    >Pelo presente instrumento particular de contrato de prestação de
                    serviços de assistência funerária, de um lado, simplesmente denominada
                    CONTRATADA, a empresa ${unidadeTratado.razaoSocial}, pessoa jurídica
                    de direito privado, inscrita no CNPJ sob o nº
                    ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua
                    ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro
                    ${unidadeTratado.bairro}, CEP 79.826-110,
                    ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
                    representante legal ao final assinado e do outro lado, o(a)
                    consumidor(a), identificado e qualificado na Ficha de Qualificação,
                    parte integrante e indissociável deste contrato, simplesmente
                    denominado CONTRATANTE.</span
                  ><br />
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >1. CLÁUSULA PRIMERA – DO OBJETO DO CONTRATO</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>1.1</b>&nbsp;Pelo presente instrumento a CONTRATADA, através de
                    recursos próprios ou de empresas designadas por ela, disponibilizará
                    ao CONTRATANTE e seus beneficiários o Plano de Assistência Familiar –
                    Pax Primavera, objetivando prestação de serviços de assistência
                    funerária e outros benefícios extras que ficarão disponibilizados para
                    o cliente aderir, de acordo com a Lei 13.261/2016, com os parâmetros
                    do plano optado e as condições especificadas abaixo:</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>1.2</b>&nbsp;Os serviços de exumação, confecção de pedras, fotos,
                    embelezamento e fornecimento de jazigo/gaveta (túmulo), não serão
                    cobertos neste contrato, sendo eventuais despesas de inteira
                    responsabilidade do CONTRATANTE.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>1.3</b>&nbsp;Serviços e despesas não contemplados neste contrato
                    serão custeados pelo CONTRATANTE ou o beneficiário responsável pelo
                    funeral.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>1.4</b>&nbsp;Todo o serviço solicitado ou material adquirido que
                    não atenda às especificações deste contrato, bem como todo serviço ou
                    produto adquirido junto a terceiros ou empresas congêneres, sem
                    autorização por escrito da CONTRATADA, será de inteira e exclusiva
                    responsabilidade do CONTRATANTE e seus dependentes, não cabendo neste
                    caso, qualquer tipo de restituição, reembolso, devolução ou
                    indenização.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >2. CLÁUSULA SEGUNDA – DA ABRANGÊNCIA GEOGRÁFICA</b
                  >
                </h4>
              </div>
              <div>
                <p style="text-align: justify">
                  <span style="font-size: 14px"
                    ><b>2.1</b>&nbsp;A abrangência geográfica dos serviços
                    disponibilizados pela CONTRATADA compreende a localidade da sede
                    Matriz e demais comarcas das filiais correspondentes.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b
                    ><span style="font-size: 16px"
                      >3.&nbsp;CLÁUSULA TERCEIRA – DOS SERVIÇOS DISPONIBILIZADOS</span
                    ></b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes
                    serviços:<br
                  /></span>
                </p>
                <p></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >Plantão 24 horas para atendimento telefônico e auxílio de
                      informações ao CONTRATANTE e seus dependentes;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Atendimento funerário nas localidades em que a empresa está
                      instalada - Matriz ou filial;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Traslado rodoviário para as áreas de atuação acima descritas, nos
                      limites do plano contratado e assinalado no Termo de Adesão;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Urna mortuária estilo sextavado em conformidade com o plano
                      adquirido;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Paramentação conforme o credo religioso;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Carro funerário para remoção, cortejo e sepultamento;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Decoração de flores naturais e/ou artificiais na urna, conforme a
                      disponibilidade de mercado onde serão executados os serviços;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Velas;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Véu;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Livro de presença;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Sala de velório, apenas nas localidades onde a CONTRATADA mantém
                      sala disponível.</span
                    >
                  </li>
                </ul>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >4.&nbsp;CLÁUSULA QUARTA – DOS SERVIÇOS DE ALIMENTAÇÃO</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>4.1</b>&nbsp;Lanche servido na capela: 50 (cinquenta) pães; 250g
                    (duzentos e cinquenta gramas) de manteiga; 02 (dois) litros de leite;
                    02 (dois) pacotes de bolacha de água e sal; Chá e café à
                    vontade.</span
                  >
                </p>
                <p style="">
                  <span style="font-size: 14px"
                    ><b style="">4.2</b>&nbsp;Kit lanche para residencial: 500g
                    (quinhentos gramas) de chá; 500g (quinhentos gramas) de café; 02kg
                    (dois quilos) de açúcar; 01 (um) pacote de bolacha de água e sal; 250g
                    (duzentos e cinquenta gramas) de manteiga; 100 (cem) copos de
                    café.</span
                  >
                </p>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Primeiro:</b> Eventual substituição de produto em
                      decorrência da falta de fabricação ou distribuição do mercado será
                      substituída por produto equivalente ou de igual valor.<br
                    /></span>
                  </p>
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Segundo:</b> Os itens compreendidos acima fazem
                      referência aos serviços e produtos mínimos ofertados para todos os
                      planos disponíveis da CONTRATADA.</span
                    >
                  </p>
                </blockquote>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <h4 style="text-align: center">
                <b
                  ><span style="font-size: 16px"
                    >5.&nbsp;CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO
                  </span></b
                >
              </h4>
              <div style="text-align: center">
                <h1></h1>
                <p></p>
              </div>
              <div style="text-align: center">
                <h1></h1>
                <p></p>
              </div>
              <div style="text-align: center">
                <h1></h1>
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>5.1</b> O meio de transporte a ser utlizadao para o translado do
                    corpo será o rodoviário.</span
                  >
                </p>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Único:</b>&nbsp;O uso de transporte aéreo será de
                      inteira responsabilidade do CONTRATANTE, podendo a CONTRATADA
                      proceder apenas com a intermediação de informações e apoio.</span
                    >
                  </p>
                </blockquote>
                <span style="color: inherit; font-size: 14px">
                  <p>
                    <b style="color: inherit">5.2</b
                    ><span style="color: inherit">
                      Não haverá qualquer tipo de reembolso de quaisquer despesas
                      efetuadas pelo CONTRATANTE em caso de solicitação de serviços não
                      previstos no respectivo plano optado.</span
                    ><br />
                  </p>
                </span>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <h4 style="text-align: center">
                <b
                  ><span style="font-size: 16px"
                    >6.&nbsp;CLÁUSULA SEXTA – DA ADESÃO AO PLANO E DEPENDENTES</span
                  ></b
                >
              </h4>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>6.1</b> A CONTRATADA fornecerá os serviços funerários
                    correspondentes ao CONTRATANTE e seus dependentes, conforme plano
                    escolhido no Termo de Adesão.</span
                  >
                </p>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Primeiro:</b>&nbsp;Entende como
                      beneficiários/dependentes (pais, cônjuge, filhos enquanto solteiros
                      mediante comprovação, filhos solteiros incapazes sem limite de
                      idade, ou dependentes com guarda judicial comprovada
                      documentalmente). A alteração das condições especificadas na
                      cláusula acima excluirá a condição de dependentes e/ou beneficiários
                      do respectivo contrato.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Segundo:</b>&nbsp;Para cada inclusão posterior de
                      novos dependentes será considerada individualmente a obrigação do
                      cumprimento da carência de 90 (noventa) dias, que será contada a
                      partir da data de sua inclusão.<br
                    /></span>
                  </p>
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Terceiro:</b>&nbsp;O CONTRATANTE poderá optar na Ficha
                      de Qualificação, entre seus pais ou os pais do cônjuge, não sendo
                      permitida a cobertura da prestação para ambos simultaneamente.<br
                    /></span>
                  </p>
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Quarto:</b>&nbsp;As informações dos dependentes
                      prestadas na Ficha de Qualificação e no contrato de prestação de
                      assistência funerária serão consideradas verdadeiras, sob pena de
                      responsabilidade civil e criminal do CONTRATANTE.<br
                    /></span>
                  </p>
                </blockquote>
                <span style="color: inherit; font-size: 14px">
                  <p>
                    <b style="color: inherit">6.2</b
                    ><span style="color: inherit">
                      O CONTRATANTE pagará a CONTRATADA no ato da assinatura do presente
                      contrato, o valor estipulado no Termo de Adesão.</span
                    ><br />
                  </p>
                </span>
                <p></p>
                <p>
                  <span style="color: inherit; font-size: 14px"
                    ><b>6.3</b> Todas as parcelas de preço terão seus vencimentos na data
                    apontada no Termo de Adesão, salvo nos casos em que o vencimento
                    recair em finais de semana e feriados nacionais e locais, hipótese em
                    que serão automaticamente prorrogadas para o primeiro dia útil
                    seguinte.<br
                  /></span>
                </p>
                <p>
                  <span style="color: inherit; font-size: 14px"
                    ><b>6.4</b> Caberá ao CONTRATANTE o pagamento da mensalidade total
                    fixada para cada ano-base no Termo de Adesão, conforme tabela de
                    preços descritos no Termo de Adesão vigente à época, que estará
                    sujeita a reajuste anual através da aplicação da variação positiva do
                    índice IGP-M (Índice Geral de Preços do Mercado) ou outro incide que
                    venha a substituí-lo, sendo que a data base para o reajuste se dará no
                    primeiro dia de cada ano. A aplicação do índice poderá ser revista a
                    qualquer tempo, sempre que houver necessidade de recomposição real de
                    perdas inflacionárias não refletidas no índice adotado ou quando a
                    estrutura de custos da CONTRATADA assim o exigir.<br
                  /></span>
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <h4 style="text-align: center">
                <b style="font-size: 16px"
                  >7.&nbsp;CLÁUSULA SÉTIMA – DOS PRAZOS DE PAGAMENTO</b
                >
              </h4>
              <div>
                <h1></h1>
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>7.1</b> O presente contrato entrará em vigor na data em que houver
                    o efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 60
                    (sessenta) meses, sendo automaticamente renovado em caso de não
                    manifestação contrária das Partes.</span
                  >
                </p>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Único:</b>&nbsp;Para os efeitos da Cláusula 7.1 acima,
                      “efetivo pagamento” será considerado o momento do recebimento do
                      valor pactuado à vista em moeda corrente;</span
                    >
                  </p>
                </blockquote>
                <span style="color: inherit; font-size: 14px">
                  <p>
                    <b style="color: inherit">7.2</b
                    ><span style="color: inherit">
                      Fica pactuado que o CONTRATANTE e os dependentes terão direito a
                      usufruir dos benefícios contratados relativos ao plano escolhido
                      após a carência de 90 (noventa) dias, contados da data do pagamento
                      integral da taxa de adesão ou da primeira parcela.</span
                    ><br />
                  </p>
                </span>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p></p>
                  <div class="edit">
                    <p>
                      <span style="font-size: 12px"
                        ><b>Parágrafo Primeiro:</b>&nbsp;O CONTRATANTE será constituído em
                        mora a partir do primeiro dia do vencimento da primeira
                        mensalidade referente ao plano aderido, independente de
                        notificação, ficando os serviços terminantemente suspensos;</span
                      >
                    </p>
                  </div>
                  <p></p>
                  <p></p>
                  <div class="edit">
                    <p>
                      <span style="font-size: 12px"
                        ><b>Parágrafo Segundo:</b>&nbsp;O contrato será automaticamente
                        rescindido após três meses de atraso.</span
                      >
                    </p>
                  </div>
                  <p></p>
                </blockquote>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="font-size: 16px; text-align: center">
                  <b>8.&nbsp;CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>8.1</b>&nbsp;O não pagamento das quantias devidas dentro do prazo
                    convencionado na aquisição do Termo de Adesão implicará na incidência
                    de multa de 2,0% (dois por cento) do valor devido e não pago,
                    acrescida de juros de mora de 1,0%, (um por cento) ao mês e correção
                    monetária pela aplicação da variação positiva do IGP-M (Índice Geral
                    de Preços do Mercado) ou outro que venha a substitui-lo. A aplicação
                    da multa, juros e atualização monetária é automática, inexistindo, de
                    pleno direito, a necessidade de comunicação prévia de qualquer das
                    Partes a outra.</span
                  ><br />
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >9.&nbsp;CLÁUSULA NONA – DAS OBRIGAÇÕES DAS PARTES</b
                  >
                </h4>
              </div>
              <div>
                <p><b>DA CONTRATADA:</b></p>
                <p>
                  <span style="font-size: 14px"
                    ><b>9.1</b>&nbsp;Executar os serviços contratados de forma objetiva ao
                    CONTRATANTE;</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>9.2</b>&nbsp;Facilitar acesso às informações necessárias dos
                    serviços oferecidos aos beneficiários;</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>9.3</b> Cumprir o plano contratado com estrita observância das
                    condições e cláusulas descritas neste contrato e anexos.</span
                  >
                </p>
                <p><b>DO(A) CONTRATANTE</b></p>
                <p>
                  <span style="font-size: 14px"
                    ><b>9.4</b>&nbsp;Manter em dia o pagamento das mensalidades, bem como,
                    seus dados cadastrais devidamente atualizados.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>9.5</b>&nbsp;Comunicar, imediatamente, o falecimento de qualquer
                    dos beneficiários do plano, para que se possa usufruir dos serviços
                    contratados;</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >10. CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E SEUS EFEITOS</b
                  >
                </h4>
              </div>
              <div>
                <p></p>
                <div class="edit">
                  <p>
                    <span style="font-size: 14px"
                      ><b>10.1</b>&nbsp;No caso de inadimplência de três mensalidades, o
                      contrato será rescindido sem que haja a incidência de qualquer
                      multa, desde que o CONTRATANTE e seus dependentes não tenham
                      utilizado os serviços fúnebres.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>10.2</b>&nbsp;Após a prestação dos serviços fúnebres e caso o
                      contrato vigente tenha mais de 60 (sessenta) meses de duração,
                      poderão os herdeiros requisitar o cancelamento do contrato sem
                      qualquer ônus, no entanto, se o contrato for cancelado antes do
                      período citado e havendo a prestação de serviços fúnebres, caberá
                      aos herdeiros o pagamento do residual gasto com o serviço prestado,
                      independente da desvinculação pelo cancelamento contratual.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>10.3</b>&nbsp;Ensejando no cancelamento do contrato e com a
                      devida prestação dos serviços, a CONTRATADA estará responsável pela
                      apuração do saldo devedor para a devida quitação dos serviços
                      prestados, apresentando de forma objetiva e clara os custos dos
                      serviços para sua devida quitação.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>10.4</b>&nbsp;O saldo remanescente deverá ser quitado na forma à
                      vista, ou por meio de confissão de dívida para emissão de boleto
                      bancário.</span
                    >
                  </p>
                  <p>
                    <span
                      ><span style="font-size: 14px"
                        ><b>10.5</b>&nbsp;Emitido o boleto, e não havendo o pagamento no
                        vencimento, o devedor será inserido no SCPC e Serasa, bem como,
                        serão tomadas as medidas judiciais cabíveis para a devida quitação
                        da dívida.</span
                      ><br
                    /></span>
                  </p>
                </div>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h1 style="font-size: 16px; text-align: center">
                  <b>11. CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE TITULARIDADE</b>
                </h1>
              </div>
              <div>
                <p></p>
                <div class="edit">
                  <p>
                    <span style="font-size: 14px"
                      ><b>11.1</b>&nbsp;Em caso de falecimento do CONTRATANTE, poderão os
                      dependentes ou responsável legal, assumir o contrato principal,
                      passando assim a ser responsável dos direitos e obrigações assumidos
                      neste contrato, sendo respeitado a obrigação do cumprimento da
                      carência de 90 (noventa) dias para qualquer novo titular o
                      dependente, conforme especificado na Cláusula 6.1.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>11.2</b>&nbsp;Para a transferência da titularidade, é
                      imprescindível que o contrato esteja livre de qualquer débito e haja
                      a anuência do antigo e do novo titular.</span
                    >
                  </p>
                </div>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h1 style="font-size: 16px; text-align: center">
                  <b>12. CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
                </h1>
              </div>
              <div>
                <p></p>
                <div class="edit">
                  <p>
                    <span style="font-size: 14px"
                      ><b style="">12.1</b>&nbsp;Qualquer documento, anexo ou outros
                      instrumentos decorrentes de alterações contratuais, substituições,
                      consolidações e respectivas complementações faz parte integrante do
                      presente contrato, salvo se expressamente disposto de forma
                      diversa.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>12.2</b>&nbsp;Caso uma mesma pessoa seja designada beneficiária
                      em mais de um contrato, será válido apenas um dos contratos.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>12.3</b>&nbsp;Todas as referências a quaisquer Partes deste
                      contrato incluem seus sucessores, beneficiários,
                      representantes.</span
                    >
                  </p>
                  <p>
                    <b style="font-size: 14px; color: inherit">12.4</b
                    ><span style="font-size: 14px; color: inherit"
                      >&nbsp;Faz parte integrante e indissociável deste contrato, como se
                      nele estivessem transcritos, a Ficha de Qualificação, o Termo de
                      Adesão e demais anexos, cujo conteúdo o CONTRATANTE declara haver
                      tomado amplo conhecimento, tendo aceitado todos os seus termos, sem
                      qualquer restrição ou objeção.</span
                    >
                  </p>
                  <p>
                    <b style="font-size: 14px; color: inherit">12.5</b
                    ><span style="font-size: 14px; color: inherit"
                      >&nbsp;As Partes reconhecem como válidas eficazes e suficientes às
                      comunicações, notificações e cobranças enviadas para o endereço
                      indicado na Ficha de Qualificação, cabendo a este informar a
                      CONTRATADA sobre qualquer alteração de endereço ou de seus dados
                      cadastrais, sempre por escrito e no prazo máximo de 30 (trinta) dias
                      contados do evento.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px; color: inherit"
                      ><b>12.6&nbsp;</b>A mensalidade tem como principal objetivo a
                      manutenção e disponibilização de toda a infraestrutura necessária ao
                      atendimento desse serviço e, desta forma, a não ocorrência de
                      falecimento dos beneficiários não implica em qualquer forma de
                      reembolso de pagamentos pela CONTRATADA ao CONTRATANTE, posto que os
                      demais serviços estavam sendo oferecidos.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px; color: inherit"
                      ><b>12.7</b>&nbsp;O não exercício, da CONTRATADA, de quaisquer dos
                      direitos ou prerrogativas previstas neste contrato ou seus anexos,
                      ou mesmo na legislação aplicável, será tido como ato de mera
                      liberalidade, não constituindo alteração ou novação das obrigações
                      ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
                      tempo, independentemente de comunicação prévia à outra parte.</span
                    >
                  </p>
                </div>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h1 style="font-size: 16px; text-align: center">
                  <b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b>
                </h1>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p><b>DADOS DO TITULAR</b></p>
                <p>
                  Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style=""
                    >${contratoCliente.nomeTitular}</span
                  >&nbsp;
                </p>
                <p>
                  R.G.:&nbsp;<span class="RG_TITULAR token_d4s"
                    >${contratoCliente.rgTitular}</span
                  >&nbsp;
                </p>
                <p>
                  CPF:&nbsp;<span class="CPF_TITULAR token_d4s"
                    >${contratoCliente.cpfTitular}</span
                  >&nbsp;
                </p>
                <p>
                  Sexo:
                  <span class="SEXO_TITULAR token_d4s"
                    >${contratoCliente.sexoTitular}</span
                  >&nbsp;
                </p>
                <p>
                  Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"
                    ><span class="DA_Nasc_Titular token_d4s"
                      ><span class="DATA_NASC_TITULAR token_d4s"
                        >${contratoCliente.dataNascTitular}</span
                      >&nbsp;</span
                    ></span
                  >
                </p>
                <p>
                  Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"
                    ><span class="ESTADO_CIVIL_TITULAR token_d4s"
                      >${contratoCliente.estadoCivilTitular}</span
                    >&nbsp;</span
                  >
                </p>
                <p>
                  <span style="color: inherit"
                    >Profissão:
                    <span class="PROFISSAO_TITULAR token_d4s"
                      >${contratoCliente.profissaoTitular}</span
                    >&nbsp;</span
                  >
                </p>
                <p>
                  <span style="color: inherit"
                    >Religião:&nbsp;<span class="Religiao_Titular token_d4s"
                      ><span class="RELIGIAO_TITULAR token_d4s"
                        >${contratoCliente.religiaoTitular}</span
                      >&nbsp;</span
                    ></span
                  ><br />
                </p>
                <p>Naturalidade:${contratoCliente.naturalidadeTitular}<br />
                </p>
                <p>
                  Nacionalidade:
                  <span class="NACIONALIDADE_TITULAR token_d4s"
                    >${contratoCliente.nacionalidadeTitular}</span
                  >&nbsp;
                </p>
                <p>
                  Telefone 01:
                  <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span
                  >&nbsp;
                </p>
                <p>
                  Telefone 02:
                  <span class="TELEFONE_02 token_d4s"
                    >${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span
                  >&nbsp;
                </p>
                <p>
                  E-mail 01:
                  <span class="EMAIL01 token_d4s"
                    ><span class="EMAIL_01 token_d4s">${contratoCliente.email1}</span
                    >&nbsp;</span
                  >&nbsp;
                </p>
                <p>
                  E-mail 02:
                  <span class="EMAIL_02 token_d4s" style=""
                    >${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span
                  >&nbsp;
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p></p>
                <div class="edit">
                  <p><b>DADOS RESIDENCIAIS</b></p>
                  <p>
                    <span style="color: inherit">Endereço Residencial:&nbsp;</span
                    ><span style="color: inherit"
                      ><span class="ENDERECO_RES token_d4s"
                        ><span class="ENDERECO_RESIDENCIAL token_d4s"
                          >${contratoCliente.tipoLogradouroResidencial}
                          ${contratoCliente.nomeLogradouroResidencial}</span
                        ></span
                      ></span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >Número:
                      <span class="NUMERO_END_RESIDENCIAL token_d4s"
                        >${contratoCliente.numeroResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >Complemento:
                      <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                        >${contratoCliente.complementoResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >Bairro:
                      <span class="BAIRRO_RESIDENCIAL token_d4s"
                        >${contratoCliente.bairroResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >CEP:
                      <span class="CEP_RESIDENCIAL token_d4s"
                        >${contratoCliente.cepResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >Cidade:
                      <span class="CIDADE_RESIDENCIAL token_d4s"
                        >${contratoCliente.cidadeResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                  <p>
                    <span style="color: inherit"
                      >U.F:
                      <span class="ESTADO_RESIDENCIAL token_d4s"
                        >${contratoCliente.estadoResidencial}</span
                      >&nbsp;</span
                    >
                  </p>
                </div>
                <p></p>
                <div class="edit">
                  <p><b>DADOS COMERCIAIS</b></p>
                  <p>Endereço Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.tipoLogradouroResidencial : contratoCliente.tipoLogradouroCobranca} 
                                  ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.nomeLogradouroResidencial : contratoCliente.nomeLogradouroCobranca}
                  </p>
                  <p><span style="color: inherit;">Número: <span
                              class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.numeroResidencial : contratoCliente.numeroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Complemento: <span
                              class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.complementoResidencial : contratoCliente.complementoCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">Bairro: <span
                              class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.bairroResidencial : contratoCliente.bairroCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">CEP: <span
                              class="CEP_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cepResidencial : contratoCliente.cepCobranca}</span>&nbsp;</span></p>
                  <p><span style="color: inherit;">Cidade: <span
                              class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.cidadeResidencial : contratoCliente.cidadeCobranca}</span>&nbsp;</span>
                  </p>
                  <p><span style="color: inherit;">U.F: <span
                              class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.enderecoCobrancaIgualResidencial == 1 ? contratoCliente.estadoResidencial : contratoCliente.estadoCobranca}</span>&nbsp;</span>
                  </p>
              </div>
              <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p></p>
                <div class="edit">
                  <p><b>DEPENDENTES</b></p>
                  ${htmlDependentesHumano}
                </div>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h1 style="font-size: 16px; text-align: center">
                  <b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b>
                </h1>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <b><span style="font-size: 14px">PLANO 01 - BÁSICO</span></b>
                </p>
                <p style="text-align: justify"></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                      silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                      tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                      eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                      dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                      travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      ><span style="color: inherit"
                        >Paramentação conforme o credo religioso;</span
                      ><br
                    /></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Velas;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Carro funerário para remoção e sepultamento;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Véu;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Sala de velório, se necessário nas localidades onde o grupo
                        mantém sala;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Decoração de flores naturais e/ou artificiais na urna, conforme a
                        disponibilidade de mercado onde será executado os serviços;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Transporte de até 100Km.</span></span
                    >
                  </li>
                </ul>
                <p></p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <b><span style="font-size: 14px">PLANO 02 - SUPER-LUXO</span></b>
                </p>
                <p style="text-align: justify"></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente, laterais
                      do fundo e tampa entalhada em baixo relevo, 2 sobretampos entalhados
                      em alto relevo, guarnição (friso) na tampa, madeira pinnus tingida
                      na cor mogno, verniz alto brilho, fundo Eucatex, 6 fixadores tipo
                      concha com varões, laterais dourados, 9 chavetas fundidas e pintadas
                      na cor dourada, forrada em tecido branco com renda larga, sobre
                      babado (rendão) branco com 20 cm de largura, taxas douradas, visor
                      médio de vidro rodeado por renda larga, travesseiro solto. (Marca:
                      De acordo com fornecedor vigente)<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      ><span style="color: inherit"
                        >Paramentação conforme o credo religioso;</span
                      ><br
                    /></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Velas;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Carro funerário para remoção e sepultamento;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Véu;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Sala de velório, se necessário nas localidades onde o grupo
                        mantém sala;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Decoração de flores naturais e/ou artificiais na urna, conforme a
                        disponibilidade de mercado onde será executado os serviços;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                        conforme a disponibilidade de mercado onde será executado os
                        serviços;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Abertura de jazigo (não se confundindo com o fornecimento de
                        túmulo / gaveta);<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Tanatopraxia (preparação do corpo);<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >01 (uma) veste, disponível na ocasião;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Transporte de até 250Km.</span></span
                    >
                  </li>
                </ul>
                <p></p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <b><span style="font-size: 14px">PLANO 03 - LUXO</span></b>
                </p>
                <p style="text-align: justify"></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                      silk-screen prateado, guarnição (friso) na tampa, madeira pinnus,
                      tingida na cor nogueira, verniz alto brilho, fundo e tampa de
                      eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas, ambas na cor
                      dourada, forro e babado rendão tecido 50g branco, taxas douradas,
                      travesseiro solto. (Marca: De acordo com fornecedor vigente)<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      ><span style="color: inherit"
                        >Paramentação conforme o credo religioso;</span
                      ><br
                    /></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Velas;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Carro funerário para remoção e sepultamento;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Véu;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Sala de velório, se necessário nas localidades onde o grupo
                        mantém sala;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Decoração de flores naturais e/ou artificiais na urna, conforme a
                        disponibilidade de mercado onde será executado os serviços;<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px"
                        >Tanatopraxia (preparação do corpo);<br /></span
                    ></span>
                  </li>
                  <li>
                    <span style="color: inherit"
                      ><span style="font-size: 14px">Transporte de até 150Km.</span></span
                    >
                  </li>
                </ul>
                <p></p>
                <p></p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h1 style="font-size: 16px; text-align: center">
                  <b style="font-size: 16px">ANEXO 03 - TERMO DE ADESÃO</b>
                </h1>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p><b>DADOS DO CONTRATO</b></p>
                <p></p>
                <ul>
                  <li>
                    Plano Selecionado:&nbsp;<span class="PLANO_SELECIONADO token_d4s"
                      >${planoTratado.descricao}</span
                    >&nbsp;
                  </li>
                  <li>
                    <span style="color: inherit">Formato da&nbsp;Venda: </span
                    ><span
                      class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
                      style="color: inherit"
                      >${contratoCliente.tipo}</span
                    ><span style="color: inherit">&nbsp;</span>
                  </li>
                  <ul>
                    <li>
                      <span style="font-size: 12px"
                        ><b>Em caso de transferência:</b></span
                      >
                    </li>
                    <ul>
                      <li>
                        <span style="font-size: 12px"
                          >Empresa Anterior:
                          <span class="EMPRESA_ANTERIOR token_d4s"
                            >${contratoCliente.empresaAntiga == 'null' ? " " :
              contratoCliente.empresaAntiga}</span
                          >&nbsp;</span
                        >
                      </li>
                      <li>
                        <span style="font-size: 12px"
                          >Data de Assinatura do Contrato Anterior:
                          <span class="DATA_CONTRATO_ANTERIOR token_d4s"
                            >${contratoCliente.dataContratoAntigo == 'null' ? " " :
              contratoCliente.dataContratoAntigo}</span
                          >&nbsp;</span
                        >
                      </li>
                    </ul>
                  </ul>
                </ul>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                    <p></p>
                  </blockquote>
                </blockquote>
              </div>
              <div>
                <p><b style="font-size: 14px">TAXA DE ADESÃO</b></p>
                <p></p>
                <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
                  <li>Adicional de Cremação PET: R$ ${result.id >= 2 ? 0 : adesaoPet}</li>
                  <li>Adicional de Cremação Humana: R$ ${result.id >= 2 ? 0 : adesaoHumano}</li>
                  <li style="font-size: 14px">
                 <b style="font-size: 16px">Total da Taxa de Adesão:R$ ${result.id >= 2 ? planoTratado.valorAdesao : valorTotalAdesao}
                 </b>
                </li>
                </ul >
      <p></p>
              </div >
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p><b style="font-size: 14px">MENSALIDADE</b></p>
                <p></p>
                <ul>
                  <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}</li>
                  <li>Adicional de Cremação PET:R$ ${mensalidadePet}</li>
                  <li>Adicional de Cremação Humana:R$ ${mensalidadeHumano}</li>
                  <li>
                    <b>Total da Mensalidade:R$ ${valorTotalMensalidade}</b>
                  </li>
                </ul>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"><b>DADOS DE PAGAMENTO</b></span>
                </p>
                <p></p>
                <ul>
                  <li>
                    Data de Vencimento da Primeira
                    Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
                  </li>
                  <li>
                    Forma de Pagamento:
                    <span class="FORMA_PAGAMENTO token_d4s"
                      >${contratoCliente.localCobranca}</span
                    >&nbsp;
                  </li>
                  <ul>
                    <li>Em caso de cobrador, qual o endereço de cobrança?</li>
                    <ul>
                      <li>
                        Endereço de Cobrança:
                        <span class="ENDERECO_COBRANCA token_d4s"
                          >${contratoCliente.tipoLogradouroResidencial}
                          ${contratoCliente.nomeLogradouroResidencial},
                          ${contratoCliente.numeroResidencial}, QUADRA:
                          ${contratoCliente.quadraResidencial == 'null' ? "" : contratoCliente.quadraResidencial}, LOTE:
                          ${contratoCliente.loteResidencial == 'null' ? "" : contratoCliente.loteResidencial}, Complemento:
                          ${contratoCliente.complementoResidencial}, Bairro:
                          ${contratoCliente.bairroResidencial},
                          ${contratoCliente.cepResidencial}</span
                        >&nbsp;
                      </li>
                      <li>
                        Melhor Horário:
                        <span class="HORARIO_COBRANCA token_d4s"
                          >${contratoCliente.melhorHorario}</span
                        >&nbsp;
                      </li>
                    </ul>
                  </ul>
                </ul>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >Caso a cobrança não seja efetuada até a data do vencimento, o
                      CONTRATANTE se responsabiliza a efetuar o pagamento no escritório da
                      CONTRATADA.</span
                    >
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >A CONTRATADA se reserva ao direito de alterar as formas de
                      pagamento disponibilizadas para o CONTRATANTE.</span
                    ><br />
                  </li>
                </ul>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >ANEXO 04 - SERVIÇO ADICIONAL DE CREMAÇÃO HUMANA</b
                  >
                </h4>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px">1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA </b>
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>1.1</b>&nbsp;Em caso de adesão, por parte do CONTRATANTE, ao
                    serviço adicional de cremação humana, o aludido serviço será regulado
                    pelo presente instrumento, que é parte integrante do contrato de
                    prestação de serviços de assistência funerária.</span
                  >
                </p>
                <p></p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="font-size: 12px"
                      ><b>Parágrafo Único: </b>No caso de adesão ao serviço adicional de
                      cremação humana posterior ao contrato de prestação de serviços de
                      assistência funerária, o prazo contratual é contado em conformidade
                      com a Cláusula 3° do presente instrumento.&nbsp;</span
                    ><br />
                  </p>
                </blockquote>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px">2. CLÁUSULA SEGUNDA - DO OBJETO</b>
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b style="">2.1</b>&nbsp;Constitui objeto do presente instrumento a
                    prestação dos serviços especializados de cremação em favor do
                    CONTRATANTE ou de qualquer dos beneficiários indicados no termo de
                    adesão, a serem executados sob a responsabilidade da CONTRATADA e o
                    fornecimento de 01 (uma) urna cinerária padrão, modelo Basic, 23 cm,
                    4.600 cm³, chapa galvanizada, ou outro que venha a substitui-lo, para
                    armazenamento das cinzas.</span
                  >
                </p>
                <p>
                  <span style=""
                    ><span style="font-size: 14px"
                      ><b style="">2.2</b> A cremação é um processo moderno, prático e
                      ecológico, feito através de fornos crematórios, utilizados
                      exclusivamente para esta finalidade. Ao final do processo restam
                      apenas as cinzas que são entregues a família ou representante legal
                      em uma urna cinerária.</span
                    ><br
                  /></span>
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >3. CLÁUSULA TERCEIRA - DO PRAZO E CARÊNCIA</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na data
                    em que houver o efetivo pagamento da taxa de adesão e permanecerá pelo
                    prazo de 60 (sessenta) meses, sendo automaticamente renovado em caso
                    de não manifestação contrária das Partes.</span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>3.2</b> Fica pactuado que as pessoas adicionadas terão direito a
                      usufruir do serviço de cremação contratado após a carência de 90
                      (noventa) dias, contados da data do pagamento integral da taxa de
                      adesão do serviço adicional ou da primeira parcela.</span
                    ><br
                  /></span>
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>3.3</b> Se o contrato for cancelado antes do período descrito na
                      Cláusula 3 – Do Prazo e Carência e havendo a prestação do serviço de
                      cremação, caberá ao CONTRATANTE e aos seus herdeiros o pagamento do
                      residual gasto com o serviço prestado, independente da desvinculação
                      pelo cancelamento contratual.</span
                    ></span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>3.4</b> A mensalidade estará sujeita a reajuste anual calculado
                      através da aplicação da variação positiva do IGP-M (Índice Geral de
                      Preços do Mercado) ou outro que venha a substituí-lo. A aplicação do
                      índice poderá ser revista a qualquer tempo, sempre que houver
                      necessidade de recomposição real de perdas inflacionárias não
                      refletidas no índice adotado ou quando a estrutura de custos da
                      CONTRATADA assim o exigir. A aplicação da multa, juros e atualização
                      monetária é automática, inexistindo, de pleno direito, a necessidade
                      de comunicação prévia de qualquer das Partes a outra.</span
                    ></span
                  >
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b style="">4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                    seguintes serviços:</span
                  >
                </p>
                <p></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >Serviços de atendimento telefônico e auxílio de informações;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Carro Funerário para remoção e cortejo do funeral até o crematório,
                      limitado ao munícipio de Dourados;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Cremação unitária;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Armazenamento em câmara de refrigeração por prazo determinado de 24
                      horas.</span
                    >
                  </li>
                </ul>
                <span style="font-size: 14px"
                  >Remoção do corpo do local do velório até o local da cremação não terá
                  custo adicional, desde que o percurso esteja dentro da área urbana do
                  município de Dourados.<br
                /></span>
                <p></p>
                <p>
                  <span style="font-size: 14px"
                    >Em caso de armazenamento em câmara de refrigeração além do prazo de
                    24 horas será cobrado valor adicional.</span
                  ><br />
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
                    CREMAÇÃO</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>5.1</b>&nbsp;Para que o corpo da pessoa falecida por morte natural
                    seja cremado é necessário à apresentação de atestado de óbito assinado
                    por dois médicos ou por um médico legista contendo o número do CRM e o
                    endereço profissional, em via original ou cópia autenticada e a
                    autorização de cremação assinada antecedentemente pela pessoa falecida
                    ou pelo representante legal na forma pública ou particular.</span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>5.2</b> A cremação para o caso de morte violenta derivado de
                      crimes ou sob investigação da autoridade será necessário o atestado
                      de óbito assinado por um médico legista contendo o número do
                      registro CRM, endereço profissional em via original ou cópia
                      autenticada e alvará judicial por meio do qual o juiz não se opõe a
                      cremação do corpo.</span
                    ><br
                  /></span>
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>5.3</b> A cremação de estrangeiros não residentes no país em
                      caso de morte natural é necessária autorização judicial competente,
                      mediante solicitação formulada pelo consulado do país, do qual
                      conste o nome e o cargo de quem a formulou, autorização de cremação,
                      autorização judicial de cremação requerida pelo consulado, xerox dos
                      documentos de identidade e passaporte do falecido.</span
                    ></span
                  >
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A
                    CREMAÇÃO</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as suas expensas,
                    a retirada de todo e qualquer tipo de aparelho ou equipamento que
                    tenha sido implantado no corpo a ser incinerado, tais como, marca
                    passo ou qualquer outro aparelho ou equipamento que se utilize de
                    pilhas ou baterias.</span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>6.2</b> Excepcionalmente, caso seja notada a existência de
                      aparelhos ou equipamentos implantados no corpo a ser cremado, a
                      CONTRATADA poderá a qualquer tempo, recusar-se a prestar o serviço
                      ou, caso não seja detectada a existência dos referidos aparelhos e a
                      cremação acabe sendo realizada, fica o CONTRATANTE, obrigado a
                      reparar integralmente todo e qualquer dano que venha a ser causado
                      em decorrência de tal ato.</span
                    ><br
                  /></span>
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>6.3</b> A cremação será realizada após o prazo de 24 horas do
                      óbito, podendo ser realizada a qualquer tempo, sendo que este
                      período até a cremação, o corpo permanecerá preservado em ambiente
                      refrigerado tecnicamente apropriado.</span
                    ></span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"
                      ><b>6.4</b> O CONTRATANTE ou seu responsável legal deverá entrar em
                      contato com a CONTRATADA para fazer o agendamento da cremação logo
                      após o óbito, devendo ser respeitado à agenda de disponibilidade
                      oferecida pela CONTRATADA.<br /></span
                  ></span>
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>7.1</b>&nbsp;O prazo para entrega das cinzas são de até 15
                    (quinze) dias úteis, contados a partir da cremação, disponibilizadas
                    na secretaria do crematório para serem retiradas, mediante a
                    assinatura de termo de recebimento das cinzas e apresentação de
                    documento de identificação.</span
                  >
                </p>
                <p>
                  <span
                    ><span style="font-size: 14px"><b>7.2&nbsp;</b></span></span
                  ><span style="font-size: 14px; color: inherit"
                    >Caso a urna com os restos das cinzas não seja retirada no local
                    dentro do prazo descrito acima, a CONTRATADA deixará disponível junto
                    ao columbário pelo prazo de 60 (sessenta) dias ininterruptos, sendo
                    que após essa data será destinado junto à empresa competente.</span
                  >
                </p>
                <p></p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >ANEXO 05 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO HUMANA</b
                  >
                </h4>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <b>PESSOAS ADICIONADAS NO SERVIÇO DE CREMAÇÃO HUMANA</b>
                </p>
                ${htmlTitularCremado}
                ${htmlCremacao}
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf},  ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >ANEXO 06 - SERVIÇO ADICIONAL DE CREMAÇÃO DE ANIMAIS</b
                  >
                </h4>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px">1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA</b>
                </h4>
              </div>
              <div>
                <p style="font-size: 14px">
                  <b>1.1</b>&nbsp;<span style="color: inherit"
                    >Em caso de adesão por parte do CONTRATANTE ao serviço adicional de
                    cremação de animais, o aludido serviço será regulado pelo presente
                    instrumento, que é parte integrante do contrato de prestação de
                    serviços de assistência funerária.</span
                  >
                </p>
                <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
                  <p>
                    <span style="color: inherit"
                      ><span style="font-size: 12px"
                        ><b>Parágrafo Único:</b> No caso de adesão ao serviço adicional de
                        cremação de animal posterior ao contrato de prestação de serviços
                        de assistência funerária, o prazo contratual é contado em
                        conformidade com a Cláusula 3° do presente
                        instrumento.&nbsp;</span
                      ><br
                    /></span>
                  </p>
                </blockquote>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px">2. CLÁUSULA SEGUNDA - DO OBJETO</b>
                </h4>
              </div>
              <div>
                <p style="font-size: 14px">
                  <b>2.1</b>&nbsp;<span style="color: inherit"
                    >Constitui objeto do presente instrumento a prestação dos serviços
                    especializados de cremação de animais domésticos em favor do
                    CONTRATANTE sob a responsabilidade da CONTRATADA na forma com resgate
                    de cinzas ou sem resgate de cinzas.</span
                  >
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>2.2</b> A cremação é um processo moderno, prático e ecológico,
                    feito através de fornos crematórios, utilizados exclusivamente para
                    esta finalidade. Ao final do processo restam apenas as cinzas que são
                    entregues ao responsável em uma urna cinerária feita especialmente
                    para os restos do animal.<br
                  /></span>
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >3. CLÁUSULA TERCEIRA - DO PRAZO DE PAGAMENTO</b
                  >
                </h4>
              </div>
              <div>
                <p style="font-size: 14px">
                  <b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na data em
                  que houver o efetivo pagamento da taxa de adesão e permanecerá pelo
                  prazo de 60 (sessenta) meses, sendo automaticamente renovado em caso de
                  não manifestação contrária das Partes.
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>3.2</b> Fica pactuado que os animais adicionados terão direito a
                    usufruir do serviço de cremação contratado após a carência de 90
                    (noventa) dias, contados da data do pagamento integral da taxa de
                    adesão ou da primeira parcela.<br
                  /></span>
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>3.3</b> Se o contrato for cancelado antes do período descrito na
                    Cláusula 3 – Do Prazo e Carência e havendo a prestação do serviço de
                    cremação, caberá ao CONTRATANTE e aos seus herdeiros o pagamento do
                    residual gasto com o serviço prestado, independente da desvinculação
                    pelo cancelamento contratual.<br
                  /></span>
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>3.4</b> A mensalidade estará sujeita a reajuste anual calculado
                    através da aplicação da variação positiva do IGP-M (Índice Geral de
                    Preços do Mercado) ou outro que venha a substituí-lo. A aplicação do
                    índice poderá ser revista a qualquer tempo, sempre que houver
                    necessidade de recomposição real de perdas inflacionárias não
                    refletidas no índice adotado ou quando a estrutura de custos da
                    CONTRATADA assim o exigir.<br
                  /></span>
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS</b
                  >
                </h4>
              </div>
              <div>
                <p style="">
                  <span style="font-size: 14px"
                    ><b style="">4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                    seguintes serviços:</span
                  >
                </p>
                <p style=""></p>
                <ul style="">
                  <li>
                    <span style="font-size: 14px"
                      >Serviços de atendimento telefônico e auxílio de informações;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Veículo para remoção domiciliar ou em clínica / hospital
                      veterinário que estejam dentro do perímetro urbano de
                      Dourados-MS;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Cremação do animal nas formas: (i) com regaste de cinzas; e (ii)
                      sem resgate de cinzas;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Urna cinerária, apenas nos casos de cremação com resgate de
                      cinzas;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Certificado de cremação;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Armazenamento em câmara de refrigeração por prazo determinado de 24
                      horas.<br
                    /></span>
                  </li>
                </ul>
                <span style="font-size: 14px"
                  >Remoção do animal até o local da cremação não terá custo adicional,
                  desde que o percurso esteja dentro da área urbana do município de
                  Dourados.<br
                /></span>
                <p></p>
                <p style="">
                  <span style="font-size: 14px"
                    >Em caso de armazenamento em câmara de refrigeração além do prazo de
                    24 horas será cobrado valor adicional.</span
                  ><br />
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
                    CREMAÇÃO</b
                  >
                </h4>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b style="">5.1</b>&nbsp;O CONTRATANTE deverá apresentar os
                    documentos pessoais juntamente com a cópia do contrato diretamente no
                    setor administrativo, bem como, firmar declaração de que o animal
                    objeto da prestação de serviço é de sua propriedade e que requer a
                    prestação de serviço pactuado no animal indicado.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A
                    CREMAÇÃO</b
                  >
                </h4>
              </div>
              <div>
                <p style="font-size: 14px">
                  <b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as suas expensas, a
                  retirada de todo e qualquer tipo de aparelho ou equipamento que utilize
                  de pilhas ou baterias, que tenha sido implantado no animal a ser
                  cremado.
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>6.2</b> Excepcionalmente, caso seja notada a existência de
                    aparelhos ou equipamentos implantados no corpo do animal a ser
                    cremado, a CONTRATADA poderá a qualquer tempo, recusar-se a prestar o
                    serviço ou, caso não seja detectada a existência dos referidos
                    aparelhos e a cremação acabe sendo realizada, fica o CONTRATANTE
                    obrigado a reparar integralmente todo e qualquer dano que venha a ser
                    causado em decorrência de tal ato.<br
                  /></span>
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>6.3</b> O CONTRATANTE deverá entrar em contato com a CONTRATADA
                    para fazer o agendamento da cremação logo após o óbito, devendo ser
                    respeitado à agenda de disponibilidade oferecida pela
                    CONTRATADA.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS NO CASO DE
                    CREMAÇÃO COM RESGATE DE CINZAS</b
                  >
                </h4>
              </div>
              <div>
                <p style="font-size: 14px">
                  <b>7.1</b>&nbsp;O prazo para retirada das cinzas são de até 15 (quinze)
                  dias úteis, contados a partir da cremação, disponibilizadas na
                  secretária do crematório para serem retiradas, mediante a assinatura de
                  termo de recebimento das cinzas e apresentação de documento de
                  identificação.
                </p>
                <p style="font-size: 14px">
                  <span style="color: inherit"
                    ><b>7.2</b> Caso a urna cinerária com os restos das cinzas não seja
                    retirada no local dentro do prazo descrito acima, a CONTRATADA
                    procederá para realizar a destinação junto à empresa competente.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
              <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
              <div>
                <h4 style="text-align: center">
                  <b style="font-size: 16px"
                    >ANEXO 07 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO DE
                    ANIMAIS</b
                  >
                </h4>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>ANIMAIS ADICIONADOS NO SERVIÇO DE CREMAÇÃO PET</b></span
                  >
                </p>
                ${htmlDependentesPet}
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                    CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                    dever de observar e fazer cumprir as cláusulas aqui
                    estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong> Confirmo,
                    <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                    MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                    CONTRATO.</span
                  >
                </p>
              </div>
              <div>
                <p></p>
                <hr />
                <p></p>
              </div>
              <div>
                <p style="text-align: center; font-size: 14px">
                  ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                </p>
              </div>
            </body >
          </html >
      `
        }
      } else if (estado == 'GO') {
        if (templateID == 1) {
          html = `
          <!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contrato Funerário</title>
  </head>
  <body>
    <div>
      <p style="text-align: center">
        <b
          ><span style="font-size: 16px"
            >CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTÊNCIA FUNERÁRIA</span
          ></b
        ><br />
      </p>
      <p></p>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          >Pelo presente instrumento particular de contrato de prestação de
          serviços de assistência funerária, de um lado, simplesmente denominada
          CONTRATADA, a empresa ${unidadeTratado.razaoSocial}, pessoa jurídica
          de direito privado, inscrita no CNPJ sob o nº
          ${cnpjMask(unidade._array[0].cnpj)}, com sede à rua
          ${unidadeTratado.rua}, nº ${unidadeTratado.numero}, Bairro
          ${unidadeTratado.bairro}, CEP 79.826-110,
          ${unidadeTratado.municipio}/${unidadeTratado.uf}, por seu
          representante legal ao final assinado e do outro lado, o(a)
          consumidor(a), identificado e qualificado na Ficha de Qualificação,
          parte integrante e indissociável deste contrato, simplesmente
          denominado CONTRATANTE.</span
        ><br />
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b style="font-size: 16px">CLÁUSULA PRIMERA – DO OBJETO</b>
      </h4>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>1.1</b>&nbsp;Pelo presente instrumento contratual, a CONTRATADA,
          através de recursos próprios ou de empresas designadas por ela,
          disponibilizará ao CONTRATANTE e seus beneficiários o Plano de
          Assistência Familiar – Pax Primavera, objetivando prestação de
          serviços de assistência funerária, de acordo com a Lei 13.261/2016,
          com os parâmetros do plano optado e as condições especificadas
          abaixo:</span
        >
      </p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>1.2</b>&nbsp;Os serviços de exumação, confecção de pedras, fotos,
          embelezamento e fornecimento de jazigo/gaveta (túmulo), não serão
          cobertos neste contrato, sendo eventuais despesas de inteira
          responsabilidade do CONTRATANTE;</span
        >
      </p>
      <p>
        <span style="font-size: 14px"
          ><b>1.3</b>&nbsp;Serviços e despesas não contemplados neste contrato
          serão custeados pelo(a) CONTRATANTE ou o BENEFICIÁRIO responsável pelo
          funeral.</span
        >
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b style="font-size: 16px"
          >CLÁUSULA SEGUNDA – DA ABRANGÊNCIA GEOGRÁFICA</b
        >
      </h4>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>2.1</b>&nbsp;A abrangência geográfica dos serviços
          disponibilizados pela CONTRATADA compreende a localidade onde o
          contrato foi firmado, e em conformidade com o plano optado no termo de
          adesão em anexo.</span
        >
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b
          ><span style="font-size: 16px"
            >CLÁUSULA TERCEIRA – DOS SERVIÇOS CONTRATADOS</span
          ></b
        >
      </h4>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>3.1</b>&nbsp;A CONTRATADA obriga-se a prestar os seguintes
          serviços:<br
        /></span>
      </p>
      <p></p>
      <ul>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Plantão 24 horas para atendimento telefônico e auxílio de
            informações ao CONTRATANTE e seus BENEFICIÁRIOS;<br
          /></span>
        </li>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Atendimento funerário na localidade onde o contrato foi firmado,
            conforme declarado no termo de adesão em anexo;<br
          /></span>
        </li>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Traslado rodoviário para as áreas de atuação acima descrita, nos
            limites do plano contratado e assinalado no anexo III;<br
          /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Urna mortuária estilo sextavado em conformidade com o plano
            adquirido;<br
          /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Paramentação conforme o credo religioso;<br
          /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Carro funerário para remoção e cortejo</span
          >;
        </li>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Decoração de flores naturais e/ou artificiais na urna, conforme a
            disponibilidade de mercado onde serão executados os serviços
            conforme plano optado;<br
          /></span>
        </li>
        <li>
          <span style="font-size: 14px">Velas;<br /></span>
        </li>
        <li>
          <span style="font-size: 14px">Véu;<br /></span>
        </li>
        <li>
          <span style="font-size: 14px">Livro de presença;<br /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Sala de velório, se necessário conforme disponibilidade do plano
            optado.</span
          >
        </li>
      </ul>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b style="font-size: 16px"
          >CLÁUSULA QUARTA – DOS SERVIÇOS DE ALIMENTAÇÃO</b
        >
      </h4>
    </div>
    <div>
      <p>
        <span style="font-size: 14px"
          ><b>4.1</b>&nbsp;Lanche servido na sala de velório da
          CONTRATADA:</span
        >
      </p>
      <p></p>
      <ul>
        <li><span style="font-size: 14px">&nbsp;50 (cinquenta) pães;</span></li>
        <li>
          <span style="font-size: 14px"
            >250g (duzentos e cinquenta gramas) de manteiga;</span
          >
        </li>
        <li><span style="font-size: 14px">02 (dois) litros de leite;</span></li>
        <li>
          <span style="font-size: 14px"
            >02 (dois) pacotes de bolacha de água e sal;</span
          >
        </li>
        <li><span style="font-size: 14px">Chá e café à vontade.</span></li>
      </ul>
      <p></p>
      <p style="">
        <span style="font-size: 14px"
          ><b style="">4.2</b>&nbsp;Kit lanche para residência e outros:</span
        >
      </p>
      <p style=""></p>
      <ul>
        <li>
          <span style="font-size: 14px">500g (quinhentos gramas) de chá;</span>
        </li>
        <li>
          <span style="font-size: 14px">500g (quinhentos gramas) de café;</span>
        </li>
        <li>
          <span style="font-size: 14px">02kg (dois quilos) de açúcar;</span>
        </li>
        <li>
          <span style="font-size: 14px"
            >01 (um) pacote de bolacha de água e sal;</span
          >
        </li>
        <li>
          <span style="font-size: 14px"
            >250g (duzentos e cinquenta gramas) de manteiga;</span
          >
        </li>
        <li><span style="font-size: 14px">100 (cem) copos de café.</span></li>
      </ul>
      <p></p>
      <p></p>
      <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
        <p>
          <span style="font-size: 12px"
            ><b>Parágrafo Primeiro:</b> Eventual produto que for substituído
            futuramente em decorrência da falta de fabricação ou distribuição no
            mercado, será substituído por produto equivalente ou de igual valor
            de escolha do (a) CONTRATANTE.<br
          /></span>
        </p>
        <p>
          <span style="font-size: 12px"
            ><b>Parágrafo Segundo:</b> Os itens compreendidos acima fazem
            referência aos serviços e produtos mínimos ofertados para todos os
            planos disponíveis da CONTRATADA.</span
          >
        </p>
      </blockquote>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <h4 style="text-align: center">
      <b
        ><span style="font-size: 16px"
          >CLÁUSULA QUINTA – DOS SERVIÇOS DE TRANSLADO
        </span></b
      >
    </h4>
    <div style="text-align: center">
      <h1></h1>
      <p></p>
    </div>
    <div style="text-align: center">
      <h1></h1>
      <p></p>
    </div>
    <div style="text-align: center">
      <h1></h1>
      <p></p>
    </div>
    <div>
      <p style="text-align: justify">
        <b style="font-size: 14px">5.1</b
        ><span style="font-size: 14px">
          O meio de transporte a ser utilizado&nbsp;para o translado do corpo
          será o rodoviário. Se necessário o uso de transporte aéreo, poderá a
          CONTRATADA proceder a intermediação, ficando as despesas daí
          decorrentes por conta do CONTRATANTE ou do beneficiário responsável ou
          dos seus herdeiros, caso aquele&nbsp;venha a falecer;</span
        >
      </p>
      <span style="color: inherit; font-size: 14px">
        <p style="text-align: justify">
          <b style="color: inherit">5.2</b
          ><span style="color: inherit">
            Não haverá qualquer tipo de reembolso de quaisquer despesas
            efetuadas pelo (a) CONTRATANTE em caso de solicitação de serviços
            não previstos no respectivo plano optado.</span
          ><br />
        </p>
      </span>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <h4 style="text-align: center">
      <b
        ><span style="font-size: 16px"
          >CLÁUSULA SEXTA – DA ADESÃO AO PLANO E DEPENDENTES</span
        ></b
      >
    </h4>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>6.1</b>&nbsp;Com a adesão ao plano escolhido no termo de adesão, a
          CONTRATADA fornecerá os serviços funerários correspondentes ao
          CONTRATANTE e seus beneficiários;</span
        >
      </p>
      <p></p>
      <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
        <p style="text-align: justify">
          <span style="font-size: 12px"
            ><b>Parágrafo Primeiro:</b>&nbsp;O (a) CONTRATANTE poderá optar na
            ficha de qualificação dos beneficiários por pessoas de sua escolha,
            sem obrigatoriedade de qualquer grau de parentesco, obedecendo ao
            limite de 9 (nove) beneficiários.</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 12px"
            ><b>Parágrafo Segundo:</b>&nbsp;As informações dos beneficiários
            prestadas no termo de adesão e no contrato de prestação de
            assistência funerária serão consideradas verdadeiras, sob pena de
            responsabilidade civil e criminal do (a) CONTRATANTE.</span
          >
        </p>
      </blockquote>
      <span style="color: inherit; font-size: 14px">
        <p style="text-align: justify">
          <b style="color: inherit">6.2</b
          ><span style="color: inherit">
            O CONTRATANTE pagará a CONTRATADA como taxa de adesão, no ato da
            assinatura do presente contrato, o&nbsp; valor estipulado no termo
            de adesão;</span
          >
        </p>
      </span>
      <p style="text-align: justify">
        <span style="color: inherit; font-size: 14px"
          ><b>6.3</b>&nbsp;Caberá ao (a) CONTRATANTE o pagamento da mensalidade
          fixada para cada ano-base no Termo de Adesão, conforme tabela de
          preços descritos no Termo de Adesão vigente à época, que estará
          sujeita a
          <u style="font-weight: bold"
            >reajuste anual através da aplicação da variação positiva do Índice
            Geral de Preços - Mercado, divulgado pela Fundação Getúlio Vargas
            (IGP-M - Índice Geral de Preços do Mercado), sendo que a data base
            para o reajuste se dará no primeiro dia de cada ano</u
          >&nbsp;ou, no caso da extinção do IGP-M, por outro índice que reflita
          a variação positiva dos preços no período em questão, podendo ainda
          ser revista, a qualquer tempo, sempre que houver necessidade de
          recomposição real de perdas inflacionárias não refletidas no índice
          adotado ou quando a estrutura de custos da CONTRATADA assim o
          exigir.<br
        /></span>
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <h4 style="text-align: center">
      <b style="font-size: 16px">CLÁUSULA SÉTIMA – DOS PRAZOS DE PAGAMENTO</b>
    </h4>
    <div>
      <h1></h1>
      <p></p>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>7.1</b> O presente contrato entrará em vigor na data em que houver
          o efetivo pagamento da taxa de adesão e permanecerá pelo prazo de 250
          (Duzentos e Cinquenta) meses sem que tenha requisitado atendimento
          funerário terá suspensa essa obrigação, desde que o (a) CONTRATANTE
          requeira o termo de quitação provisória perante a CONTRATADA, até que
          venha ocorrer o primeiro atendimento funerário, quando então ficará
          restabelecida as obrigações. Caso tenha excedido a quantidade de 250 (
          Duzentos e Cinquenta) meses não haverá reembolso,</span
        >
      </p>
      <span style="color: inherit; font-size: 14px">
        <p style="text-align: justify">
          <b style="color: inherit">7.2</b
          ><span style="color: inherit">
            Fica pactuado que o (a) CONTRATANTE e os beneficiários do presente
            contrato terão direito a usufruir dos benefícios contratados e
            relativos ao plano escolhido após a carência de 90 (noventa) idas,
            contados da data do pagamento integral da taxa de adesão. A
            CONTRATADA, então, não fica obrigada a prestar nenhum serviço antes
            do término da carência;</span
          >
        </p>
      </span>
      <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
        <span style="color: inherit; font-size: 14px">
          <p style="text-align: justify">
            <span style="color: inherit; text-align: justify"
              ><u style="font-weight: bold; font-size: 12px"
                >Parágrafo primeiro:</u
              ><span style="font-size: 12px"
                >&nbsp;O (a) CONTRATANTE será considerado (a) constituído (a) em
                mora a partir do primeiro dia do vencimento da primeira
                mensalidade referente ao plano aderido no termo de adesão,
                independente de notificação, sendo os serviços terminantemente
                suspensos;</span
              ></span
            >
          </p>
          <p style="text-align: justify">
            <span style="color: inherit"
              ><span style="font-size: 12px"
                ><u style="font-weight: bold">Parágrafo segundo:</u>&nbsp;Antes
                de decorridos os primeiros 90 (noventa) dias a contar da data da
                assinatura do contrato será devido a cobrança de valor a titulo
                de carência para que seja efetuado o atendimento funerário, no
                valor de igual ao teor de 44 (quarenta e quatro) vezes o valor
                da taxa mensal conforme o plano optado.</span
              ></span
            >
          </p>
        </span>
      </blockquote>
      <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
        <p></p>
      </blockquote>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="font-size: 16px; text-align: center">
        <b>CLÁUSULA OITAVA – DO PAGAMENTO EM ATRASO</b>
      </h4>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>8.1</b>&nbsp;O não pagamento das quantias devidas dentro do prazo
          convencionado na aquisição do Termo de Adesão implicará na incidência
          de multa de <b>2,0% (dois por cento)</b> do valor devido e não pago,
          acrescida de juros de mora de
          <b>1,0%, (um por cento) ao mês</b> calculados sobre o valor devido até
          a data do efetivo pagamento;</span
        ><br />
      </p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>8.2&nbsp;</b>A prerrogativa assegurada em favor da CONTRATADA, que
          lhe garante contra o (a) CONTRATANTE no caso de não pagamento dos
          valores previstos no termo de adesão, não prejudica ou afeta a
          exequibilidade deste contrato e seus anexos, que fica valendo, para
          todos os efeitos, como título executivo extrajudicial.</span
        >
      </p>
      <p><span style="font-size: 14px"></span></p>
      <div class="edit">
        <p style="text-align: justify">
          <b>8.3 </b>Em caso de pagamento de parcelas em atraso pelo CONTRATANTE
          a mais de 90 (noventa) dias será devido à cobrança de valor a título
          de carência para que seja efetuado o atendimento funerário, no valor
          de igual teor de 44 (quarenta e quatro) vezes o valor da taxa mensal
          conforme o plano optado.
        </p>
      </div>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b style="font-size: 16px">CLÁUSULA NONA – DAS OBRIGAÇÕES DAS PARTES</b>
      </h4>
    </div>
    <div>
      <p><b>DA CONTRATADA:</b></p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>9.1</b>&nbsp;Executar os serviços contratados de forma objetiva e
          eficiente, no intuito de trazer um pouco de conforto no momento de
          dificuldade do (a) CONTRATANTE;</span
        >
      </p>
      <p>
        <span style="font-size: 14px"
          ><b>9.2</b>&nbsp;Promover adequação e modernização da infraestrutura
          de atendimento;</span
        >
      </p>
      <p>
        <span style="font-size: 14px"
          ><b>9.3</b> Facilitar acesso as informações necessárias aos
          beneficiários aos serviços oferecidos;</span
        >
      </p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>9.4</b> Cumprir o plano contratado com estrita observância as
          condições e cláusulas descritas neste contrato e anexos;</span
        >
      </p>
      <p><b>DO(A) CONTRATANTE</b></p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><b>9.5</b>&nbsp;Manter em dia o pagamento das mensalidades, bem como,
          seus dados cadastrais devidamente atualizados.</span
        >
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h4 style="text-align: center">
        <b style="font-size: 16px"
          >CLÁUSULA DÉCIMA - DA RESCISÃO CONTRATUAL E SEUS EFEITOS</b
        >
      </h4>
    </div>
    <div>
      <p></p>
      <div class="edit">
        <p>
          <span style="font-size: 14px"
            ><u
              >Este contrato poderá ser rescindido nas hipóteses abaixo
              delineadas:</u
            ></span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>10.1</b>&nbsp;A rescisão do contrato, desde que não tenha o (a)
            CONTRATANTE usufruído do serviço funerário, será livre de qualquer
            ônus;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>10.2</b>&nbsp;Ensejando no cancelamento do contrato e com a
            devida prestação dos serviços, a CONTRATADA estará responsável pela
            apuração do saldo devedor para a devida quitação dos serviços
            prestados, apresentando de forma objetiva e clara os custos dos
            serviços para sua devida quitação;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>10.3</b>&nbsp;O saldo remanescente deverá ser quitado na forma à
            vista, ou por meio de confissão de dívida para emissão de boleto
            bancário.</span
          >
        </p>
        <p>
          <span style="text-align: justify"
            ><span style="font-size: 14px"
              ><b>10.4</b>&nbsp;Emitido o boleto, e não havendo o pagamento no
              vencimento, o devedor será inserido no SCPC e Serasa, bem como,
              serão tomadas as medidas judiciais cabíveis para a devida quitação
              da dívida;</span
            ><br
          /></span>
        </p>
      </div>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h1 style="font-size: 16px; text-align: center">
        <b>CLÁUSULA DÉCIMA PRIMEIRA - DAS ALTERAÇÕES DE TITULARIDADE</b>
      </h1>
    </div>
    <div>
      <p></p>
      <div class="edit">
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>11.1</b>&nbsp;Em caso de falecimento do CONTRATANTE, poderá os
            beneficiários, se houver, ou responsável, assumir o contrato
            principal, passando assim a ser responsável legal dos direitos e
            obrigações assumidos neste contrato;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>11.2</b>&nbsp;Para a transferência da titularidade, é
            imprescindível que o contrato esteja livre de qualquer débito.</span
          >
        </p>
      </div>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <h1 style="font-size: 16px; text-align: center">
        <b>CLÁUSULA DÉCIMA SEGUNDA - DAS DISPOSIÇÕES GERAIS</b>
      </h1>
    </div>
    <div>
      <p></p>
      <div class="edit">
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b style="">12.1</b>&nbsp;Cada parte declara e garante em benefício
            da outra que possui plenos poderes e está devidamente autorizada a
            celebrar o presente contrato e a cumprir todas as obrigações nele
            assumidas;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>12.2</b>&nbsp;Referências a qualquer documentos, anexo ou outros
            instrumentos incluem todas as alterações, substituições,
            consolidações e respectivas complementações, salvo se expressamente
            disposto de forma diversa;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px"
            ><b>12.3</b>&nbsp;Todas as referências a quaisquer partes deste
            contrato incluem seus sucessores, beneficiários,
            representantes;</span
          >
        </p>
        <p style="text-align: justify">
          <b style="font-size: 14px; color: inherit">12.4</b
          ><span style="font-size: 14px; color: inherit"
            >&nbsp;Faz parte integrante e indissociável deste contrato, como se
            nele estivessem transcritos, o Termo de Adesão, cujo conteúdo o (a)
            CONTRATANTE declara haver tomado amplo conhecimento, tendo aceitado
            todos os seus termos, sem qualquer restrição ou objeção;</span
          >
        </p>
        <p style="text-align: justify">
          <b style="font-size: 14px; color: inherit">12.5</b
          ><span style="font-size: 14px; color: inherit"
            >&nbsp;As Partes reconhecem como válidas eficazes e suficientes às
            comunicações, notificações e cobranças enviadas para o endereço
            indicado pelo (a) CONTRATANTE no termo de adesão, cabendo a este
            informar a CONTRATADA sobre qualquer alteração de endereço ou de
            seus dados cadastrais, sempre por escrito e no prazo máximo de
            <u style="font-weight: bold">30 (trinta) dias</u>&nbsp;contados do
            evento;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px; color: inherit"
            ><b>12.6&nbsp;</b>A mensalidade tem como principal objetivo a
            manutenção e disponibilização de toda a infraestrutura necessária ao
            atendimento desse serviço e, desta forma, a não ocorrência de
            falecimento dos BENEFICIÁRIOS não implica em qualquer forma de
            reembolso de pagamentos pela CONTRATADA ao CONTRATANTE ou
            BENEFICIÁRIOS;</span
          >
        </p>
        <p style="text-align: justify">
          <span style="font-size: 14px; color: inherit"
            ><b>12.7</b>&nbsp;O não exercício, da CONTRATADA, de quaisquer dos
            direitos ou prerrogativas previstas neste contrato ou seus anexos,
            ou mesmo na legislação aplicável, será tido como ato de mera
            liberalidade, não constituindo alteração ou novação das obrigações
            ora estabelecidas, cujo cumprimento poderá ser exigido a qualquer
            tempo, independentemente de comunicação prévia à outra parte.</span
          >
        </p>
      </div>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><strong>PARTES:</strong> Confirmo,
          <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
          MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
          CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
          dever de observar e fazer cumprir as cláusulas aqui
          estabelecidas.</span
        >
      </p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><strong>TESTEMUNHA:</strong> Confirmo,
          <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
          MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
          CONTRATO.</span
        >
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p style="text-align: center; font-size: 14px">
        ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
      </p>
    </div>
    <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
    <div>
      <h1 style="font-size: 16px; text-align: center">
        <b>ANEXO 01 - FICHA DE QUALIFICAÇÃO</b>
      </h1>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p><b>DADOS DO TITULAR</b></p>
      <p>
        Nome:&nbsp;<span class="NOME_TITULAR token_d4s" style=""
          >${contratoCliente.nomeTitular}</span
        >&nbsp;
      </p>
      <p>
        R.G.:&nbsp;<span class="RG_TITULAR token_d4s"
          >${contratoCliente.rgTitular}</span
        >&nbsp;
      </p>
      <p>
        CPF:&nbsp;<span class="CPF_TITULAR token_d4s"
          >${contratoCliente.cpfTitular}</span
        >&nbsp;
      </p>
      <p>
        Sexo:
        <span class="SEXO_TITULAR token_d4s"
          >${contratoCliente.sexoTitular}</span
        >&nbsp;
      </p>
      <p>
        Data de Nascimento:&nbsp;<span class="Data_Nasc_Titular token_d4s"
          ><span class="DA_Nasc_Titular token_d4s"
            ><span class="DATA_NASC_TITULAR token_d4s"
              >${contratoCliente.dataNascTitular}</span
            >&nbsp;</span
          ></span
        >
      </p>
      <p>
        Estado Civil:&nbsp;<span class="Estado_Civil_Titular token_d4s"
          ><span class="ESTADO_CIVIL_TITULAR token_d4s"
            >${contratoCliente.estadoCivilTitular}</span
          >&nbsp;</span
        >
      </p>
      <p>
        <span style="color: inherit"
          >Profissão:
          <span class="PROFISSAO_TITULAR token_d4s"
            >${contratoCliente.profissaoTitular}</span
          >&nbsp;</span
        >
      </p>
      <p>
        <span style="color: inherit"
          >Religião:&nbsp;<span class="Religiao_Titular token_d4s"
            ><span class="RELIGIAO_TITULAR token_d4s"
              >${contratoCliente.religiaoTitular}</span
            >&nbsp;</span
          ></span
        ><br />
      </p>
      <p>
        <span style="color: inherit"
          >Naturalidade:
          <span class="NATURALIDADE_TITULAR token_d4s"
            >${contratoCliente.naturalidadeTitular}</span
          >&nbsp;</span
        ><br />
      </p>
      <p>
        Nacionalidade:
        <span class="NACIONALIDADE_TITULAR token_d4s"
          >${contratoCliente.nacionalidadeTitular}</span
        >&nbsp;
      </p>
      <p>
        Telefone 01:
        <span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1}</span
        >&nbsp;
      </p>
      <p>
        Telefone 02:
        <span class="TELEFONE_02 token_d4s"
          >${contratoCliente.telefone2 == "null" ? "" :
              contratoCliente.telefone2}</span
        >&nbsp;
      </p>
      <p>
        E-mail 01:
        <span class="EMAIL01 token_d4s"
          ><span class="EMAIL_01 token_d4s">${contratoCliente.email1}</span
          >&nbsp;</span
        >&nbsp;
      </p>
      <p>
        E-mail 02:
        <span class="EMAIL_02 token_d4s" style=""
          >${contratoCliente.email2 == "null" ? "" :
              contratoCliente.email2}</span
        >&nbsp;
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p></p>
      <div class="edit">
        <p><b>DADOS RESIDENCIAIS</b></p>
        <p>
          <span style="color: inherit">Endereço Residencial:&nbsp;</span
          ><span style="color: inherit"
            ><span class="ENDERECO_RES token_d4s"
              ><span class="ENDERECO_RESIDENCIAL token_d4s"
                >${contratoCliente.tipoLogradouroResidencial}
                ${contratoCliente.nomeLogradouroResidencial}</span
              ></span
            ></span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Número:
            <span class="NUMERO_END_RESIDENCIAL token_d4s"
              >${contratoCliente.numeroResidencial}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Complemento:
            <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
              >${contratoCliente.complementoResidencial}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Bairro:
            <span class="BAIRRO_RESIDENCIAL token_d4s"
              >${contratoCliente.bairroResidencial}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >CEP:
            <span class="CEP_RESIDENCIAL token_d4s"
              >${contratoCliente.cepResidencial}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Cidade:
            <span class="CIDADE_RESIDENCIAL token_d4s"
              >${contratoCliente.cidadeResidencial}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >U.F:
            <span class="ESTADO_RESIDENCIAL token_d4s"
              >${contratoCliente.estadoResidencial}</span
            >&nbsp;</span
          >
        </p>
      </div>
      <p></p>
      <div class="edit">
        <p><b>DADOS COMERCIAIS</b></p>
        <p>
          Endereço
          Comercial:&nbsp;${contratoCliente.enderecoCobrancaIgualResidencial ==
              1 ? contratoCliente.tipoLogradouroResidencial :
              contratoCliente.tipoLogradouroCobranca}
          ${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.nomeLogradouroResidencial :
              contratoCliente.nomeLogradouroCobranca}
        </p>
        <p>
          <span style="color: inherit"
            >Número:
            <span class="NUMERO_END_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.numeroResidencial :
              contratoCliente.numeroCobranca}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Complemento:
            <span class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.complementoResidencial :
              contratoCliente.complementoCobranca}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Bairro:
            <span class="BAIRRO_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.bairroResidencial :
              contratoCliente.bairroCobranca}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >CEP:
            <span class="CEP_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.cepResidencial :
              contratoCliente.cepCobranca}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >Cidade:
            <span class="CIDADE_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.cidadeResidencial :
              contratoCliente.cidadeCobranca}</span
            >&nbsp;</span
          >
        </p>
        <p>
          <span style="color: inherit"
            >U.F:
            <span class="ESTADO_RESIDENCIAL token_d4s"
              >${contratoCliente.enderecoCobrancaIgualResidencial == 1 ?
              contratoCliente.estadoResidencial :
              contratoCliente.estadoCobranca}</span
            >&nbsp;</span
          >
        </p>
      </div>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p></p>
      <div class="edit">
        <p><b>DEPENDENTES</b></p>
        ${htmlDependentesHumano}
      </div>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p style="text-align: center; font-size: 14px">
        ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
      </p>
    </div>
    <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
    <div>
      <h1 style="font-size: 16px; text-align: center">
        <b>ANEXO 02 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS</b>
      </h1>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p>
        <b><span style="font-size: 14px">PLANO CRISTAL REAJUSTÁVEL</span></b>
      </p>
      <p></p>
      <ul>
        <li style="text-align: justify">
          <span style="color: inherit; font-size: 14px"
            >URNA MORTUÁRIA: Padrão Cristal - no tamanho adequado, elaborada em
            matéria prima originária de madeira, aças tipo varão com 6 (seis)
            fixadores, 4 (quatro) chavetas, base e tampa forradas, babado e
            sobre babado, visor na parte superior da tampa, acabamento externo
            em verniz, detalhe em alto relevo;</span
          >
        </li>
        <li>
          <span style="font-size: 14px; color: inherit"
            >Montagem de velório compreendendo a paramentação conforme credo
            religioso;</span
          >
        </li>
        <li><span style="font-size: 14px">Velas;</span></li>
        <li>
          <span style="font-size: 14px"
            >Carro funerário para remoção e sepultamento;</span
          >
        </li>
        <li><span style="font-size: 14px">Véu;</span></li>
        <li>
          <span style="font-size: 14px"
            >Sala de velório, se necessário na sede da CONTRATADA;</span
          >
        </li>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Decoração de flores naturais e/ou artificiais na urna, conforme a
            disponibilidade de mercado onde será executado os serviços;</span
          >
        </li>
        <li>
          <span style="font-size: 14px">Embalsamamento ou Formalização;</span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Transporte do corpo caso haja necessidade dentro da Unidade
            Federativa Goiás;</span
          >
        </li>
        <li>
          <span style="font-size: 14px"
            >TAXA DE ADESÃO 3 VEZES O VALOR DA MENSALIDADE;</span
          >
        </li>
        <li><span style="font-size: 14px">KIT LANCHE.</span></li>
      </ul>
      <p></p>
      <p></p>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p>
        <span style="font-size: 14px"><b>PLANO APOLLO REAJUSTÁVEL</b></span>
      </p>
      <p style="text-align: justify"></p>
      <ul>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >URNA MORTUÁRIA: Padrão Apollo- no tamanho adequado, elaborada em
            matéria prima originaria de madeira, alças tipo&nbsp;varão com 6
            (seis) fixadores, 4 (quatro) chavetas, base e tampa forradas, babado
            e sobre babado,&nbsp;visor na parte superior da tampa, acabamento
            externo em&nbsp;verniz, detalhe em baixo e alto relevo;</span
          >
        </li>
        <li>
          <span style="font-size: 14px"
            >Montagem de&nbsp;velório compreendendo a paramentação conforme
            credo religioso;</span
          >
        </li>
        <li>
          <span style="font-size: 14px">Velas;<br /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Carro funerário para remoção e sepultamento;</span
          >
        </li>
        <li>
          <span style="font-size: 14px">Véu;<br /></span>
        </li>
        <li>
          <span style="font-size: 14px"
            >Sala de&nbsp;velório, se necessário na sede da CONTRATADA;</span
          >
        </li>
        <li style="text-align: justify">
          <span style="font-size: 14px"
            >Decoração de flores naturais e/ou artificiais na urna, conforme a
            disponibilidade de mercado onde será executado os serviços;</span
          >
        </li>
        <li>
          <span style="font-size: 14px"
            >100 KM de cobertura para transporte do corpo caso há
            necessidade;</span
          >
        </li>
        <li>
          <span style="font-size: 14px"
            >TAXA DE ADESÃO 3&nbsp;VEZES O&nbsp;VALOR DA MENSALIDADE;</span
          >
        </li>
        <li><span style="font-size: 14px">KIT LANCHE</span></li>
      </ul>
      <p></p>
      <p></p>
    </div>
    <div style="page-break-after: always" class="pagebreak">&nbsp;</div>
    <div>
      <h1 style="font-size: 16px; text-align: center">
        <b style="font-size: 16px">ANEXO 03 - TERMO DE ADESÃO</b>
      </h1>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p><b>DADOS DO CONTRATO</b></p>
      <p></p>
      <ul>
        <li>
          Plano Selecionado:&nbsp;<span class="PLANO_SELECIONADO token_d4s"
            >${planoTratado.descricao}</span
          >&nbsp;
        </li>
        <li>
          <span style="color: inherit">Formato da&nbsp;Venda: </span
          ><span
            class="CONTRATO_NOVO_OU_TRANSFERENCIA token_d4s"
            style="color: inherit"
            >${contratoCliente.tipo}</span
          ><span style="color: inherit">&nbsp;</span>
        </li>
        <ul>
          <li>
            <span style="font-size: 12px"
              ><b>Em caso de transferência:</b></span
            >
          </li>
          <ul>
            <li>
              <span style="font-size: 12px"
                >Empresa Anterior:
                <span class="EMPRESA_ANTERIOR token_d4s"
                  >${contratoCliente.empresaAntiga == 'null' ? " " :
              contratoCliente.empresaAntiga}</span
                >&nbsp;</span
              >
            </li>
            <li>
              <span style="font-size: 12px"
                >Data de Assinatura do Contrato Anterior:
                <span class="DATA_CONTRATO_ANTERIOR token_d4s"
                  >${contratoCliente.dataContratoAntigo == 'null' ? " " :
              contratoCliente.dataContratoAntigo}</span
                >&nbsp;</span
              >
            </li>
          </ul>
        </ul>
      </ul>
      <blockquote style="margin: 0 0 0 40px; border: none; padding: 0px">
        <p></p>
      </blockquote>
    </div>
    <div>
      <p><b style="font-size: 14px">TAXA DE ADESÃO</b></p>
      <p></p>
      <ul>
        <li>Plano Funerário: R$ ${planoTratado.valorAdesao}</li>
        <li style="font-size: 14px">
          <b style="font-size: 16px"
            >Total da Taxa de Adesão:R$ ${result.id >= 2 ?
              planoTratado.valorAdesao : valorTotalAdesao}</b
          >
        </li>
      </ul>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p><b style="font-size: 14px">MENSALIDADE</b></p>
      <p></p>
      <ul>
        <li>Plano Funerário: R$ ${planoTratado.valorMensalidade}</li>
        <li>Acréscimo de Adicionais: R$ ${valorAdicional}</li>
        <li>Quantidade de Adicionais: ${qtdAdicional}</li>
        <li><b>Total da Mensalidade:R$ ${valorTotalMensalidade}</b></li>
      </ul>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p>
        <span style="font-size: 14px"><b>DADOS DE PAGAMENTO</b></span>
      </p>
      <p></p>
      <ul>
        <li>
          Data de Vencimento da Primeira
          Mensalidade:${contratoCliente.dataPrimeiraMensalidade}
        </li>
        <li>
          Forma de Pagamento:
          <span class="FORMA_PAGAMENTO token_d4s"
            >${contratoCliente.localCobranca}</span
          >&nbsp;
        </li>
        <ul>
          <li>Em caso de cobrador, qual o endereço de cobrança?</li>
          <ul>
            <li>
              Endereço de Cobrança:
              <span class="ENDERECO_COBRANCA token_d4s"
                >${contratoCliente.tipoLogradouroResidencial}
                ${contratoCliente.nomeLogradouroResidencial},
                ${contratoCliente.numeroResidencial}, QUADRA:
                ${contratoCliente.quadraResidencial == 'null' ? "" : contratoCliente.quadraResidencial}, LOTE:
                ${contratoCliente.loteResidencial == 'null' ? "" : contratoCliente.loteResidencial}, Complemento:
                ${contratoCliente.complementoResidencial}, Bairro:
                ${contratoCliente.bairroResidencial},
                ${contratoCliente.cepResidencial}</span
              >&nbsp;
            </li>
            <li>
              Melhor Horário:
              <span class="HORARIO_COBRANCA token_d4s"
                >${contratoCliente.melhorHorario}</span
              >&nbsp;
            </li>
          </ul>
        </ul>
      </ul>
      <p></p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><strong>PARTES:</strong> Confirmo,
          <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
          MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
          CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
          dever de observar e fazer cumprir as cláusulas aqui
          estabelecidas.</span
        >
      </p>
      <p style="text-align: justify">
        <span style="font-size: 14px"
          ><strong>TESTEMUNHA:</strong> Confirmo,
          <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
          MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
          CONTRATO.</span
        >
      </p>
    </div>
    <div>
      <p></p>
      <hr />
      <p></p>
    </div>
    <div>
      <p style="text-align: center; font-size: 14px">
        ${unidadeTratado.municipio} - ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
      </p>
    </div>
  </body>
</html>

          `
        }
      }
      setCarregamentoButton(false);
      return navigation.navigate("contratoContentAssinatura", { contratoID, anexos, html });
    } catch (e) {
      setCarregamentoButton(false);
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`Não foi possivel enviar contrato, contate o suporte: ${e.toString()} `} />
        }
      });
    }
  };

  const finalizar = async () => {
    Alert.alert(
      "Aviso.",
      "Deseja 'VISUALIZAR' o contrato? \n\n",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "VISUALIZAR",

          onPress: async () => {
            finalizarContrato();
          },
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    setup()
  }, [templateID]);

  return (
    <ScrollView h="100%">
      {carregamentoTela ? (
        <ComponentLoading mensagem="Carregando informações" />
      ) : (
        <VStack m="2">
          <Box
            key="1"
            safeArea
            w="100%"
            pl="5"
            pr="5"
            mb="2"
            pb="5"
            maxW="100%"
            rounded="lg"
            overflow="hidden"
            borderColor="coolGray.200"
            borderWidth="1"
            _light={light}
            _web={web}
          >
            <Heading
              size="lg"
              fontWeight="bold"
              color={colors.COLORS.PAXCOLOR_1}
            >
              Gerar Contrato PDF
            </Heading>
            <HStack space={2} justifyContent="center">
              <Center w="100%" rounded="md">
                <FormControl>
                  <FormControl.Label>
                    Selecione um modelo de contrato:
                  </FormControl.Label>
                  <Radio.Group
                    isDisabled={carregamentoButton}
                    defaultValue={templateID}
                    onChange={(e) => setTemplateID(e)}
                    name="templateID"
                  >
                    {templatesContrato.map((item) => (
                      <Radio
                        colorScheme="emerald"
                        key={item["nome_template"]}
                        value={item.id}
                      >
                        {item["nome_template"]}
                      </Radio>
                    ))}
                  </Radio.Group>
                </FormControl>
              </Center>
            </HStack>
          </Box>
          <Box
            key="3"
            safeArea
            w="100%"
            pl="5"
            pr="5"
            mb="5"
            pb="5"
            maxW="100%"
            rounded="lg"
            overflow="hidden"
            borderColor="coolGray.200"
            borderWidth="1"
            _light={light}
            _web={web}
          >
            <Button
              mt="2"
              mb="2"
              size="lg"
              _text={styleButtonText}
              isDisabled={!templateID}
              isLoading={carregamentoButton}
              isLoadingText="Gerando"
              _light={styleButton}
              onPress={finalizar}
            >
              VISUALIZAR CONTRATO
            </Button>
          </Box>
        </VStack>
      )}
    </ScrollView>
  );
}

export { ContratoContentFinalizar };
