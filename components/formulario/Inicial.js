import {
    Center,
    Box,
    VStack,
    FormControl,
    Input,
    Heading,
    HStack,
    Select,
    ScrollView,
    Text,
    useToast,
    Button,
    Spinner,
    Checkbox,
    Radio,
    Icon
} from "native-base";


function Inicial() {
    return (
        <>
            <Heading size="lg" fontWeight="500" color="green.800" >
                Informações inciais
            </Heading>
            <Heading mt="1" fontWeight="medium" size="xs">
                selecione uma 'FILIAL' e preecha data de contrato:
            </Heading>

            <HStack space={2} justifyContent="center" mt="3">
                <Center w="100%" rounded="md">
                    <FormControl isInvalid={errors.dataContrato} >
                        <FormControl.Label>Data de contrato:</FormControl.Label>
                        <Input keyboardType='numeric' placeholder='Digite a data de contrato:' value={contrato.dataContrato} onChangeText={e => changeInput('dataContrato', e)} _focus={styleInputFocus} />
                    </FormControl>
                </Center>
            </HStack>
            <HStack>
                <Center w="100%" rounded="md" mt="1">
                    <FormControl>
                        <FormControl.Label>Filial:</FormControl.Label>
                        <Select _focus={styleInputFocus} selectedValue={unidadeID} onValueChange={unidade => setupSelecionarFilial(unidade)} accessibilityLabel="Selecione uma filial:" placeholder="Selecione uma filial:">
                            {unidades.map((item) => <Select.Item key={item.id} label={item.descricao} value={item._id} />)}
                        </Select>
                    </FormControl>
                </Center>
            </HStack>
        </>
    );
}

export { Inicial };