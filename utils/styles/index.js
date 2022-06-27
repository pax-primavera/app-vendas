import colors from "./colors";

const styleInputFocus = {
    borderColor: colors.COLORS.PAXCOLOR_1,
    backgroundColor: 'transparent'
};

const styleButton = {
    borderColor: 'muted.300',
    backgroundColor: 'green.800'
};

const styleButtonText = {
    color: `white`
};

const styleButtonOutline = {
    borderColor: colors.COLORS.PAXCOLOR_1,
    backgroundColor: 'transparent'
};

const styleButtonTextOutline = {
    color: colors.COLORS.PAXCOLOR_1
};

const styleButtonDelete = {
    borderColor: 'muted.300',
    backgroundColor: 'red.800'
};

const styleButtonTextDelete = {
    color: 'white'
};

const web = {
    shadow: 2,
    borderWidth: 0
}

const light = {
    backgroundColor: "gray.50"
}

export { web, light, styleInputFocus, styleButton, styleButtonText, styleButtonOutline, styleButtonTextOutline, styleButtonDelete, styleButtonTextDelete };
