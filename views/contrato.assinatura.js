import React, { useLayoutEffect, useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import {
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text, Icon, Box, VStack, useToast } from "native-base";
import colors from "../utils/styles/colors.js";
import { useRoute } from "@react-navigation/native";
import ComponentLoading from '../components/views/loading/index';

import RenderHTML from "react-native-render-html";
import {
  web,
  light,
  styleButtonText,
  styleButton,
} from "../utils/styles/index";

const ContratoContentAssinatura = ({ navigation }) => {
  const route = useRoute();
  const toast = useToast();

  const { contratoID, html, id, anexos } = route.params;
  const { width } = useWindowDimensions();
  const [carregamentoTela, setCarregamentoTela] = useState(true);


  const finalizar = async () => {
    return navigation.navigate("ContratoContentAssinar", { contratoID, anexos, id, html });
  };
  useEffect(() => {

  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <VStack m="2">
        <Box
          key="1"
          safeArea
          w="100%"
          pl="5"
          pr="5"
          mb="1"
          pb="2"
          maxW="100%"
          rounded="lg"
          overflow="hidden"
          borderColor="coolGray.200"
          borderWidth="1"
          _light={light}
          _web={web}
        >
          <RenderHTML style={{ flex: 5, padding: 50 }} contentWidth={width} source={{ html }} />
          <Button mt="6"
            mb="2"
            size="lg"
            _text={styleButtonText}
            //isDisabled={!isAceitoTermo}
            //isLoading={carregamentoButton}
            isLoadingText="Enviando"
            _light={styleButton}
            onPress={finalizar}
          >
            COLETAR ASSINATURA DO CLIENTE
          </Button>
        </Box>
      </VStack>
    </ScrollView>
  );
};

export { ContratoContentAssinatura };
