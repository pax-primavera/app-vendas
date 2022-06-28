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
        if (fieldCPF.includes(label)) return setInputValue(cpfMask(labelValue));
        if (fieldDatas.includes(label)) return setInputValue(dataMask(labelValue));
        if (fieldCEPS.includes(label)) return setInputValue(cepMask(labelValue));
        if (fieldTimes.includes(label)) return setInputValue(timeMask(labelValue));
        return setInputValue(labelValue)
    }

    const change = async (value) => {
        if ([' ', '', null, undefined].includes(value) && props.required) {
            setInputValue(null);
            setError(true);
            return;
        }

        treatment(props.column, value);

        if (props && props.function) props.function(value);
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${inputValue}' WHERE id = ${props.id}`);

        setError(false);
    }

    return (
        <FormControl isInvalid={error} isRequired={props.required | false} >
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Input
                keyboardType={props.type}
                placeholder={props.placeholder}
                value={inputValue}
                maxLength={props.maxLength}
                onChangeText={async (e) => await change(e)}
                _focus={styleInputFocus}
            />
        </FormControl>
    );
}

export default ComponentInput;
