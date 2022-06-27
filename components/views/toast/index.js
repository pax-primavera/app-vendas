import { Box, Text } from "native-base";
import colors from '../../../utils/styles/colors.js'

function ComponentToast(props) {
    const { title, message } = props;

    return (
        <Box bg={colors.COLORS.WHITE} shadow="2" p="5" rounded="5" >
            <Text fontWeight="bold" >
                <Text fontWeight="bold" color={colors.COLORS.PAXCOLOR_1}>{title}: </Text>{message}
            </Text>
        </Box>
    );
}

export default ComponentToast;