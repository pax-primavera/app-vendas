import React from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert
} from "react-native";
import { Button } from "native-base";
import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { useRef } from "react";
import SignatureScreen from "react-native-signature-canvas";
import {
  styleButtonText,
  styleButton,
} from "../utils/styles/index";
import { StatusBar } from "expo-status-bar";

function ContratoContentAssinar({ navigation }) {
  const route = useRoute();

  const { contratoID, anexos, id, html } = route.params;
  const ref = useRef();
  const [assinaturaCliente, setAssinaturaCliente] = useState("");

  // Called after ref.current.readSignature() reads a non-empty base64 string
  const handleOK = (signature) => {
    setAssinaturaCliente(signature);
    // Callback from Component props
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
    setAssinaturaCliente(signature);
    Alert.alert(
      "Aviso.",
      "Assinatura salva com sucesso!\n\n",
    );
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
      marginTop: 15
    },
  });

  const PROSSEGUIR = async () => {
    const htmlSignatureCliente = `
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
      <img style="width:30%;height:30%; border-bottom: 1px solid black;" src=${assinaturaCliente}></br>
      <figcaption>Assinatura do Contratante</figcaption>
      </figure>
      </center>
      </body>
      </html>`;
    const htmlCliente = html + `${htmlSignatureCliente}`;
    if (assinaturaCliente == "") {
      Alert.alert("Aviso.", "O cliente precisa assinar o contrato para prosseguir!");
      return;
    } else {
      return navigation.navigate("ContratoContentAssinarVendedor", { contratoID, anexos, id, htmlCliente });

    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SignatureScreen
        ref={ref}
        canvasStyle={{ borderWidth: 1, borderColor: 'grey' }}
        onEnd={handleEnd}
        onOK={handleOK}
        confirmText={""}
        onPress={false}
        onEmpty={handleEmpty}
        onClear={handleClear}
        clearText={"Limpar"}
        onGetData={handleData}
        descriptionText="Assinatura do Cliente"
        //rotated={true}
        webStyle={`.m-signature-pad--footer
        .description {
          color: black;
          text-align: center;
          font-size: 2.0em;
          margin-top: 0.5em;
        };

        .button {
          position: absolute;
          bottom: 0;
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
      <Image style={{ width: 600, height: 300 }} source={{ uri: assinaturaCliente ? assinaturaCliente : null }} />
      <Button
        mt="6"
        mb="4"
        size="lg"
        _text={styleButtonText}
        _light={styleButton}
        isDisabled={!assinaturaCliente}
        onPress={PROSSEGUIR}
      >
        COLETAR ASSINATURA DO VENDEDOR
      </Button>
    </View>
  );
}

export { ContratoContentAssinar };
