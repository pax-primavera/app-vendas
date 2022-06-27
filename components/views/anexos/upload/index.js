import React, { useState } from 'react';
import { styleButtonAdd, styleButtonTextAdd, containerFoto } from '../../../../utils/styles/index';
import { Button, Icon, VStack, Text } from "native-base";
import colors from '../../../../utils/styles/colors';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";

function ComponentUpload(props) {
  const [image, setImage] = useState(null);
  const { title, message } = props;

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false
    });

    if (!result.cancelled) {
      setImage(result);
    }

    if (props && props.function) {
      props.function(result)
    }
  };

  return (
    <VStack style={containerFoto}>
      <VStack pl="5" pr="5">
        <Text fontWeight="bold">{message}
          {
            !image ?
              <Text fontWeight="bold" color="red.800">- Não preenchido</Text> :
              <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>- Preenchido</Text>
          }
        </Text>
      </VStack>
      <Button size="lg"
        m="5"
        leftIcon={<Icon as={Ionicons}
          name="camera-sharp" size="lg" color={colors.COLORS.PAXCOLOR_1} />}
        _light={styleButtonAdd}
        _text={styleButtonTextAdd}
        variant="outline"
        onPress={() => pickImage()}
      >
        {title}
      </Button>
    </VStack>
  )
}

export default ComponentUpload;

