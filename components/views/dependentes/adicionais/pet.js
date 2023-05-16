import { styleButtonDelete, styleButtonTextDelete } from '../../../../utils/styles/index';
import { Center, HStack, VStack, Icon, Box, Button } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { cores, portes } from '../../../../utils/generic/data';
import ComponentInput from '../../../form/input';
import ComponentSelect from '../../../form/select';
import ComponentSlider from '../../../form/slider';
import ComponentSwitch from '../../../form/switch';
import moment from 'moment';

function AddPet(props) {
    const { item, table, especies, racas, deletarDependente } = props;

    return (
        <Box key={item.id} safeArea w="100%" pl="5" pr="5" mb="5" >
            <VStack space={3} >
                <ComponentSwitch
                    label="Resgate de cinza?"
                    column="resgate"
                    id={item.id}
                    inputValue={item.resgate}
                    table={table}
                />
                <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                        <ComponentInput
                            label="Nome Completo"
                            column="nome"
                            placeholder='Digite o nome do dependente:'
                            id={item.id}
                            inputValue={item.nome}
                            table={table}
                            required
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="100%" rounded="md">
                        <ComponentInput
                            label="Data Nascimento"
                            column="dataNascimento"
                            placeholder='Digite a data de nascimento:'
                            id={item.id}
                            inputValue={moment(item.dataNascimento).format('DD/MM/YYYY')}
                            table={table}
                            type="numeric"
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Espécie"
                            column="especie"
                            placeholder='Espécie:'
                            array={especies}
                            columnLabel="descricao"
                            id={item.id}
                            inputValue={item.especie}
                            table={table}
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentSelect
                            label="Raca"
                            column="raca"
                            placeholder='Raça:'
                            array={racas}
                            columnLabel="descricao"
                            id={item.id}
                            inputValue={parseInt(item.raca)}
                            table={table}
                        />
                    </Center>
                </HStack>
                <HStack space={2} justifyContent="center">
                    <Center w="50%" rounded="md">
                        <ComponentInput
                            label="Peso (Kg)"
                            column="peso"
                            placeholder='Peso (Kg)'
                            id={item.id}
                            inputValue={item.peso == null ? "" : item.peso.toString()}
                            table={table}
                        />
                    </Center>
                    <Center w="50%" rounded="md">
                        <ComponentInput
                            keyboardType="numeric"
                            label="Altura (M)"
                            column="altura"
                            placeholder='Altura (M)'
                            id={item.id}
                            inputValue={item.altura == null ? "" : item.altura.toString()}
                            table={table}
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
                            inputValue={item.cor}
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
                            inputValue={item.porte}
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