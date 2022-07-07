import React, { useState } from 'react';
import { FormControl, Input } from "native-base";
import { styleInputFocus, } from '../../utils/styles/index';
import { cpfMask, dataMask, dataMaskEUA } from "../../utils/generic/format";
import { executarSQL } from '../../services/database/index';
import { fieldDatas, fieldCPF } from '../../utils/generic/field.mask'

const ComponentInput = (props) => {
    const [inputValue, setInputValue] = useState();
    if (props && props.value) {
        setInputValue(props.value);
    }

    const treatment = (label, labelValue) => {
        if (fieldCPF.includes(label)) return cpfMask(labelValue);
        if (fieldDatas.includes(label)) return dataMask(labelValue);
        return labelValue;
    }

    const change = async (value) => {

        value = treatment(props.column, value);

        setInputValue(value);

        if (fieldDatas.includes(props.column)) {
            value = dataMaskEUA(value);
        }

        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${value}' WHERE id = ${props.id}`);
    }

    return (
        <FormControl isRequired={props.required | false} >
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
