import React, { useState } from 'react';
import { VStack, Heading, Box } from "native-base";
import colors from "../../../utils/styles/colors";
import ComponentUpload from './upload/index';

function CompenentAddAnexos(props) {
    const [anexos, setAnexos] = useState([]);

    let updateAnexosItems = (value) => {
        let anexosPrev = anexos;
        anexosPrev.push(value);
        setAnexos(anexosPrev);

        if (props && props.function) {
            props.function(anexos)
        }
    }

    return (
        <VStack m="2">
            <Box w="100%" pl="5" pr="5">
                <Heading mt="3" size="lg" fontWeight="900" color={colors.COLORS.PAXCOLOR_1} >
                    Anexos
                </Heading>
                <Heading mt="2" mb="1" fontWeight="medium" size="sm">
                    Informe todas as informações corretamente!
                </Heading>
            </Box>
            <VStack >
                <ComponentUpload
                    title="FOTO DA FRENTE DO DOCUMENTO"
                    message="Fotografe a frente do documento de identidade do cliente."
                    function={updateAnexosItems}
                />
                <ComponentUpload
                    title="FOTO DO VERSO DO DOCUMENTO"
                    message="Fotografe o verso do documento de identidade do cliente."
                    function={updateAnexosItems}
                />
                <ComponentUpload
                    title="FOTO DE PERFIL DO DOCUMENTO"
                    message="Fotografe o cliente de perfil. PEÇA AUTORIZAÇÃO DELE ANTES"
                    function={updateAnexosItems}
                />
            </VStack>
        </VStack>
    );
}

export default CompenentAddAnexos;