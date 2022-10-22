import { Platform, Dimensions, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from "../utils/styles/colors.js";
import imagens from "../utils/generic/imagens";
import { imagemLogo } from "../utils/styles/index";
import { Login } from '../views/login';
import { Home } from '../views/home';
import { Planos } from '../views/planos';
import { ContratoContentInicial } from '../views/contrato.inicial';
import { ContratoContentTitular } from '../views/contrato.titular';
import { ContratoContentEnderecoResidencial } from '../views/contrato.enderecos';
import { ContratoContentTermoAdesao } from '../views/contrato.termo.adesao';
import { ContratoContentDependentes } from '../views/contrato.dependentes';
import { ContratoContentAnexos } from '../views/contrato.anexos';
import { ContratoContentFinalizar } from '../views/contrato.finalizar';
import { ContratoContentFinalizarOff } from '../views/contrato.finalizar.off';
import { ContratoContentAssinatura } from '../views/contrato.assinatura';
/*
import { VendasPendentes } from '../views/vendas.pendentes';
import { ContratoContentInicialOff } from "../views/contrato.inicial.off.js";
import { ContratoContentTitularOff } from "../views/contrato.titular.off.js";
import { ContratoContentEnderecoResidencialOff } from "../views/contrato.enderecos.off";
import { ContratoContentTermoAdesaoOff } from '../views/contrato.termo.adesao.off';
import { ContratoContentDependentesOff } from "../views/contrato.dependentes.off";
import { ContratoContentAnexosOff } from '../views/contrato.anexos.off';*/

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
                    component={ContratoContentTitular}
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
                    name="contratoContentFinalizarOff"
                    component={ContratoContentFinalizarOff}
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