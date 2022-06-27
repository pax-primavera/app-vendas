import { styleButtonDelete, styleButtonTextDelete } from '../../../../utils/styles/index';
import { Center, HStack, VStack, Icon, Box, Button } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { cores, especies, portes } from '../../../../utils/generic/data';
import ComponentInput from '../../../form/input';
import ComponentSelect from '../../../form/select';
import ComponentSlider from '../../../form/slider';
import ComponentSwitch from '../../../form/switch';

function AddPet(props) {
    const { item, table, deletarDependente } = props;

    return (
        <Box key={item.id} safeArea w="100%" pl="5" pr="5" mb="5" >
            <VStack space={3} >

                <ComponentSwitch
                    label="Resgate de cinza?"
                    column="resgate"
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
                            type="numeric"
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Espécie"
                            column="especie"
                            placeholder='Espécie:'
                            array={especies}
                            columnLabel="descricao"
                            id={item.id}
                            table={table}
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                        <ComponentSlider
                            label="Peso"
                            column="peso"
                            id={item.id}
                            table={table}
                            limit="100"
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentSlider
                            label="Altura"
                            column="altura"
                            id={item.id}
                            table={table}
                            limit="25"
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Cor"
                            column="cor"
                            placeholder='Cor:'
                            array={cores}
                            columnLabel="descricao"
                            id={item.id}
                            table={table}
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Porte"
                            column="porte"
                            placeholder='Porte:'
                            array={portes}
                            columnLabel="descricao"
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
    );
}

export default AddPet;