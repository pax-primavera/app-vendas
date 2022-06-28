import { Checkbox } from "native-base";
import React, { useState } from 'react';
import { executarSQL } from '../../services/database/index.js';

const ComponentCheckbox = (props) => {
    const [checkboxValue, setCheckboxValue] = useState(false); 1

    if (props && props.value) {
        setSwitchValue(props.value);
    }

    const change = async (value) => {
        setCheckboxValue(value);

        if (props && props.function) props.function(value);
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${value}' WHERE id = ${props.id}`);
    }

    return (
        <Checkbox
            colorScheme="emerald"
            value={checkboxValue}
            onChange={(e) => change(e)}
        >
            {props.label}
        </Checkbox>
    );
}

export default ComponentCheckbox;
