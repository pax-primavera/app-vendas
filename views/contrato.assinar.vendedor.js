import React, { useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Button, useToast } from "native-base";
import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { useRef } from "react";
import SignatureScreen from "react-native-signature-canvas";
import * as Sharing from "expo-sharing";
import { printToFileAsync } from "expo-print";
import { styleButtonText, styleButton } from "../utils/styles/index";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import ComponentLoading from "../components/views/loading/index";
import { StorageAccessFramework } from 'expo-file-system';
import ComponentToast from "../components/views/toast/index";
import { executarSQL } from "../services/database/index.js";

function ContratoContentAssinarVendedor({ navigation }) {
  const route = useRoute();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const { contratoID, unidadeID, anexos, id, htmlCliente } = route.params;
  const ref = useRef();
  const [assinaturaVendedor, setAssinaturaVendedor] = useState("");
  const [carregamentoButton, setCarregamentoButton] = useState(false);

  // Called after ref.current.readSignature() reads a non-empty base64 string
  const handleOK = (signature) => {
    setAssinaturaVendedor(signature); // Callback from Component props
  };

  // Called after ref.current.readSignature() reads an empty string
  const handleEmpty = () => {
    console.log("Empty");
  };

  // Called after ref.current.clearSignature()
  const handleClear = () => {
    console.log("clear success!");
  };

  // Called after end of stroke
  const handleEnd = () => {
    ref.current.readSignature();
  };

  // Called after ref.current.getData()
  const handleData = (signature) => {
    setAssinaturaVendedor(signature);
    Alert.alert("Aviso.", "Assinatura salva com sucesso!\n\n");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: 250,
      padding: 10,
    },
    preview: {
      width: 335,
      height: 114,
      backgroundColor: "#F8F8F8",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 15,
    },
  });

  const trimObject = (data) => {
    for (var property in data) {
      if (typeof data[property] === "string") {
        data[property] = data[property].trim();
      }
    }
    return data;
  };

  const finalizarContrato = async (file) => {
    setCarregamentoButton(true);
    if (id != null) {
      await executarSQL(`UPDATE titular SET status = 1, anexo8 = '${file}' where id = ${id}`);
    } else {
      await executarSQL(`UPDATE titular SET status = 1, anexo8 = '${file}' where id = ${contratoID}`);
    }

    try {
      Alert.alert(
        "Aviso.",
        "Contrato 'SALVO' Localmente com Sucesso!",
        [
          {
            text: "Ok",

            onPress: async () => {
              setCarregamentoButton(false);
            }
          },

        ],
        { cancelable: false }
      );
    } catch (e) {
      setCarregamentoButton(false);
      toast.show({
        placement: "top",
        render: () => {
          return <ComponentToast message={`Não foi possivel salvar contrato, contate o suporte: ${e.toString()}`} />
        }
      });
    }
  };

  const finalizar = async () => {
    setLoading(true);
    const htmlSignature = `
    <html>
    <head>
    <style>
    figure {
      padding: 4px;
      margin: center;
    }
    figcaption {
      padding: 8px;
      text-align: center;
    }
    </style>
    </head>
    <body>
    <center>
    <figure>
      <img style="width:30%;height:30%; border-bottom: 1px solid black;"src=${assinaturaVendedor}>
      <figcaption>Assinatura do Contratado</figcaption>
      </figure>
      </center>
      </body>
      </html>`;
    const htmlVendedor = htmlCliente + `${htmlSignature}`;

    Alert.alert(
      "Aviso.",
      "Deseja 'FINALIZAR' o contrato ? \n\n",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "FINALIZAR",

          onPress: async () => {
            const file = await printToFileAsync({
              html: htmlVendedor,
              base64: true,
            });

            if (assinaturaVendedor == "") {
              Alert.alert("Aviso.", "O Vendedor precisa assinar o contrato para Finalizar!");
              return;
            } else {
              finalizarContrato(file.base64);
              setCarregamentoButton(false)
              return navigation.navigate("Home");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  useEffect(() => {
    setCarregamentoButton(false)
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SignatureScreen
        ref={ref}
        canvasStyle={{ borderWidth: 1, borderColor: "grey" }}
        onEnd={handleEnd}
        onOK={handleOK}
        confirmText={"Confirmar"}
        onEmpty={handleEmpty}
        onClear={handleClear}
        clearText={"Limpar"}
        onGetData={handleData}
        descriptionText="Assinatura do Vendedor"
        //rotated={true}
        webStyle={`.m-signature-pad--footer
        .description {
          color: #C3C3C3;
          text-align: center;
          font-size: 1.2em;
          margin-top: 1.8em;
        };
        .button {
          position: absolute;
          bottom: 0;
          background-color: green;
          width: 100px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          color: #FFF;
        }

        .m-signature-pad {
          position: absolute;
          font-size: 10px;
          width: 850px;
          height: 520px;
          top: 50%;
          left: 50%;
          margin-left: -350px;
          margin-top: -200px;
          border: 5px solid #e8e8e8;
          background-color: #fff;
          box-shadow: 1px 4px rgba(0, 0, 0, 0.27), 0 0 40px rgba(0, 0, 0, 0.08) inset;
        };
        `}
      />
      <Image
        style={{ width: 600, height: 300 }}
        source={{ uri: assinaturaVendedor ? assinaturaVendedor : null }}
      />
      <Button
        mt="6"
        mb="2"
        size="lg"
        _text={styleButtonText}
        isDisabled={!assinaturaVendedor}
        isLoading={carregamentoButton}
        isLoadingText="Finalizando"
        _light={styleButton}
        onPress={finalizar}
      >
        FINALIZAR
      </Button>
    </View>
  );
}

export { ContratoContentAssinarVendedor };
