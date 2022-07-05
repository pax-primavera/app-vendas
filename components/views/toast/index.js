import { Box, Text, Heading } from "native-base";
import colors from '../../../utils/styles/colors.js'

function ComponentToast(props) {
    const { title, message } = props;

    return (
        <Box bg={colors.COLORS.PAXCOLOR_1} shadow="2" p="5" rounded="5" ml="2" mr="2">
            <Heading size="sm" fontWeight="bold" color={colors.COLORS.WHITE}>
                {title}
            </Heading>
            <Text color={colors.COLORS.WHITE}>
                {message}
            </Text>
        </Box>
    );
}

export default ComponentToast;