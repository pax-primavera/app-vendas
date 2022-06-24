import React, { useLayoutEffect } from 'react';
import { StatusBar } from "react-native";
import Routes from './routes/index';

import DatabaseInit from './database/database';
import colors from "./utils/styles/colors.js";

import {
  NativeBaseProvider
} from "native-base";


function App() {
  useLayoutEffect(() => {
    /// Construir banco de dados local
    new DatabaseInit();
  }, []);

  return (
    <NativeBaseProvider>
      <StatusBar hidden={false} backgroundColor={colors.COLORS.PAXCOLOR_1} translucent={true} />
      <Routes />
    </NativeBaseProvider>
  );
}

export default App;