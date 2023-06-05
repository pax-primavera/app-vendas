import { Platform, Dimensions, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from "../utils/styles/colors.js";
import imagens from "../utils/generic/imagens";
import { imagemLogo } from "../utils/styles/index";
import { Login } from '../views/login';
import { Home } from '../views/home';
import { Planos } from '../views/planos';
import { VendasPendentes } from '../views/vendas.pendentes';
import { ContratoContentInicial } from '../views/contrato.inicial';
import { ContratoContentTitular } from '../views/contrato.titular';
import { ContratoContentEnderecoResidencial } from '../views/contrato.enderecos';
import { ContratoContentTermoAdesao } from '../views/contrato.termo.adesao';
import { ContratoContentDependentes } from '../views/contrato.dependentes';
import { ContratoContentAnexos } from '../views/contrato.anexos';
import { ContratoContentFinalizar } from '../views/contrato.finalizar';
import { ContratoContentFinalizarOff } from '../views/contrato.finalizar.off';
import { ContratoContentAssinatura } from '../views/contrato.assinatura';

import { ContratoContentInicialOff } from "../views/contrato.inicial.off.js";
import { ContratoContentTitularOff } from "../views/contrato.titular.off.js";
import { ContratoContentEnderecoResidencialOff } from "../views/contrato.enderecos.off";
import { ContratoContentTermoAdesaoOff } from '../views/contrato.termo.adesao.off';
import { ContratoContentDependentesOff } from "../views/contrato.dependentes.off";
import { ContratoContentAnexosOff } from '../views/contrato.anexos.off';

import { Avisos } from '../views/avisos';
import { AvisosVendas } from '../views/avisos.vendas';

import { ContratoContentInicialAdicionalHum } from '../views/contrato.inicial.adicional.hum.js';
import { ContratoAdicionalHum } from "../views/contrato.adicional.hum.js";
import { ContratoContentEnderecoAdicional } from "../views/contrato.enderecos.adicional.hum.js";
import { ContratoContentTitularAdicional } from "../views/contrato.titular.adicional.hum.js";
import { ContratoContentAnexosAdicional } from '../views/contrato.anexos.adicional.js';

import { ContratoContentInicialAdicionalPET } from '../views/contrato.inicial.adicional.pet.js';
import { ContratoAdicionalPET } from "../views/contrato.adicional.pet.js";
import { ContratoContentEnderecoAdicionalPET } from "../views/contrato.enderecos.adicional.pet.js";
import { ContratoContentTitularAdicionalPET } from "../views/contrato.titular.adicional.pet.js";
import { ContratoContentFinalizarAdicional } from "../views/contrato.finalizar.adicional.js";

import { ContratoContentInicialVencimento } from '../views/contrato.inicial.vencimento.js';
import { ContratoContentEnderecoVencimento } from "../views/contrato.enderecos.vencimento.js";
import { ContratoContentTitularVencimento } from "../views/contrato.titular.vencimento.js";
import { ContratoContentFinalizarVencimento } from "../views/contrato.finalizar.vencimento.js";

import { ContratoContentAssinar } from "../views/contrato.assinar.cliente.js";
import { ContratoContentAssinarVendedor } from "../views/contrato.assinar.vendedor.js";


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
                    name="VendasPendentes"
                    component={VendasPendentes}
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
                        // headerBackVisible: false,
                        headerStyle: heightHeader,
                    })}
                />



                <Stack.Screen
                    name="ContratoInicialOff"
                    component={ContratoContentInicialOff}
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
                    name="contratoContentTitularOff"
                    component={ContratoContentTitularOff}
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
                    name="contratoContentEnderecoResidencialOff"
                    component={ContratoContentEnderecoResidencialOff}
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
                    name="contratoContentTermoAdesaoOff"
                    component={ContratoContentTermoAdesaoOff}
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
                    name="contratoContentDependentesOff"
                    component={ContratoContentDependentesOff}
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
                    name="contratoContentAnexosOff"
                    component={ContratoContentAnexosOff}
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
                    name="avisos"
                    component={Avisos}
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
                    name="avisos-vendas"
                    component={AvisosVendas}
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

                {/* Rota do Adicional e Exclusão Dependemte PAX */}
                <Stack.Screen
                    name="ContratoInicialAdicionalHum"
                    component={ContratoContentInicialAdicionalHum}
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
                    name="contratoContentTitularAdicional"
                    component={ContratoContentTitularAdicional}
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
                    name="ContratoAdicionalHum"
                    component={ContratoAdicionalHum}
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
                    name="contratoContentEnderecoAdicional"
                    component={ContratoContentEnderecoAdicional}
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
                    name="ContratoContentAnexosAdicional"
                    component={ContratoContentAnexosAdicional}
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
                    name="contratoContentFinalizarAdicional"
                    component={ContratoContentFinalizarAdicional}
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
                {/* Aqui é a rota do adicional PET */}
                <Stack.Screen
                    name="ContratoInicialAdicionalPET"
                    component={ContratoContentInicialAdicionalPET}
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
                    name="contratoContentTitularAdicionalPET"
                    component={ContratoContentTitularAdicionalPET}
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
                    name="ContratoAdicionalPET"
                    component={ContratoAdicionalPET}
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
                    name="contratoContentEnderecoAdicionalPET"
                    component={ContratoContentEnderecoAdicionalPET}
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
                    name="ContratoInicialVencimento"
                    component={ContratoContentInicialVencimento}
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
                    name="ContratoContentTitularVencimento"
                    component={ContratoContentTitularVencimento}
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
                    name="ContratoContentEnderecoVencimento"
                    component={ContratoContentEnderecoVencimento}
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
                    name="contratoContentFinalizarVencimento"
                    component={ContratoContentFinalizarVencimento}
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
                    name="ContratoContentAssinar"
                    component={ContratoContentAssinar}
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
                    name="ContratoContentAssinarVendedor"
                    component={ContratoContentAssinarVendedor}
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Routes;