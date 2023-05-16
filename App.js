import React, { useLayoutEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Routes from './routes/index.js';
import { NativeBaseProvider } from "native-base";
import colors from "./utils/styles/colors.js";
import DatabaseInit from './database/database';

export default function App() {
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



