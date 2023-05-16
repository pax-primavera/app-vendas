import { FormControl, Select } from "native-base";
import React, { useState } from 'react';
import { styleInputFocus, } from '../../utils/styles/index';
import { executarSQL } from '../../services/database/index.js';

const ComponentSelect = (props) => {
    const [selectValue, setSelectValue] = useState(props.inputValue);

    // if (props && props.value) {
    //     setSelectValue(props.value);
    // }

    const change = async (value) => {
        setSelectValue(value);
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${value}' WHERE id = ${props.id}`);
    }

    return (
        <FormControl isRequired={props.required | false}>
            <FormControl.Label>{props.label}:</FormControl.Label>
            <Select
                _focus={styleInputFocus}
                selectedValue={selectValue}
                onValueChange={value => change(value)}
                accessibilityLabel={props.label}
                placeholder={props.placeholder}
            >
                {props.array.map((item) => <Select.Item
                    key={item[props.columnLabel]}
                    label={item[props.columnLabel]}
                    value={item.id} />
                )}
            </Select>
        </FormControl>
    );
}

export default ComponentSelect;
