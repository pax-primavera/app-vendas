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
import { templateVencimento } from "../utils/generic/data";
import moment from 'moment';

function ContratoContentFinalizarVencimento({ navigation }) {
    /// Config
    const route = useRoute();
    const toast = useToast();
    /// Parametros
    const { contratoID, unidadeID, anexos, id } = route.params;
    const [templateID, setTemplateID] = useState(null);
    /// Booleanos
    const [carregamentoTela, setCarregamentoTela] = useState(false);
    const [carregamentoButton, setCarregamentoButton] = useState(false);
    const [desabilitaContrato, setDesabilitaContrato] = useState(false);
    const ref = useRef();

    const trimObject = (data) => {
        for (var property in data) {
            if (typeof data[property] === "string") {
                data[property] = data[property].trim();
            }
        }
        return data;
    };

    const finalizarContrato = async () => {
        setCarregamentoButton(true);

        try {
            if (!templateID) {
                Alert.alert("Aviso.", "Selecione um template!");
                return;
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

            const contratoCliente = {
                ...contratoTratado,
            };

            const contratoBody = new FormData();

            contratoBody.append("body", JSON.stringify(contratoCliente));

            if (templateID == 1) {
                await executarSQL(`
              UPDATE titular
              SET 
              tipo = 'ALTERAÇÃO DE DATA DE VENCIMENTO',
              unidadeId = ${unidadeID}
              WHERE id = ${contratoID}`);

            }
            let html;
            if (templateID == 1) {
                html =
                    `<!DOCTYPE html>
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
                            <b style="font-size: 16px">SOLICITAÇÃO DE MUDANÇA DE DATA DE VENCIMENTO</b><br />
                        </p>
                    </div>
                    <div style="text-align: justify">
                        <p></p>
                        <div class="edit">
                            <p dir="ltr">
                                <span style="font-size: 14px">Contrato nº:${contratoCliente.numContratoAntigo}
                            </p>
                            <p dir="ltr">
                                <span style="font-size: 14px"><span style="color: inherit"></span>Eu,&nbsp;<span
                                        class="NOME_TITULAR token_d4s">${contratoCliente.nomeTitular}</span>&nbsp;&nbsp;&nbsp;,
                                    devidamente inscrito no RG nº:&nbsp;<span
                                        class="RG_TITULAR token_d4s">${contratoCliente.rgTitular}</span>&nbsp;&nbsp;&nbsp; e CPF
                                    nº:&nbsp;<span class="CPF_TITULAR token_d4s">${contratoCliente.cpfTitular}</span>&nbsp;&nbsp;,
                                    associado da Empresa Pax Primavera Serviços Póstumos
                                    LTDA,&nbsp;solicito a mudança de data de vencimento do meu contrato do dia: <b>${contratoCliente.dataVencimentoAtual}</b>
                                    para o dia: <b>${contratoCliente.dataVencimento}</b>.&nbsp;<span style="color: inherit">&nbsp;</span></span>
                            </p>
                        </div>
                    </div>
                    <div style="text-align: justify">
                            <p dir="ltr">
                                <span style="color: inherit"><span style="font-size: 14px"><i><u>A Empresa Pax Primavera Serviços
                                                Póstumos Ltda</u></i>. encontra-se a sua inteira disposição para qualquer
                                        esclarecimento que se fizer necessário.</span></span>
                            </p>
                    </div>
                    <div style="text-align: justify">
                        <div class="edit">
                            <div class="edit">
                                <p><b>Atualização de Cadastro</b></p>
                                <p>
                                    Telefone 01:&nbsp;<span class="TELEFONE_01 token_d4s">${contratoCliente.telefone1 == "null" ? "" :
                        contratoCliente.telefone1}</span>&nbsp;&nbsp;
                                </p>
                                <p>
                                    E-mail 01:&nbsp;<span class="EMAIL_01 token_d4s">${contratoCliente.email1 == "null" ? "" :
                        contratoCliente.email1}</span>&nbsp;
                                </p>
                                <p>
                                        Endereço Residencial:&nbsp;<span
                                            class="ENDERECO_RESIDENCIAL token_d4s">${contratoCliente.tipoLogradouroResidencial}
                                            ${contratoCliente.nomeLogradouroResidencial}</span>
                                    </p>
                                    <p>
                                        Número:&nbsp;<span
                                            class="NUMERO_END_RESIDENCIAL token_d4s">${contratoCliente.numeroResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    <p>
                                        Complemento:&nbsp;<span
                                            class="COMPLEMENTO_END_RESIDENCIAL token_d4s">${contratoCliente.complementoResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    <p>
                                        Bairro:&nbsp;<span
                                            class="BAIRRO_RESIDENCIAL token_d4s">${contratoCliente.bairroResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    <p>
                                        CEP:&nbsp;<span
                                            class="CEP_RESIDENCIAL token_d4s">${contratoCliente.cepResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    <p>
                                        Cidade:&nbsp;<span
                                            class="CIDADE_RESIDENCIAL token_d4s">${contratoCliente.cidadeResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    <p>
                                        U.F:&nbsp;<span
                                            class="ESTADO_RESIDENCIAL token_d4s">${contratoCliente.estadoResidencial}</span>&nbsp;&nbsp;
                                    </p>
                                    </hr>
                            </div>
                            <p></p>
                        </div>
                        <p></p>
                    </div>
                    <div>
                        <p>
                            <span style="font-size: 14px"><strong>PARTES:</strong> Confirmo,
                                <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                                MP 2.200/01 em vigor no Brasil, que estou De Acordo com o presente
                                CONTRATO, e, por estar plenamente ciente dos termos, reafirmo meu
                                dever de observar e fazer cumprir as cláusulas aqui estabelecidas.</span>
                        </p>
                        <p>
                            <span style="font-size: 14px"><strong>TESTEMUNHA:</strong> Confirmo,
                                <strong>via assinatura eletrônica</strong>, nos moldes do art. 10 da
                                MP 2.200/01 em vigor no Brasil, a celebração, entre as partes, do
                                CONTRATO.</span>
                        </p>
                    </div>
                    <hr>
                    <div>
                        <p style="text-align: center; font-size: 14px">
                            ${unidadeTratado.municipio} -
                            ${unidadeTratado.uf}, ${contratoCliente.dataContrato}
                        </p>
                    </div>
                </body>
                
                </html>`
            } else {
                return toast.show({
                    placement: "top",
                    render: () => {
                        return <ComponentToast message={`Selecione um template!`} />
                    }
                });
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
                            <Center m="2" w="100%" rounded="md">
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
                                        {templateVencimento.map((item) => (
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

export { ContratoContentFinalizarVencimento }