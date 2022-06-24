import { FormControl, Radio } from "native-base";
import React, { useState } from 'react';
import { executarSQL } from '../../services/database/index.js';

const ComponentRadio = (props) => {
    const [radioValue, setRadioValue] = useState(0);

    const change = async (value) => {
        setRadioValue(value);

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
        <FormControl>
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Radio.Group
                defaultValue={radioValue}
                onChange={e => change(e)}
                name={props.column}
            >
                {props.array.map((item) => <Radio
                    colorScheme="success"
                    key={item.id}
                    value={item._id}
                    my={item.id}>
                    {item.descricao.trim()}</Radio>)}
            </Radio.Group>
        </FormControl>
    );
}

export default ComponentRadio;