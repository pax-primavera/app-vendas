import { HStack, Switch, Text } from "native-base";
import React, { useState } from 'react';
import { executarSQL } from '../../services/database/index.js';

const ComponentSwitch = (props) => {
    const [switchValue, setSwitchValue] = useState(false);

    const change = async (value) => {
        setSwitchValue(value);

        if (props && props.column) {
            await executarSQL(`
                UPDATE 
                ${props.table}
                SET ${props.column} = '${value}'
                WHERE id = ${props.id}`
            );
        }

        if (props && props.function) {
            props.function(value);
        }
    }

    return (
        <HStack space={1} alignItems="center">
            <Switch
                size="lg"
                value={switchValue}
                colorScheme="emerald"
                onValueChange={(value) => change(value)}
            />
            <Text>{props.label}</Text>
        </HStack>
    );
}

export default ComponentSwitch;