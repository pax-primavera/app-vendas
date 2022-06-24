import { FormControl, Select } from "native-base";
import React, { useState } from 'react';
import { styleInputFocus, } from '../../utils/styles/index';
import { executarSQL } from '../../services/database/index.js';

const ComponentSelect = (props) => {
    const [selectValue, setSelectValue] = useState();
    const [error, setError] = useState(false);

    const change = async (value) => {
        if (!value) {
            return setError(true)
        }

        setSelectValue(valueInput);

        await executarSQL(`
            UPDATE 
            ${props.table}
            SET ${props.column} = '${value}'
            WHERE id = ${props.contratoID}`
        );

        setError(false);
    }

    return (
        <FormControl isInvalid={error}>
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Select
                _focus={styleInputFocus}
                selectedValue={selectValue}
                onValueChange={value => change(value)}
                accessibilityLabel={props.label}
                placeholder={props.placeholder}
            >
                {props.array.map((item) => <Select.Item
                    key={item.id}
                    label={item.descricao}
                    value={item._id} />
                )}
            </Select>
        </FormControl>
    );
}

export default ComponentSelect;