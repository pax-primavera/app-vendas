import { Heading, HStack, Spinner } from "native-base";
import colors from "../../../utils/styles/colors";

function ComponentLoading(props) {
    const { mensagem } = props;

    return (
        <HStack space={2} m="5" flexDirection="column" justifyContent="center" alignItems="center">
            <Spinner color={colors.COLORS.PAXCOLOR_1} size="lg" accessibilityLabel={mensagem} />
            <Heading mt="2" color={colors.COLORS.PAXCOLOR_1}  fontSize="md">
                {mensagem}
            </Heading>
        </HStack>
    );
}

export default ComponentLoading;