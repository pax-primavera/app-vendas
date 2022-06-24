import React, { useState } from 'react';
import { FormControl, Input } from "native-base";
import { styleInputFocus, } from '../../utils/styles/index';
import { cpfMask, dataMask } from "../../utils/generic/format";
import { executarSQL } from '../../services/database/index.js';

const ComponentInput = (props) => {
    const [inputValue, setInputValue] = useState();
    const [error, setError] = useState(false);

    const treatment = (label, labelValue) => {
        if (['cpf_dependente', 'cpfTitular'].includes(label)) {
            return setInputValue(cpfMask(labelValue));
        } else if (['dataContrato', 'dataNascTitular'].includes(label)) {
            return setInputValue(dataMask(labelValue));
        } else {
            return setInputValue(labelValue);
        }
    }

    const change = async (value) => {
        const valueInput = treatment(props.column, value);

        await executarSQL(`
            UPDATE 
            ${props.table} 
            SET ${props.column} = '${valueInput}'
            WHERE id = ${props.contratoID}`
        );

        if (!value) {
            return setError(true)
        }

        setError(false);
    }

    return (
        <FormControl isInvalid={error} >
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Input
                keyboardType={props.type}
                placeholder={props.placeholder}
                value={inputValue}
                onChangeText={e => change(e)}
                _focus={styleInputFocus}
            />
        </FormControl>
    );
}

export default ComponentInput;