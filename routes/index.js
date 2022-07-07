import { Platform, Dimensions, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from "../utils/styles/colors.js";
import imagens from "../utils/generic/imagens";
import {imagemLogo} from "../utils/styles/index";
import { Login } from '../views/login';
import { Home } from '../views/home';
import { Planos } from '../views/planos';
import { ContratoContentInicial } from '../views/contrato.inicial';
import { ContratoContentTitular } from '../views/contrato.titular';
import { ContratoContentEnderecoResidencial } from '../views/contrato.endereco.residencial';
import { ContratoContentEnderecoCobranca } from '../views/contrato.endereco.cobranca';
import { ContratoContentTermoAdesao } from '../views/contrato.termo.adesao';
import { ContratoContentDependentes } from '../views/contrato.dependentes';
import { ContratoContentAnexos } from '../views/contrato.anexos';
import { ContratoContentFinalizar } from '../views/contrato.finalizar';
import { ContratoContentAssinatura } from '../views/contrato.assinatura';

const Stack = createNativeStackNavigator();
const { height } = Dimensions.get("screen");

const heightHeader = {
    backgroundColor: colors.COLORS.WHITE,
    height: Platform.OS === "ios" ? height * 0.16 : height * 0.80,
}

const Routes = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" headerMode="screen">
                <Stack.Screen
                    name="Login"
                    component={Login}
                    options={() => ({
                        headerShown: false
                    })}
                />
                <Stack.Screen
                    name="Planos"
                    component={Planos}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="Home"
                    component={Home}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerBackVisible: false,
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="ContratoInicial"
                    component={ContratoContentInicial}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentTitular"
                    component={ContratoContentDependentes}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentEnderecoResidencial"
                    component={ContratoContentEnderecoResidencial}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentEnderecoCobranca"
                    component={ContratoContentEnderecoCobranca}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentTermoAdesao"
                    component={ContratoContentTermoAdesao}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentDependentes"
                    component={ContratoContentDependentes}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentAnexos"
                    component={ContratoContentAnexos}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentFinalizar"
                    component={ContratoContentFinalizar}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerStyle: heightHeader
                    })}
                />
                <Stack.Screen
                    name="contratoContentAssinatura"
                    component={ContratoContentAssinatura}
                    options={() => ({
                        headerTitle: () => (
                            <Image
                                style={imagemLogo}
                                source={imagens.Logo}
                                resizeMode='contain'
                            />
                        ),
                        headerTitleAlign: "center",
                        headerBackVisible: false,
                        headerStyle: heightHeader,
                    })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Routes;