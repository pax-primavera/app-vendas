import React, { useState } from 'react';
import { FormControl, Input } from "native-base";
import { styleInputFocus, } from '../../utils/styles/index';
import { cpfMask, dataMask, timeMask, cepMask } from "../../utils/generic/format";
import { executarSQL } from '../../services/database/index';
import { fieldDatas, fieldCPF, fieldCEPS, fieldTimes } from '../../utils/generic/field.mask'

const ComponentInput = (props) => {
    const [inputValue, setInputValue] = useState();
    const [error, setError] = useState(false);

    if (props && props.value) {
        setInputValue(props.value);
    }

    const treatment = (label, labelValue) => {
        if (fieldCPF.includes(label)) labelValue = cpfMask(labelValue);
        if (fieldDatas.includes(label)) labelValue = dataMask(labelValue);
        if (fieldCEPS.includes(label)) labelValue = cepMask(labelValue);
        if (fieldTimes.includes(label)) labelValue = timeMask(labelValue);
        setInputValue(labelValue)
    }

    const change = async (value) => {
        if ([' ', '', null, undefined].includes(value) && props.required) {
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
                key={props}
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
