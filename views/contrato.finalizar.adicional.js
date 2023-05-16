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
import { templatesAdicionalPAX, templatesAdicionalPET } from "../utils/generic/data";
import moment from 'moment';

function ContratoContentFinalizarAdicional({ navigation }) {
  /// Config
  const route = useRoute();
  const toast = useToast();
  /// Parametros
  const { contratoID, unidadeID, anexos, id, hum } = route.params;

  const [templateID, setTemplateID] = useState(null);
  const [templates, setTemplates] = useState([]);
  /// Booleanos
  const [carregamentoTela, setCarregamentoTela] = useState(false);
  const [carregamentoButton, setCarregamentoButton] = useState(false);
  const [desabilitaContrato, setDesabilitaContrato] = useState(false);
  const ref = useRef();
  const [estado, setEstado] = useState(null);

  const trimObject = (data) => {
    for (var property in data) {
      if (typeof data[property] === "string") {
        data[property] = data[property].trim();
      }
    }
    return data;
  };

  const setup = async () => {
    executarSQL(`select regiao, uf from unidade where id = ${unidadeID}`).then((response) => {
      setEstado(response._array[0].uf)
    })
    if (hum == true) {
      setTemplates(templatesAdicionalPAX)
    } else {
      setTemplates(templatesAdicionalPET)
    }
    await executarSQL(`
    UPDATE titular
    SET 
    tipo = '',
    unidadeId = ${unidadeID}
    WHERE id = ${contratoID}`);
  }

  const finalizarContrato = async () => {
    setCarregamentoButton(true);

    try {

      if (!templateID) {
        Alert.alert("Aviso.", "Selecione um template!");
        return;
      }
      if (hum == true) {
        if (id != null) {
          if (templateID == 1) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'ADICIONAL PAX',
                  unidadeId = ${unidadeID}
                  WHERE id = ${id}`);

          } else if (templateID == 2) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'EXCLUSÃO PAX',
                  unidadeId = ${unidadeID}
                  WHERE id = ${id}`);
          }
        } else {
          if (templateID == 1) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'ADICIONAL PAX',
                  unidadeId = ${unidadeID}
                  WHERE id = ${contratoID}`);

          } else if (templateID == 2) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'EXCLUSÃO PAX',
                  unidadeId = ${unidadeID}
                  WHERE id = ${contratoID}`);
          }
        }
      } else {
        if (id != null) {
          if (templateID == 1) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'ADICIONAL PET',
                  unidadeId = ${unidadeID}
                  WHERE id = ${id}`);

          } else if (templateID == 2) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'EXCLUSÃO PET',
                  unidadeId = ${unidadeID}
                  WHERE id = ${id}`);
          }
        } else {
          if (templateID == 1) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'ADICIONAL PET',
                  unidadeId = ${unidadeID}
                  WHERE id = ${contratoID}`);

          } else if (templateID == 2) {
            await executarSQL(`
                  UPDATE titular
                  SET 
                  tipo = 'EXCLUSÃO PET',
                  unidadeId = ${unidadeID}
                  WHERE id = ${contratoID}`);
          }
        }

      }

      const unidade = await executarSQL(`select * from unidade where id = ${unidadeID}`);

      const unidadeTratado = trimObject(unidade._array[0]);

      //SELECIONA TODOS OS DADOS  DO CONTRATO
      let contrato;
      if (id != null) {
        contrato = await executarSQL(
          `select * from titular where id = '${id}'`
        );
      } else {
        contrato = await executarSQL(
          `select * from titular where id = '${contratoID}'`
        );
      }
      //VERIFICA SE O CONTRATO NÃO ESTÁ VAZIO
      if (!contrato) {
        Alert.alert("Aviso.", "Contrato não localizado!");
        return;
      }
      //COLOCA OS CONTRATOS EM UM ARRAY
      const contratoTratado = trimObject(contrato._array[0]);

      //SELCIONA O PLANO DO CONTRATO E COLOCA EM UM ARRAY
      const plano = await executarSQL(`select * from plano where id  = "${contratoTratado.plano}"`);
      const planoTratado = trimObject(plano._array[0])

      let dependentesHumanos;
      let dependentesPets;

      if (id != null) {
        dependentesHumanos = await executarSQL(`
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
        where titular_id = '${id}'
                and is_pet = 0
          `);
        dependentesPets = await executarSQL(`
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
            where titular_id = '${id}' and is_pet = 1
          `);

      } else {
        dependentesHumanos = await executarSQL(`
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

        dependentesPets = await executarSQL(`
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
      }


      const dependentes = [
        ...dependentesPets._array,
        ...dependentesHumanos._array,
      ];


      const contratoCliente = {
        ...contratoTratado,
        dependentesPets: dependentesPets._array,
        dependentes: dependentesHumanos._array,
      };


      let htmlDependentesHumano = "";
      let htmlDependentesPet = "";
      let htmlCremacao = "";
      let htmlTitularCremado = "";

      let valorTotalAdesao = 0.00
      let valorTotalMensalidade = 0.00
      let adesaoCremacao = 0.00 + contrato._array[0].valorAdesao;
      let mensalidadeCremacao = 0.00 + contrato._array[0].valorMensalidade;
      let adesaoHumano = adesaoCremacao;
      let mensalidadeHumano = mensalidadeCremacao;
      let adesaoPet = 0.00;
      let mensalidadePet = 0.00;

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
              <p>Nome ${index + 1}: ${dep.nome}</p>
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
          if (dep.adicional == 1) {
            valorTotalMensalidade += plano._array[0].valorAdicional;
          }
          adesaoHumano += dep.valorAdesao;
          mensalidadeHumano += dep.valorMensalidade;
          return (htmlDependentesHumano += `
              <div class="edit">
                <p>Dependente ${index + 1}: ${dep.nome}</p>
                <p>CPF: ${dep.cpfDependente}</span>&nbsp;</p>
                <p>Data de Nascimento: ${moment(dep.dataNascimento).format('DD/MM/YYYY')}</p>
                <p>Parentesco: ${dep.parentesco}</p>
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
              <p>Modalidade: ${dep.resgate == 1 ? "Com resgate" : "Sem resgate"}</p>
              <p><span style="color: inherit;"><br></span></p>
          </div>
        `);
      });
      //let cremHumano = dependentesHumanos._array.find((item) => !item.is_pet && item.cremacao);
      //let cremPet = dependentesPets._array.find((item) => item.is_pet);

      const contratoBody = new FormData();

      contratoBody.append("body", JSON.stringify(contratoCliente));

      let html;
      if (hum == true) {
        if (estado == 'MS') {
          if (templateID == 1) {
            html = `
          <!DOCTYPE html>
  <html>
    <head>
      <title>Page Title</title>
    </head>
    <body>
      <div>
        <p>
          <b style="font-size: 16px">DECLARAÇÃO DE INCLUSÃO DE DEPENDENTE PAX</b
          ><br />
        </p>
      </div>
  
      <div style="text-align: justify">
        <p></p>
        <div class="edit">
        <p dir="ltr">
        <span style="font-size: 14px"
          >Contrato nº:${contratoCliente.numContratoAntigo}
      </p>
          <p dir="ltr">
          <span style="font-size: 14px"
            ><span style="color: inherit"></span>Eu,&nbsp;<span
              class="NOME_TITULAR token_d4s"
              >${contratoCliente.nomeTitular}</span
            >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
              class="RG_TITULAR token_d4s"
              >${contratoCliente.rgTitular}</span
            >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
              class="CPF_TITULAR token_d4s"
              >${contratoCliente.cpfTitular}</span
            >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
            LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
            que estou fazendo a <b>INCLUSÃO</b> dos(as) dependentes PAX(s):&nbsp;<span style="color: inherit">&nbsp;</span></span
          >
        </p>
        </div>
      </div>
      ${htmlDependentesHumano}
      <div style="text-align: justify">
          <p dir="ltr" style="font-size: 14px">
            <span style="font-size: 14px; color: inherit"></span>Estando ciente de
            que o(a) mesmo(a) terá direito aos&nbsp;benefícios&nbsp;dos serviços
            estabelecidos no contrato a partir da data de assinatura deste termo
            tendo 90 dias de carência para óbito.&nbsp;&nbsp;<br />
          </p>
          <p dir="ltr" style="font-size: 14px">
            <i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                >. encontra-se a sua inteira disposição para qualquer
                esclarecimento que se fizer necessário.
          </p>
      </div>
      <div style="text-align: justify">
        <div class="edit">
          <div class="edit">
            <p><b>Atualização de Cadastro</b></p>
            <p>
              Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
              >&nbsp;&nbsp;
            </p>
            <p>
              E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
              >&nbsp;
            </p>
            <p></p>
            <div class="edit">
              <p>
                Endereço Residencial:&nbsp;<span
                  class="ENDERECO_RESIDENCIAL token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial}</span
                >&nbsp;<br />
              </p>
              <p>
                Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.numeroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Complemento:&nbsp;<span
                  class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.complementoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                  >${contratoCliente.bairroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                  >${contratoCliente.cepResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                  >${contratoCliente.cidadeResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                  >${contratoCliente.estadoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              </hr>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
        <p></p>
      </div>
  
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <b
            ><span style="font-size: 16px"
              >ANEXO 01 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS
            </span></b
          ><br />
        </p>
      </div>
      <div>
        <p style="text-align: justify"><span style=""></span></p>
        <div class="edit" style="">
          <p style="font-weight: bold">
            <b style=""><span style="font-size: 14px">PLANO 01 - BÁSICO</span></b>
          </p>
          <p style="font-weight: bold"></p>
          <ul style="">
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                  silk-screen prateado, guarnição (friso) na tampa, madeira
                  pinnus, tingida na cor nogueira, verniz alto brilho, fundo e
                  tampa de eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas,
                  ambas na cor dourada, forro e babado rendão tecido 50g branco,
                  taxas douradas, travesseiro solto. (Marca: De acordo com
                  fornecedor vigente)<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >Paramentação conforme o credo religioso;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px">Velas;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >Carro funerário para remoção e sepultamento;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px">Véu;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >Sala de velório, se necessário nas localidades onde o grupo
                  mantém sala;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >Decoração de flores naturais e/ou artificiais na urna, conforme
                  a disponibilidade de mercado onde será executado os serviços;<br /></span
              ></span>
            </li>
            <li style="">
              <span style=""
                ><span style="font-size: 14px"
                  >Transporte de até 100Km.</span
                ></span
              >
            </li>
          </ul>
        </div>
        <p></p>
      </div>
      <div style="text-align: justify">
        <p style="text-align: justify"><span></span></p>
        <div class="edit">
          <p style="font-size: 16px; font-weight: bold">
            <span style="font-size: 14px"><b style=""></b></span>
          </p>
          <div class="edit">
            <p>
              <b><span style="font-size: 14px">PLANO 02 - SUPER-LUXO</span></b>
            </p>
            <p></p>
            <ul>
              <li>
                <span style="font-size: 14px"
                  >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                  laterais do fundo e tampa entalhada em baixo relevo, 2
                  sobretampos entalhados em alto relevo, guarnição (friso) na
                  tampa, madeira pinnus tingida na cor mogno, verniz alto brilho,
                  fundo Eucatex, 6 fixadores tipo concha com varões, laterais
                  dourados, 9 chavetas fundidas e pintadas na cor dourada, forrada
                  em tecido branco com renda larga, sobre babado (rendão) branco
                  com 20 cm de largura, taxas douradas, visor médio de vidro
                  rodeado por renda larga, travesseiro solto. (Marca: De acordo
                  com fornecedor vigente)<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Paramentação conforme o credo religioso;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px">Velas;<br /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Carro funerário para remoção e sepultamento;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px">Véu;<br /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Sala de velório, se necessário nas localidades onde o grupo
                  mantém sala;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Decoração de flores naturais e/ou artificiais na urna, conforme
                  a disponibilidade de mercado onde será executado os serviços;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                  conforme a disponibilidade de mercado onde será executado os
                  serviços;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Abertura de jazigo (não se confundindo com o fornecimento de
                  túmulo / gaveta);<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >Tanatopraxia (preparação do corpo);<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px"
                  >01 (uma) veste, disponível na ocasião;<br
                /></span>
              </li>
              <li>
                <span style="font-size: 14px">Transporte de até 250Km.</span>
              </li>
            </ul>
          </div>
        </div>
        <p></p>
      </div>
      <div>
        <p>
                <b><span style="font-size: 14px">PLANO 03 - LUXO</span></b>
              </p>
              <p></p>
              <ul>
                <li>
                  <span style="font-size: 14px"
                    >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                    silk-screen prateado, guarnição (friso) na tampa, madeira
                    pinnus, tingida na cor nogueira, verniz alto brilho, fundo e
                    tampa de eucatex, 6 (seis) alças parreira, 4 (quatro)
                    chavetas, ambas na cor dourada, forro e babado rendão tecido
                    50g branco, taxas douradas, travesseiro solto. (Marca: De
                    acordo com fornecedor vigente)<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Paramentação conforme o credo religioso;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Velas;<br /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Carro funerário para remoção e sepultamento;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Véu;<br /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Sala de velório, se necessário nas localidades onde o grupo
                    mantém sala;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Decoração de flores naturais e/ou artificiais na urna,
                    conforme a disponibilidade de mercado onde será executado os
                    serviços;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Tanatopraxia (preparação do corpo);<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Transporte de até 150Km.</span>
                </li>
              </ul>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <b><span style="font-size: 16px">ANEXO 02 - TERMO DE ADESÃO</span></b
          >
        </p>
      </div>
      <div>
            <p><b>ADESÃO</b></p>
              <ul>
                <li>
                  Adesão de cremação PAX: R$ ${valorTotalAdesao}
                </li>
              </ul>
              <p></p>
              <p><b>Mensalidade</b></p>
              <ul>
                <li>
                  Mensalidade Adicionada a Mensalidade do Plano: R$ ${valorTotalMensalidade}
                </li>
              </ul>
      </div>
      <div style="text-align: justify">
              <p>
                <span style="font-size: 14px"
                  ><strong>PARTES:</strong>&nbsp;Confirmo,&nbsp;<strong
                    >via assinatura eletrônica</strong
                  >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que
                  estou De Acordo com o presente CONTRATO, e, por estar plenamente
                  ciente dos termos, reafirmo meu dever de observar e fazer
                  cumprir as cláusulas aqui estabelecidas.</span
                >
              </p>
              <p>
                <span style="font-size: 14px"
                  ><strong>TESTEMUNHA:</strong>&nbsp;Confirmo,&nbsp;<strong
                    >via assinatura eletrônica</strong
                  >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a
                  celebração, entre as partes, do CONTRATO.</span
                >
              </p>
            
      </div>
      <div style="text-align: justify">
        <p style="text-align: center; font-size: 14px">
        ${unidadeTratado.municipio} -
        ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
        </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>ANEXO 03 - SERVIÇO ADICIONAL DE CREMAÇÃO HUMANA </b></span
          ><br />
        </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA </b></span
          ><br />
        </p>
      </div>
      <div>
        <p style="text-align: justify"><span style="font-size: 14px"></span></p>
        <div class="edit" style="">
          <p style="">
            <span style="font-size: 14px"
              ><b style="">1.1</b>&nbsp;Em caso de adesão, por parte do
              CONTRATANTE, ao serviço adicional de cremação humana, o aludido
              serviço será regulado pelo presente instrumento, que é parte
              integrante do contrato de prestação de serviços de assistência
              funerária.</span
            >
          </p>
          <p style=""></p>
          <blockquote style="">
            <p style="font-size: 14px">
              <span style="font-size: 14px"
                ><b style="">Parágrafo Único:&nbsp;</b>No caso de adesão ao
                serviço adicional de cremação humana posterior ao contrato de
                prestação de serviços de assistência funerária, o prazo contratual
                é contado em conformidade com a Cláusula 3° do presente
                instrumento.&nbsp;</span
              >
            </p>
          </blockquote>
        </div>
        <p></p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>2. CLÁUSULA SEGUNDA - DO OBJETO </b></span
          >
        </p>
      </div>
    <div>
            <p>
              <span style="font-size: 14px"
                ><b>2.1</b>&nbsp;Constitui objeto do presente instrumento a
                prestação dos serviços especializados de cremação em favor do
                CONTRATANTE ou de qualquer dos beneficiários indicados no termo de
                adesão, a serem executados sob a responsabilidade da CONTRATADA e
                o fornecimento de 01 (uma) urna cinerária padrão, modelo Basic, 23
                cm, 4.600 cm³, chapa galvanizada, ou outro que venha a
                substitui-lo, para armazenamento das cinzas.</span
              >
            </p>
            <p>
              <span style="font-size: 14px"
                ><b>2.2</b>&nbsp;A cremação é um processo moderno, prático e
                ecológico, feito através de fornos crematórios, utilizados
                exclusivamente para esta finalidade. Ao final do processo restam
                apenas as cinzas que são entregues a família ou representante
                legal em uma urna cinerária.</span
              >
            </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>3. CLÁUSULA TERCEIRA - DO PRAZO E CARÊNCIA </b></span
          ><br />
        </p>
      </div>
      <div>
              <p>
                <span style="font-size: 14px"
                  ><b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na
                  data em que houver o efetivo pagamento da taxa de adesão e
                  permanecerá pelo prazo de 60 (sessenta) meses, sendo
                  automaticamente renovado em caso de não manifestação contrária
                  das Partes.</span
                >
              </p>
              <p>
                <span style="font-size: 14px"
                  ><b>3.2</b>&nbsp;Fica pactuado que as pessoas adicionadas terão
                  direito a usufruir do serviço de cremação contratado após a
                  carência de 90 (noventa) dias, contados da data do pagamento
                  integral da taxa de adesão do serviço adicional ou da primeira
                  parcela.<br
                /></span>
              </p>
              <p>
                <span style="font-size: 14px"
                  ><b>3.3</b>&nbsp;Se o contrato for cancelado antes do período
                  descrito na Cláusula 3 – Do Prazo e Carência e havendo a
                  prestação do serviço de cremação, caberá ao CONTRATANTE e aos
                  seus herdeiros o pagamento do residual gasto com o serviço
                  prestado, independente da desvinculação pelo cancelamento
                  contratual.</span
                >
              </p>
              <p>
                <span style="font-size: 14px"
                  ><b>3.4</b>&nbsp;A mensalidade estará sujeita a reajuste anual
                  calculado através da aplicação da variação positiva do IGP-M
                  (Índice Geral de Preços do Mercado) ou outro que venha a
                  substituí-lo. A aplicação do índice poderá ser revista a
                  qualquer tempo, sempre que houver necessidade de recomposição
                  real de perdas inflacionárias não refletidas no índice adotado
                  ou quando a estrutura de custos da CONTRATADA assim o exigir. A
                  aplicação da multa, juros e atualização monetária é automática,
                  inexistindo, de pleno direito, a necessidade de comunicação
                  prévia de qualquer das Partes a outra.</span
                >
              </p>
            
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS </b></span
          ><br />
        </p>
      </div>
      <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                    seguintes serviços:</span
                  >
                </p>
                <p></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >Serviços de atendimento telefônico e auxílio de
                      informações;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Carro Funerário para remoção e cortejo do funeral até o
                      crematório, limitado ao munícipio de Dourados;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Cremação unitária;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Armazenamento em câmara de refrigeração por prazo
                      determinado de 24 horas.</span
                    >
                  </li>
                </ul>
                <p>
                  <span style="font-size: 14px"
                    >Remoção do corpo do local do velório até o local da cremação
                    não terá custo adicional, desde que o percurso esteja dentro
                    da área urbana do município de Dourados.</span
                  >
                </p>
                <p></p>
                <p>
                  <span style="font-size: 14px"
                    >Em caso de armazenamento em câmara de refrigeração além do
                    prazo de 24 horas será cobrado valor adicional.</span
                  >
                </p>
              
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b
              >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
              CREMAÇÃO
            </b></span
          ><br />
        </p>
      </div>
      <div>
                  <p>
                    <span style="font-size: 14px"
                      ><b>5.1</b>&nbsp;Para que o corpo da pessoa falecida por
                      morte natural seja cremado é necessário à apresentação de
                      atestado de óbito assinado por dois médicos ou por um médico
                      legista contendo o número do CRM e o endereço profissional,
                      em via original ou cópia autenticada e a autorização de
                      cremação assinada antecedentemente pela pessoa falecida ou
                      pelo representante legal na forma pública ou
                      particular.</span
                    >
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>5.2</b>&nbsp;A cremação para o caso de morte violenta
                      derivado de crimes ou sob investigação da autoridade será
                      necessário o atestado de óbito assinado por um médico
                      legista contendo o número do registro CRM, endereço
                      profissional em via original ou cópia autenticada e alvará
                      judicial por meio do qual o juiz não se opõe a cremação do
                      corpo.<br
                    /></span>
                  </p>
                  <p>
                    <span style="font-size: 14px"
                      ><b>5.3</b>&nbsp;A cremação de estrangeiros não residentes
                      no país em caso de morte natural é necessária autorização
                      judicial competente, mediante solicitação formulada pelo
                      consulado do país, do qual conste o nome e o cargo de quem a
                      formulou, autorização de cremação, autorização judicial de
                      cremação requerida pelo consulado, xerox dos documentos de
                      identidade e passaporte do falecido.</span
                    >
                  </p>
                
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b
              >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A CREMAÇÃO
            </b></span
          ><br />
        </p>
      </div>
      <div>
                    <p>
                      <span style="font-size: 14px"
                        ><b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as
                        suas expensas, a retirada de todo e qualquer tipo de
                        aparelho ou equipamento que tenha sido implantado no corpo
                        a ser incinerado, tais como, marca passo ou qualquer outro
                        aparelho ou equipamento que se utilize de pilhas ou
                        baterias.</span
                      >
                    </p>
                    <p>
                      <span style="font-size: 14px"
                        ><b>6.2</b>&nbsp;Excepcionalmente, caso seja notada a
                        existência de aparelhos ou equipamentos implantados no
                        corpo a ser cremado, a CONTRATADA poderá a qualquer tempo,
                        recusar-se a prestar o serviço ou, caso não seja detectada
                        a existência dos referidos aparelhos e a cremação acabe
                        sendo realizada, fica o CONTRATANTE, obrigado a reparar
                        integralmente todo e qualquer dano que venha a ser causado
                        em decorrência de tal ato.<br
                      /></span>
                    </p>
                    <p>
                      <span style="font-size: 14px"
                        ><b>6.3</b>&nbsp;A cremação será realizada após o prazo de
                        24 horas do óbito, podendo ser realizada a qualquer tempo,
                        sendo que este período até a cremação, o corpo permanecerá
                        preservado em ambiente refrigerado tecnicamente
                        apropriado.</span
                      >
                    </p>
                    <p>
                      <span style="font-size: 14px"
                        ><b>6.4</b>&nbsp;O CONTRATANTE ou seu responsável legal
                        deverá entrar em contato com a CONTRATADA para fazer o
                        agendamento da cremação logo após o óbito, devendo ser
                        respeitado à agenda de disponibilidade oferecida pela
                        CONTRATADA.</span
                      >
                    </p>
                  
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b>7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS </b></span
          ><br />
        </p>
      </div>
      <div>
                      <p>
                        <span style="font-size: 14px"
                          ><b>7.1</b>&nbsp;O prazo para entrega das cinzas são de
                          até 15 (quinze) dias úteis, contados a partir da
                          cremação, disponibilizadas na secretaria do crematório
                          para serem retiradas, mediante a assinatura de termo de
                          recebimento das cinzas e apresentação de documento de
                          identificação.</span
                        >
                      </p>
                      <p>
                        <span style="font-size: 14px"
                          ><b>7.2&nbsp;</b>Caso a urna com os restos das cinzas
                          não seja retirada no local dentro do prazo descrito
                          acima, a CONTRATADA deixará disponível junto ao
                          columbário pelo prazo de 60 (sessenta) dias
                          ininterruptos, sendo que após essa data será destinado
                          junto à empresa competente.</span
                        >
                      </p>
                    
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p>
                          <span style="font-size: 14px"
                            ><strong>PARTES:</strong>&nbsp;Confirmo,&nbsp;<strong
                              >via assinatura eletrônica</strong
                            >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                            Brasil, que estou De Acordo com o presente CONTRATO,
                            e, por estar plenamente ciente dos termos, reafirmo
                            meu dever de observar e fazer cumprir as cláusulas
                            aqui estabelecidas.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><strong>TESTEMUNHA:</strong
                            >&nbsp;Confirmo,&nbsp;<strong
                              >via assinatura eletrônica</strong
                            >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                            Brasil, a celebração, entre as partes, do CONTRATO.</span
                          >
                        </p>
                      
      </div>
      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
        <p style="text-align: center">
          <span style="font-size: 16px"
            ><b
              >ANEXO 04 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO HUMANA
            </b></span
          ><br />
        </p>
      </div>
      ${htmlCremacao}
      <div>
            <p> <span style="font-size: 14px"
                              ><strong>PARTES:</strong
                              >&nbsp;Confirmo,&nbsp;<strong
                                >via assinatura eletrônica</strong
                              >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                              Brasil, que estou De Acordo com o presente CONTRATO,
                              e, por estar plenamente ciente dos termos, reafirmo
                              meu dever de observar e fazer cumprir as cláusulas
                              aqui estabelecidas.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><strong>TESTEMUNHA:</strong
                              >&nbsp;Confirmo,&nbsp;<strong
                                >via assinatura eletrônica</strong
                              >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                              Brasil, a celebração, entre as partes, do CONTRATO.</span
                            >
                          </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <hr />
        <p></p>
      </div>
      <div>
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
    </body>
  </html>
  
          `;
          } else if (templateID == 2) {
            html = `
          <!DOCTYPE html>
  <html>
    <head>
      <title>Page Title</title>
    </head>
    <body>
      <div>
        <p>
          <b style="font-size: 16px">DECLARAÇÃO DE EXCLUSÃO DE DEPENDENTE</b
          ><br />
        </p>
      </div>
  
      <div style="text-align: justify">
        <p></p>
        <div class="edit">
        <p dir="ltr">
        <span style="font-size: 14px"
          >Contrato nº:${contratoCliente.numContratoAntigo}
      </p>
          <p dir="ltr">
          <span style="font-size: 14px"
            ><span style="color: inherit"></span>Eu,&nbsp;<span
              class="NOME_TITULAR token_d4s"
              >${contratoCliente.nomeTitular}</span
            >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
              class="RG_TITULAR token_d4s"
              >${contratoCliente.rgTitular}</span
            >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
              class="CPF_TITULAR token_d4s"
              >${contratoCliente.cpfTitular}</span
            >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
            LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
            que estou fazendo a <b>EXCLUSÃO</b> dos(as) dependentes PAX(s) que não poderá usufruir de todos os benefícios dos Serviços a partir da data de assinatura deste termo:&nbsp;<span style="color: inherit">&nbsp;</span></span
          >
        </p>
        </div>
      </div>
      ${htmlDependentesHumano}
      <div style="text-align: justify">
        <p></p>
        <div class="edit">
          <p dir="ltr">
            <span style="color: inherit"
              ><span style="font-size: 14px"
                ><i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                >. encontra-se a sua inteira disposição para qualquer
                esclarecimento que se fizer necessário.</span
              ></span
            >
          </p>
          <p dir="ltr"><br /></p>
          <p></p>
        </div>
        <p></p>
      </div>
      <div style="text-align: justify">
        <div class="edit">
          <div class="edit">
            <p><b>Atualização de Cadastro</b></p>
            <p>
              Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
              >&nbsp;&nbsp;
            </p>
            <p>
              E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
              >&nbsp;
            </p>
            <p></p>
            <div class="edit">
              <p>
                Endereço Residencial:&nbsp;<span
                  class="ENDERECO_RESIDENCIAL token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial}</span
                >&nbsp;<br />
              </p>
              <p>
                Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.numeroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Complemento:&nbsp;<span
                  class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.complementoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                  >${contratoCliente.bairroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                  >${contratoCliente.cepResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                  >${contratoCliente.cidadeResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                  >${contratoCliente.estadoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              </hr>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
        <p></p>
      </div>
  
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                      </div>
    </body>
  </html>
  
          `;
          } else {
            return toast.show({
              placement: "top",
              render: () => {
                return <ComponentToast message={`Selecione um template!`} />
              }
            });
          }
        } else if (estado == 'PR') {
          if (templateID == 1) {
            html = `
            <!DOCTYPE html>
    <html>
      <head>
        <title>Page Title</title>
      </head>
      <body>
        <div>
          <p>
            <b style="font-size: 16px">DECLARAÇÃO DE INCLUSÃO DE DEPENDENTE PAX</b
            ><br />
          </p>
        </div>
    
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
          <p dir="ltr">
          <span style="font-size: 14px"
            >Contrato nº:${contratoCliente.numContratoAntigo}
        </p>
            <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>INCLUSÃO</b> dos(as) dependentes PAX(s):&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
          </div>
        </div>
        ${htmlDependentesHumano}
        <div style="text-align: justify">
            <p dir="ltr" style="font-size: 14px">
              <span style="font-size: 14px; color: inherit"></span>Estando ciente de
              que o(a) mesmo(a) terá direito aos&nbsp;benefícios&nbsp;dos serviços
              estabelecidos no contrato a partir da data de assinatura deste termo
              tendo 90 dias de carência para óbito.&nbsp;&nbsp;<br />
            </p>
            <p dir="ltr" style="font-size: 14px">
              <i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                  >. encontra-se a sua inteira disposição para qualquer
                  esclarecimento que se fizer necessário.
            </p>
        </div>
        <div style="text-align: justify">
          <div class="edit">
            <div class="edit">
              <p><b>Atualização de Cadastro</b></p>
              <p>
                Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                  >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
                >&nbsp;
              </p>
              <p></p>
              <div class="edit">
                <p>
                  Endereço Residencial:&nbsp;<span
                    class="ENDERECO_RESIDENCIAL token_d4s"
                    >${contratoCliente.tipoLogradouroResidencial}
                    ${contratoCliente.nomeLogradouroResidencial}</span
                  >&nbsp;<br />
                </p>
                <p>
                  Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.numeroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Complemento:&nbsp;<span
                    class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.complementoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                    >${contratoCliente.bairroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                    >${contratoCliente.cepResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                    >${contratoCliente.cidadeResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                    >${contratoCliente.estadoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                </hr>
              </div>
              <p></p>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
    
        <div>
          <p>
            <span style="font-size: 14px"
              ><strong>PARTES:</strong> Confirmo,
              <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
              MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
              CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
              dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <b
              ><span style="font-size: 16px"
                >ANEXO 01 - DESCRIÇÃO DOS PLANOS FUNERÁRIOS
              </span></b
            ><br />
          </p>
        </div>
        <div>
          <p style="text-align: justify"><span style=""></span></p>
          <div class="edit" style="">
            <p style="font-weight: bold">
              <b style=""><span style="font-size: 14px">PLANO 01 </span></b>
            </p>
            <p style="font-weight: bold"></p>
            <ul style="">
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                    silk-screen prateado, guarnição (friso) na tampa, madeira
                    pinnus, tingida na cor nogueira, verniz alto brilho, fundo e
                    tampa de eucatex, 6 (seis) alças parreira, 4 (quatro) chavetas,
                    ambas na cor dourada, forro e babado rendão tecido 50g branco,
                    taxas douradas, travesseiro solto. (Marca: De acordo com
                    fornecedor vigente)<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >Paramentação conforme o credo religioso;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px">Velas;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >Carro funerário para remoção e sepultamento;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px">Véu;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >Sala de velório, se necessário nas localidades onde o grupo
                    mantém sala;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >Decoração de flores naturais e/ou artificiais na urna, conforme
                    a disponibilidade de mercado onde será executado os serviços;<br /></span
                ></span>
              </li>
              <li style="">
                <span style=""
                  ><span style="font-size: 14px"
                    >Transporte de até 100Km.</span
                  ></span
                >
              </li>
            </ul>
          </div>
          <p></p>
        </div>
        <div style="text-align: justify">
          <p style="text-align: justify"><span></span></p>
          <div class="edit">
            <p style="font-size: 16px; font-weight: bold">
              <span style="font-size: 14px"><b style=""></b></span>
            </p>
            <div class="edit">
              <p>
                <b><span style="font-size: 14px">PLANO 02</span></b>
              </p>
              <p></p>
              <ul>
                <li>
                  <span style="font-size: 14px"
                    >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                    laterais do fundo e tampa entalhada em baixo relevo, 2
                    sobretampos entalhados em alto relevo, guarnição (friso) na
                    tampa, madeira pinnus tingida na cor mogno, verniz alto brilho,
                    fundo Eucatex, 6 fixadores tipo concha com varões, laterais
                    dourados, 9 chavetas fundidas e pintadas na cor dourada, forrada
                    em tecido branco com renda larga, sobre babado (rendão) branco
                    com 20 cm de largura, taxas douradas, visor médio de vidro
                    rodeado por renda larga, travesseiro solto. (Marca: De acordo
                    com fornecedor vigente)<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Paramentação conforme o credo religioso;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Velas;<br /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Carro funerário para remoção e sepultamento;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Véu;<br /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Sala de velório, se necessário nas localidades onde o grupo
                    mantém sala;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Decoração de flores naturais e/ou artificiais na urna, conforme
                    a disponibilidade de mercado onde será executado os serviços;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >01 (uma) coroa de flores grande, naturais e/ou artificiais,
                    conforme a disponibilidade de mercado onde será executado os
                    serviços;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Abertura de jazigo (não se confundindo com o fornecimento de
                    túmulo / gaveta);<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >Tanatopraxia (preparação do corpo);<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px"
                    >01 (uma) veste, disponível na ocasião;<br
                  /></span>
                </li>
                <li>
                  <span style="font-size: 14px">Transporte de até 250Km.</span>
                </li>
              </ul>
            </div>
          </div>
          <p></p>
        </div>
        <div>
          <p>
                  <b><span style="font-size: 14px">PLANO 03</span></b>
                </p>
                <p></p>
                <ul>
                  <li>
                    <span style="font-size: 14px"
                      >URNA MORTUÁRIA: Estilo sextavado com 1,90m internamente,
                      silk-screen prateado, guarnição (friso) na tampa, madeira
                      pinnus, tingida na cor nogueira, verniz alto brilho, fundo e
                      tampa de eucatex, 6 (seis) alças parreira, 4 (quatro)
                      chavetas, ambas na cor dourada, forro e babado rendão tecido
                      50g branco, taxas douradas, travesseiro solto. (Marca: De
                      acordo com fornecedor vigente)<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Paramentação conforme o credo religioso;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Velas;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Carro funerário para remoção e sepultamento;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Véu;<br /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Sala de velório, se necessário nas localidades onde o grupo
                      mantém sala;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Decoração de flores naturais e/ou artificiais na urna,
                      conforme a disponibilidade de mercado onde será executado os
                      serviços;<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px"
                      >Tanatopraxia (preparação do corpo);<br
                    /></span>
                  </li>
                  <li>
                    <span style="font-size: 14px">Transporte de até 150Km.</span>
                  </li>
                </ul>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <b><span style="font-size: 16px">ANEXO 02 - TERMO DE ADESÃO</span></b
            >
          </p>
        </div>
        <div>
              <p><b>ADESÃO</b></p>
                <ul>
                  <li>
                    Adesão de cremação PAX: R$ ${valorTotalAdesao}
                  </li>
                </ul>
                <p></p>
                <p><b>Mensalidade</b></p>
                <ul>
                  <li>
                    Mensalidade Adicionada a Mensalidade do Plano: R$ ${valorTotalMensalidade}
                  </li>
                </ul>
        </div>
        <div style="text-align: justify">
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong>&nbsp;Confirmo,&nbsp;<strong
                      >via assinatura eletrônica</strong
                    >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que
                    estou De Acordo com o presente CONTRATO, e, por estar plenamente
                    ciente dos termos, reafirmo meu dever de observar e fazer
                    cumprir as cláusulas aqui estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong>&nbsp;Confirmo,&nbsp;<strong
                      >via assinatura eletrônica</strong
                    >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a
                    celebração, entre as partes, do CONTRATO.</span
                  >
                </p>
              
        </div>
        <div style="text-align: justify">
          <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} -
          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
          </p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>ANEXO 03 - SERVIÇO ADICIONAL DE CREMAÇÃO HUMANA </b></span
            ><br />
          </p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>1. CLÁUSULA PRIMEIRA - NOTA EXPLICATIVA </b></span
            ><br />
          </p>
        </div>
        <div>
          <p style="text-align: justify"><span style="font-size: 14px"></span></p>
          <div class="edit" style="">
            <p style="">
              <span style="font-size: 14px"
                ><b style="">1.1</b>&nbsp;Em caso de adesão, por parte do
                CONTRATANTE, ao serviço adicional de cremação humana, o aludido
                serviço será regulado pelo presente instrumento, que é parte
                integrante do contrato de prestação de serviços de assistência
                funerária.</span
              >
            </p>
            <p style=""></p>
            <blockquote style="">
              <p style="font-size: 14px">
                <span style="font-size: 14px"
                  ><b style="">Parágrafo Único:&nbsp;</b>No caso de adesão ao
                  serviço adicional de cremação humana posterior ao contrato de
                  prestação de serviços de assistência funerária, o prazo contratual
                  é contado em conformidade com a Cláusula 3° do presente
                  instrumento.&nbsp;</span
                >
              </p>
            </blockquote>
          </div>
          <p></p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>2. CLÁUSULA SEGUNDA - DO OBJETO </b></span
            >
          </p>
        </div>
      <div>
              <p>
                <span style="font-size: 14px"
                  ><b>2.1</b>&nbsp;Constitui objeto do presente instrumento a
                  prestação dos serviços especializados de cremação em favor do
                  CONTRATANTE ou de qualquer dos beneficiários indicados no termo de
                  adesão, a serem executados sob a responsabilidade da CONTRATADA e
                  o fornecimento de 01 (uma) urna cinerária padrão, modelo Basic, 23
                  cm, 4.600 cm³, chapa galvanizada, ou outro que venha a
                  substitui-lo, para armazenamento das cinzas.</span
                >
              </p>
              <p>
                <span style="font-size: 14px"
                  ><b>2.2</b>&nbsp;A cremação é um processo moderno, prático e
                  ecológico, feito através de fornos crematórios, utilizados
                  exclusivamente para esta finalidade. Ao final do processo restam
                  apenas as cinzas que são entregues a família ou representante
                  legal em uma urna cinerária.</span
                >
              </p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>3. CLÁUSULA TERCEIRA - DO PRAZO E CARÊNCIA </b></span
            ><br />
          </p>
        </div>
        <div>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.1</b>&nbsp;O presente ajuste adicional entrará em vigor na
                    data em que houver o efetivo pagamento da taxa de adesão e
                    permanecerá pelo prazo de 60 (sessenta) meses, sendo
                    automaticamente renovado em caso de não manifestação contrária
                    das Partes.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.2</b>&nbsp;Fica pactuado que as pessoas adicionadas terão
                    direito a usufruir do serviço de cremação contratado após a
                    carência de 90 (noventa) dias, contados da data do pagamento
                    integral da taxa de adesão do serviço adicional ou da primeira
                    parcela.<br
                  /></span>
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.3</b>&nbsp;Se o contrato for cancelado antes do período
                    descrito na Cláusula 3 – Do Prazo e Carência e havendo a
                    prestação do serviço de cremação, caberá ao CONTRATANTE e aos
                    seus herdeiros o pagamento do residual gasto com o serviço
                    prestado, independente da desvinculação pelo cancelamento
                    contratual.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><b>3.4</b>&nbsp;A mensalidade estará sujeita a reajuste anual
                    calculado através da aplicação da variação positiva do IGP-M
                    (Índice Geral de Preços do Mercado) ou outro que venha a
                    substituí-lo. A aplicação do índice poderá ser revista a
                    qualquer tempo, sempre que houver necessidade de recomposição
                    real de perdas inflacionárias não refletidas no índice adotado
                    ou quando a estrutura de custos da CONTRATADA assim o exigir. A
                    aplicação da multa, juros e atualização monetária é automática,
                    inexistindo, de pleno direito, a necessidade de comunicação
                    prévia de qualquer das Partes a outra.</span
                  >
                </p>
              
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>4. CLÁUSULA QUARTA - DOS SERVIÇOS OFERECIDOS </b></span
            ><br />
          </p>
        </div>
        <div>
                  <p>
                    <span style="font-size: 14px"
                      ><b>4.1</b>&nbsp;A CONTRATADA, obriga-se a prestar os
                      seguintes serviços:</span
                    >
                  </p>
                  <p></p>
                  <ul>
                    <li>
                      <span style="font-size: 14px"
                        >Serviços de atendimento telefônico e auxílio de
                        informações;<br
                      /></span>
                    </li>
                    <li>
                      <span style="font-size: 14px"
                        >Carro Funerário para remoção e cortejo do funeral até o
                        crematório, limitado ao munícipio de Dourados;<br
                      /></span>
                    </li>
                    <li>
                      <span style="font-size: 14px">Cremação unitária;<br /></span>
                    </li>
                    <li>
                      <span style="font-size: 14px"
                        >Armazenamento em câmara de refrigeração por prazo
                        determinado de 24 horas.</span
                      >
                    </li>
                  </ul>
                  <p>
                    <span style="font-size: 14px"
                      >Remoção do corpo do local do velório até o local da cremação
                      não terá custo adicional, desde que o percurso esteja dentro
                      da área urbana do município de Dourados.</span
                    >
                  </p>
                  <p></p>
                  <p>
                    <span style="font-size: 14px"
                      >Em caso de armazenamento em câmara de refrigeração além do
                      prazo de 24 horas será cobrado valor adicional.</span
                    >
                  </p>
                
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b
                >5. CLÁUSULA QUINTA - DOS DOCUMENTOS PARA PRESTAÇÃO DOS SERVIÇOS DE
                CREMAÇÃO
              </b></span
            ><br />
          </p>
        </div>
        <div>
                    <p>
                      <span style="font-size: 14px"
                        ><b>5.1</b>&nbsp;Para que o corpo da pessoa falecida por
                        morte natural seja cremado é necessário à apresentação de
                        atestado de óbito assinado por dois médicos ou por um médico
                        legista contendo o número do CRM e o endereço profissional,
                        em via original ou cópia autenticada e a autorização de
                        cremação assinada antecedentemente pela pessoa falecida ou
                        pelo representante legal na forma pública ou
                        particular.</span
                      >
                    </p>
                    <p>
                      <span style="font-size: 14px"
                        ><b>5.2</b>&nbsp;A cremação para o caso de morte violenta
                        derivado de crimes ou sob investigação da autoridade será
                        necessário o atestado de óbito assinado por um médico
                        legista contendo o número do registro CRM, endereço
                        profissional em via original ou cópia autenticada e alvará
                        judicial por meio do qual o juiz não se opõe a cremação do
                        corpo.<br
                      /></span>
                    </p>
                    <p>
                      <span style="font-size: 14px"
                        ><b>5.3</b>&nbsp;A cremação de estrangeiros não residentes
                        no país em caso de morte natural é necessária autorização
                        judicial competente, mediante solicitação formulada pelo
                        consulado do país, do qual conste o nome e o cargo de quem a
                        formulou, autorização de cremação, autorização judicial de
                        cremação requerida pelo consulado, xerox dos documentos de
                        identidade e passaporte do falecido.</span
                      >
                    </p>
                  
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b
                >6. CLÁUSULA SEXTA - DOS PROCEDIMENTOS PREPARATÓRIOS PARA A CREMAÇÃO
              </b></span
            ><br />
          </p>
        </div>
        <div>
                      <p>
                        <span style="font-size: 14px"
                          ><b>6.1</b>&nbsp;Caberá ao CONTRATANTE providenciar, as
                          suas expensas, a retirada de todo e qualquer tipo de
                          aparelho ou equipamento que tenha sido implantado no corpo
                          a ser incinerado, tais como, marca passo ou qualquer outro
                          aparelho ou equipamento que se utilize de pilhas ou
                          baterias.</span
                        >
                      </p>
                      <p>
                        <span style="font-size: 14px"
                          ><b>6.2</b>&nbsp;Excepcionalmente, caso seja notada a
                          existência de aparelhos ou equipamentos implantados no
                          corpo a ser cremado, a CONTRATADA poderá a qualquer tempo,
                          recusar-se a prestar o serviço ou, caso não seja detectada
                          a existência dos referidos aparelhos e a cremação acabe
                          sendo realizada, fica o CONTRATANTE, obrigado a reparar
                          integralmente todo e qualquer dano que venha a ser causado
                          em decorrência de tal ato.<br
                        /></span>
                      </p>
                      <p>
                        <span style="font-size: 14px"
                          ><b>6.3</b>&nbsp;A cremação será realizada após o prazo de
                          24 horas do óbito, podendo ser realizada a qualquer tempo,
                          sendo que este período até a cremação, o corpo permanecerá
                          preservado em ambiente refrigerado tecnicamente
                          apropriado.</span
                        >
                      </p>
                      <p>
                        <span style="font-size: 14px"
                          ><b>6.4</b>&nbsp;O CONTRATANTE ou seu responsável legal
                          deverá entrar em contato com a CONTRATADA para fazer o
                          agendamento da cremação logo após o óbito, devendo ser
                          respeitado à agenda de disponibilidade oferecida pela
                          CONTRATADA.</span
                        >
                      </p>
                    
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b>7. CLÁUSULA SÉTIMA - DO PRAZO PARA RETIRADA DAS CINZAS </b></span
            ><br />
          </p>
        </div>
        <div>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.1</b>&nbsp;O prazo para entrega das cinzas são de
                            até 15 (quinze) dias úteis, contados a partir da
                            cremação, disponibilizadas na secretaria do crematório
                            para serem retiradas, mediante a assinatura de termo de
                            recebimento das cinzas e apresentação de documento de
                            identificação.</span
                          >
                        </p>
                        <p>
                          <span style="font-size: 14px"
                            ><b>7.2&nbsp;</b>Caso a urna com os restos das cinzas
                            não seja retirada no local dentro do prazo descrito
                            acima, a CONTRATADA deixará disponível junto ao
                            columbário pelo prazo de 60 (sessenta) dias
                            ininterruptos, sendo que após essa data será destinado
                            junto à empresa competente.</span
                          >
                        </p>
                      
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p>
                            <span style="font-size: 14px"
                              ><strong>PARTES:</strong>&nbsp;Confirmo,&nbsp;<strong
                                >via assinatura eletrônica</strong
                              >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                              Brasil, que estou De Acordo com o presente CONTRATO,
                              e, por estar plenamente ciente dos termos, reafirmo
                              meu dever de observar e fazer cumprir as cláusulas
                              aqui estabelecidas.</span
                            >
                          </p>
                          <p>
                            <span style="font-size: 14px"
                              ><strong>TESTEMUNHA:</strong
                              >&nbsp;Confirmo,&nbsp;<strong
                                >via assinatura eletrônica</strong
                              >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                              Brasil, a celebração, entre as partes, do CONTRATO.</span
                            >
                          </p>
                        
        </div>
        <div>
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <span style="font-size: 16px"
              ><b
                >ANEXO 04 - FICHA DE QUALIFICAÇÃO PARA SERVIÇO DE CREMAÇÃO HUMANA
              </b></span
            ><br />
          </p>
        </div>
        ${htmlCremacao}
        <div>
              <p> <span style="font-size: 14px"
                                ><strong>PARTES:</strong
                                >&nbsp;Confirmo,&nbsp;<strong
                                  >via assinatura eletrônica</strong
                                >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                                Brasil, que estou De Acordo com o presente CONTRATO,
                                e, por estar plenamente ciente dos termos, reafirmo
                                meu dever de observar e fazer cumprir as cláusulas
                                aqui estabelecidas.</span
                              >
                            </p>
                            <p>
                              <span style="font-size: 14px"
                                ><strong>TESTEMUNHA:</strong
                                >&nbsp;Confirmo,&nbsp;<strong
                                  >via assinatura eletrônica</strong
                                >, nos moldes do art. 10 da MP 2.200/01 em vigor no
                                Brasil, a celebração, entre as partes, do CONTRATO.</span
                              >
                            </p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
      </body>
    </html>
    
            `;
          } else if (templateID == 2) {
            html = `
            <!DOCTYPE html>
    <html>
      <head>
        <title>Page Title</title>
      </head>
      <body>
        <div>
          <p>
            <b style="font-size: 16px">DECLARAÇÃO DE EXCLUSÃO DE DEPENDENTE</b
            ><br />
          </p>
        </div>
    
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
          <p dir="ltr">
          <span style="font-size: 14px"
            >Contrato nº:${contratoCliente.numContratoAntigo}
        </p>
            <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>EXCLUSÃO</b> dos(as) dependentes PAX(s) que não poderá usufruir de todos os benefícios dos Serviços a partir da data de assinatura deste termo:&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
          </div>
        </div>
        ${htmlDependentesHumano}
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
            <p dir="ltr">
              <span style="color: inherit"
                ><span style="font-size: 14px"
                  ><i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                  >. encontra-se a sua inteira disposição para qualquer
                  esclarecimento que se fizer necessário.</span
                ></span
              >
            </p>
            <p dir="ltr"><br /></p>
            <p></p>
          </div>
          <p></p>
        </div>
        <div style="text-align: justify">
          <div class="edit">
            <div class="edit">
              <p><b>Atualização de Cadastro</b></p>
              <p>
                Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                  >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
                >&nbsp;
              </p>
              <p></p>
              <div class="edit">
                <p>
                  Endereço Residencial:&nbsp;<span
                    class="ENDERECO_RESIDENCIAL token_d4s"
                    >${contratoCliente.tipoLogradouroResidencial}
                    ${contratoCliente.nomeLogradouroResidencial}</span
                  >&nbsp;<br />
                </p>
                <p>
                  Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.numeroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Complemento:&nbsp;<span
                    class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.complementoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                    >${contratoCliente.bairroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                    >${contratoCliente.cepResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                    >${contratoCliente.cidadeResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                    >${contratoCliente.estadoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                </hr>
              </div>
              <p></p>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
    
        <div>
          <p>
            <span style="font-size: 14px"
              ><strong>PARTES:</strong> Confirmo,
              <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
              MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
              CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
              dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
      </body>
    </html>
    
            `;
          } else {
            return toast.show({
              placement: "top",
              render: () => {
                return <ComponentToast message={`Selecione um template!`} />
              }
            });
          }
        } else {
          if (templateID == 1) {
            html = `
            <!DOCTYPE html>
    <html>
      <head>
        <title>Page Title</title>
      </head>
      <body>
        <div>
          <p>
            <b style="font-size: 16px">DECLARAÇÃO DE INCLUSÃO DE DEPENDENTE PAX</b
            ><br />
          </p>
        </div>
    
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
          <p dir="ltr">
          <span style="font-size: 14px"
            >Contrato nº:${contratoCliente.numContratoAntigo}
        </p>
            <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>INCLUSÃO</b> dos(as) dependentes PAX(s):&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
          </div>
        </div>
        ${htmlDependentesHumano}
        <div style="text-align: justify">
            <p dir="ltr" style="font-size: 14px">
              <span style="font-size: 14px; color: inherit"></span>Estando ciente de
              que o(a) mesmo(a) terá direito aos&nbsp;benefícios&nbsp;dos serviços
              estabelecidos no contrato a partir da data de assinatura deste termo
              tendo 90 dias de carência para óbito.&nbsp;&nbsp;<br />
            </p>
            <p dir="ltr" style="font-size: 14px">
              <i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                  >. encontra-se a sua inteira disposição para qualquer
                  esclarecimento que se fizer necessário.
            </p>
        </div>
        <div style="text-align: justify">
          <div class="edit">
            <div class="edit">
              <p><b>Atualização de Cadastro</b></p>
              <p>
                Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                  >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
                >&nbsp;
              </p>
              <p></p>
              <div class="edit">
                <p>
                  Endereço Residencial:&nbsp;<span
                    class="ENDERECO_RESIDENCIAL token_d4s"
                    >${contratoCliente.tipoLogradouroResidencial}
                    ${contratoCliente.nomeLogradouroResidencial}</span
                  >&nbsp;<br />
                </p>
                <p>
                  Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.numeroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Complemento:&nbsp;<span
                    class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.complementoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                    >${contratoCliente.bairroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                    >${contratoCliente.cepResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                    >${contratoCliente.cidadeResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                    >${contratoCliente.estadoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                </hr>
              </div>
              <p></p>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
    
        <div>
          <p>
            <span style="font-size: 14px"
              ><strong>PARTES:</strong> Confirmo,
              <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
              MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
              CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
              dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
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
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
        <div>
          <p style="text-align: center">
            <b><span style="font-size: 16px">ANEXO 02 - TERMO DE ADESÃO</span></b
            >
          </p>
        </div>
        <div>
              <p><b>ADESÃO</b></p>
                <ul>
                  <li>
                    Adesão de cremação PAX: R$ ${valorTotalAdesao}
                  </li>
                </ul>
                <p></p>
                <p><b>Mensalidade</b></p>
                <ul>
                  <li>
                    Mensalidade Adicionada a Mensalidade do Plano: R$ ${valorTotalMensalidade}
                  </li>
                </ul>
        </div>
        <div style="text-align: justify">
                <p>
                  <span style="font-size: 14px"
                    ><strong>PARTES:</strong>&nbsp;Confirmo,&nbsp;<strong
                      >via assinatura eletrônica</strong
                    >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, que
                    estou De Acordo com o presente CONTRATO, e, por estar plenamente
                    ciente dos termos, reafirmo meu dever de observar e fazer
                    cumprir as cláusulas aqui estabelecidas.</span
                  >
                </p>
                <p>
                  <span style="font-size: 14px"
                    ><strong>TESTEMUNHA:</strong>&nbsp;Confirmo,&nbsp;<strong
                      >via assinatura eletrônica</strong
                    >, nos moldes do art. 10 da MP 2.200/01 em vigor no Brasil, a
                    celebração, entre as partes, do CONTRATO.</span
                  >
                </p>
              
        </div>
        <div style="text-align: justify">
          <p style="text-align: center; font-size: 14px">
          ${unidadeTratado.municipio} -
          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
          </p>
        </div>
        <div style="text-align: justify">
          <p></p>
          <hr />
          <p></p>
        </div>
      </body>
    </html>
    
            `;
          } else if (templateID == 2) {
            html = `
            <!DOCTYPE html>
    <html>
      <head>
        <title>Page Title</title>
      </head>
      <body>
        <div>
          <p>
            <b style="font-size: 16px">DECLARAÇÃO DE EXCLUSÃO DE DEPENDENTE</b
            ><br />
          </p>
        </div>
    
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
          <p dir="ltr">
          <span style="font-size: 14px"
            >Contrato nº:${contratoCliente.numContratoAntigo}
        </p>
            <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>EXCLUSÃO</b> dos(as) dependentes PAX(s) que não poderá usufruir de todos os benefícios dos Serviços a partir da data de assinatura deste termo:&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
          </div>
        </div>
        ${htmlDependentesHumano}
        <div style="text-align: justify">
          <p></p>
          <div class="edit">
            <p dir="ltr">
              <span style="color: inherit"
                ><span style="font-size: 14px"
                  ><i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                  >. encontra-se a sua inteira disposição para qualquer
                  esclarecimento que se fizer necessário.</span
                ></span
              >
            </p>
            <p dir="ltr"><br /></p>
            <p></p>
          </div>
          <p></p>
        </div>
        <div style="text-align: justify">
          <div class="edit">
            <div class="edit">
              <p><b>Atualização de Cadastro</b></p>
              <p>
                Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                  >${contratoCliente.telefone1 == "null" ? "" :
                contratoCliente.telefone1}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                contratoCliente.email1}</span
                >&nbsp;
              </p>
              <p></p>
              <div class="edit">
                <p>
                  Endereço Residencial:&nbsp;<span
                    class="ENDERECO_RESIDENCIAL token_d4s"
                    >${contratoCliente.tipoLogradouroResidencial}
                    ${contratoCliente.nomeLogradouroResidencial}</span
                  >&nbsp;<br />
                </p>
                <p>
                  Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.numeroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Complemento:&nbsp;<span
                    class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                    >${contratoCliente.complementoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                    >${contratoCliente.bairroResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                    >${contratoCliente.cepResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                    >${contratoCliente.cidadeResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                <p>
                  U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                    >${contratoCliente.estadoResidencial}</span
                  >&nbsp;&nbsp;
                </p>
                </hr>
              </div>
              <p></p>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
    
        <div>
          <p>
            <span style="font-size: 14px"
              ><strong>PARTES:</strong> Confirmo,
              <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
              MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
              CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
              dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                          <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                          </p>
                        </div>
      </body>
    </html>
    
            `;
          } else {
            return toast.show({
              placement: "top",
              render: () => {
                return <ComponentToast message={`Selecione um template!`} />
              }
            });
          }
        }
      } else {
        if (templateID == 1) {
          html = `
                  <!DOCTYPE html>
  <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div>
        <p>
          <b style="font-size: 16px">DECLARAÇÃO DE INCLUSÃO DE DEPENDENTE PET</b
          ><br />
        </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <div class="edit">
          <p dir="ltr">
            <span style="font-size: 14px"
              >Contrato nº:${contratoCliente.numContratoAntigo}
          </p>
          <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>INCLUSÃO</b> dos(as) dependentes
              PET(s):&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
        </div>
      </div>
      ${htmlDependentesPet}
      <div style="text-align: justify">
        <div class="edit">
          <p dir="ltr" style="font-size: 14px">
            <span style="font-size: 14px; color: inherit"></span>Estando ciente de
            que o(a) mesmo(a) terá direito aos&nbsp;benefícios&nbsp;dos serviços
            estabelecidos no contrato a partir da data de assinatura deste termo
            tendo 90 dias de carência para óbito.&nbsp;&nbsp;<br />
          </p>
          <p dir="ltr">
            <span style="color: inherit"
              ><span style="font-size: 14px"
                ><i><u>A Empresa Pax Primavera Serviços Póstumos Ltda</u></i
                >. encontra-se a sua inteira disposição para qualquer
                esclarecimento que se fizer necessário.</span
              ></span
            >
          </p>
        </div>
      </div>
      <div style="text-align: justify">
        <div class="edit">
          <div class="edit">
            <p><b>Atualização de Cadastro</b></p>
            <p>
              Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                >${contratoCliente.telefone1 == "null" ? "" :
              contratoCliente.telefone1}</span
              >&nbsp;&nbsp;
            </p>
            <p>
              E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
              contratoCliente.email1}</span
              >&nbsp;
            </p>
            <p></p>
            <div class="edit">
              <p>
                Endereço Residencial:&nbsp;<span
                  class="ENDERECO_RESIDENCIAL token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial}</span
                >&nbsp;<br />
              </p>
              <p>
                Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.numeroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Complemento:&nbsp;<span
                  class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.complementoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                  >${contratoCliente.bairroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                  >${contratoCliente.cepResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                  >${contratoCliente.cidadeResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                  >${contratoCliente.estadoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              </hr>
              <p><b>ADESÃO</b></p>
              <p></p>
              <ul>
                <li>
                  Adesão de cremação PET: R$ ${adesaoPet}
                </li>
              </ul>
              <p></p>
              <p><b>Mensalidade</b></p>
              <p></p>
              <ul>
                <li>
                  Mensalidade Adicionada a Mensalidade do Plano: R$ ${mensalidadePet}
                  
                </li>
              </ul>
              <p></p>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf},${contratoCliente.dataContrato}
                        </p>
                      </div>
    </body>
  </html>
  
                  `
        } else if (templateID == 2) {
          html = `
                  <!DOCTYPE html>
  <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div>
        <p>
          <b style="font-size: 16px">DECLARAÇÃO DE EXCLUSÃO DE DEPENDENT PET</b
          ><br />
        </p>
      </div>
      <div style="text-align: justify">
        <p></p>
        <div class="edit">
          <p dir="ltr">
            <span style="font-size: 14px"
              >Contrato nº:${contratoCliente.numContratoAntigo}
          </p>
          <p dir="ltr">
            <span style="font-size: 14px"
              ><span style="color: inherit"></span>Eu,&nbsp;<span
                class="NOME_TITULAR token_d4s"
                >${contratoCliente.nomeTitular}</span
              >&nbsp;&nbsp;&nbsp;, devidamente inscrito no RG nº:&nbsp;<span
                class="RG_TITULAR token_d4s"
                >${contratoCliente.rgTitular}</span
              >&nbsp;&nbsp;&nbsp; e CPF nº:&nbsp;<span
                class="CPF_TITULAR token_d4s"
                >${contratoCliente.cpfTitular}</span
              >&nbsp;&nbsp;, associado da Empresa Pax Primavera Serviços Póstumos
              LTDA,&nbsp;declaro para fins de comprovação a quem possa interessar
              que estou fazendo a <b>EXCLUSÃO</b> dos(as) dependentes PET(s) que não poderá usufruir de todos os benefícios dos Serviços a partir da data de assinatura deste termo:&nbsp;<span style="color: inherit">&nbsp;</span></span
            >
          </p>
        </div>
      </div>
      ${htmlDependentesPet}
      <div style="text-align: justify">
        <div class="edit">
          <div class="edit">
            <p><b>Atualização de Cadastro</b></p>
            <p>
              Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s"
                >${contratoCliente.telefone1 == "null" ? "" :
              contratoCliente.telefone1}</span
              >&nbsp;&nbsp;
            </p>
            <p>
              E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
              contratoCliente.email1}</span
              >&nbsp;
            </p>
            <p></p>
            <div class="edit">
              <p>
                Endereço Residencial:&nbsp;<span
                  class="ENDERECO_RESIDENCIAL token_d4s"
                  >${contratoCliente.tipoLogradouroResidencial}
                  ${contratoCliente.nomeLogradouroResidencial}</span
                >&nbsp;<br />
              </p>
              <p>
                Número:&nbsp;<span class="NUMERO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.numeroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Complemento:&nbsp;<span
                  class="COMPLEMENTO_END_RESIDENCIAL token_d4s"
                  >${contratoCliente.complementoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Bairro:&nbsp;<span class="BAIRRO_RESIDENCIAL token_d4s"
                  >${contratoCliente.bairroResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                CEP:&nbsp;<span class="CEP_RESIDENCIAL token_d4s"
                  >${contratoCliente.cepResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                Cidade:&nbsp;<span class="CIDADE_RESIDENCIAL token_d4s"
                  >${contratoCliente.cidadeResidencial}</span
                >&nbsp;&nbsp;
              </p>
              <p>
                U.F:&nbsp;<span class="ESTADO_RESIDENCIAL token_d4s"
                  >${contratoCliente.estadoResidencial}</span
                >&nbsp;&nbsp;
              </p>
              </hr>
            </div>
            <p></p>
          </div>
          <p></p>
        </div>
        <p></p>
      </div>
      <div>
        <p>
          <span style="font-size: 14px"
            ><strong>PARTES:</strong> Confirmo,
            <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
            MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
            CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
            dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span
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
                        <p style="text-align: center; font-size: 14px">
                          ${unidadeTratado.municipio} -
                          ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
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
      }
      setCarregamentoButton(false);
      return navigation.navigate("contratoContentAssinatura", { contratoID, anexos, html });
    } catch (e) {
      setCarregamentoButton(false);
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`Não foi possivel enviar contrato, contate o suporte: ${e.toString()}`} />
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
    setup();
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
            <HStack mt="2" space={2} justifyContent="center">
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
                    {templates.map((item) => (
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
              mt="6"
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

export { ContratoContentFinalizarAdicional }