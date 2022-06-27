import { FormControl } from "native-base";
import React, { useState } from 'react';
import { executarSQL } from '../../services/database/index.js';
import Slider from "react-native-slider";
import colors from '../../utils/styles/colors';
import { moedaMask } from '../../utils/generic/format';

const ComponentSlider = (props) => {
    const [sliderValue, setSliderValue] = useState(0);

    const change = async (value) => {
        setSliderValue(moedaMask(value));

        if (props && props.function) props.function(value);
        if (props && props.column) await executarSQL(`UPDATE ${props.table} SET ${props.column} = '${value}' WHERE id = ${props.id}`);
    }

    return (
        <FormControl>
            <FormControl.Label>{props.label}: {sliderValue}</FormControl.Label>
            <Slider
             key={props}
                maximumValue={props.limit}
                minimumTrackTintColor={colors.COLORS.PAXCOLOR_1}
                thumbTintColor={colors.COLORS.PAXCOLOR_1}
                onValueChange={e => change(e)}
            />
        </FormControl>
    );
}

export default ComponentSlider;