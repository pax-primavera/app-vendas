import { Platform, Dimensions, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from "../utils/styles/colors.js";
import imagens from "../utils/generic/imagens.js";
import { Login } from '../views/Login';
import { Home } from '../views/Home';
import { Contrato } from '../views/Contrato';
import { Dependentes } from '../views/Dependentes';

const Stack = createNativeStackNavigator();
const { height } = Dimensions.get("screen");

const imagemLogo = {
    width: 200,
    height: 65
};

const heightHeader = {
    backgroundColor: colors.COLORS.WHITE,
    height: Platform.OS === "ios" ? height * 0.12 : height * 0.070,
}

const Routes = () =>{
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" headerMode="screen">
                <Stack.Screen
                    name="Login"
                    component={Login}
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
                    name="Contrato"
                    component={Contrato}
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
                    name="Dependentes"
                    component={Dependentes}
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