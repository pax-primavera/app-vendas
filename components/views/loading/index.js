import { Heading, HStack, Spinner } from "native-base";

function ComponentLoading(props) {
    const { mensagem } = props;

    return (
        <HStack space={2} m="5" flexDirection="column" justifyContent="center" alignItems="center">
            <Spinner color="green.900" size="lg" accessibilityLabel={mensagem} />
            <Heading mt="2" color="green.900" fontSize="md">
                {mensagem}
            </Heading>
        </HStack>
    );
}

export default ComponentLoading;