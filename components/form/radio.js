import { FormControl, Radio } from "native-base";
import React, { useState } from 'react';
import { executarSQL } from '../../services/database/index.js';

const ComponentRadio = (props) => {
    const [radioValue, setRadioValue] = useState(0);

    if (props && props.value) {
        setRadioValue(props.value);
    }

    const change = async (value) => {
        setRadioValue(value);

        if (props && props.function) props.function(value);
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${value}' WHERE id = ${props.id}`);
    }

    return (
        <FormControl>
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Radio.Group
                key={props}
                defaultValue={radioValue}
                onChange={e => change(e)}
                name={props.column}
            >
                {props.array.map((item) => <Radio
                    colorScheme="emerald"
                    key={item[props.columnLabel]}
                    value={item.id}>{item[props.columnLabel]}</Radio>)}
            </Radio.Group>
        </FormControl>
    );
}

export default ComponentRadio;