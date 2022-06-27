import React, { useState } from 'react';
import { FormControl, Input } from "native-base";
import { styleInputFocus, } from '../../utils/styles/index';
import { cpfMask, dataMask } from "../../utils/generic/format";
import { executarSQL } from '../../services/database/index';
import { fieldDatas, fieldCPF } from '../../utils/generic/field.mask'

const ComponentInput = (props) => {
    const [inputValue, setInputValue] = useState();
    const [error, setError] = useState(false);

    const treatment = (label, labelValue) => {
        if (fieldCPF.includes(label)) labelValue = cpfMask(labelValue);
        if (fieldDatas.includes(label)) labelValue = dataMask(labelValue);
        setInputValue(labelValue)
    }

    const change = async (value) => {
        if ([' ', '', null].includes(value) && props.required) {
            setInputValue(null);
            setError(true);
            return;
        }

        const valueInput = treatment(props.column, value);

        if (props && props.function) props.function(value);      
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${valueInput}' WHERE id = ${props.id}`);
       
        setError(false);
    }

    return (
        <FormControl isInvalid={error} isRequired={props.required | false} >
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Input
                keyboardType={props.type}
                placeholder={props.placeholder}
                value={inputValue}
                onChangeText={async (e) => await change(e)}
                _focus={styleInputFocus}
            />
        </FormControl>
    );
}

export default ComponentInput;