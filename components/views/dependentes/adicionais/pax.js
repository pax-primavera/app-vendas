import { styleButtonDelete, styleButtonTextDelete } from '../../../../utils/styles/index';
import { Center, HStack, VStack, Icon, Box, Button } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import ComponentInput from '../../../form/input';
import ComponentSelect from '../../../form/select';
import ComponentSwitch from '../../../form/switch';

function ComponentAddPax(props) {
    const { item, table, parentescos, deletarDependente } = props;

    return (
        <Box key={item.id} safeArea w="100%" pl="5" pr="5" mb="5" >
            <VStack space={3} >
                <ComponentSwitch
                    label="Adicional cremação?"
                    column="cremacao"
                    id={item.id}
                    table={table}
                />
                <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                        <ComponentInput
                            label="Nome Completo"
                            column="nome"
                            placeholder='Digite o nome do dependente:'
                            id={item.id}
                            table={table}
                            required
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                        <ComponentInput
                            label="Data Nascimento"
                            column="dataNascimento"
                            placeholder='Digite a data de nascimento:'
                            id={item.id}
                            table={table}
                            required
                            type="numeric"
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Parentesco"
                            column="parentesco"
                            placeholder='Parentesco:'
                            array={parentescos}
                            columnLabel="nome"
                            id={item.id}
                            table={table}
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                        <ComponentInput
                            label="CPF"
                            column="cpf_dependente"
                            placeholder="Digite o CPF do dependente:"
                            type="numeric"
                            id={item.id}
                            table={table}
                        />
                    </Center>
                </HStack>
            </VStack>
            <Button size="lg"
                mt="5"
                mb="3"
                leftIcon={<Icon as={Ionicons} name="remove" size="lg" color="red.800" />}
                _light={styleButtonDelete}
                _text={styleButtonTextDelete}
                variant="outline"
                onPress={() => deletarDependente(item.id)}
            >
                Remover
            </Button>
        </Box>
    )
}

export default ComponentAddPax;