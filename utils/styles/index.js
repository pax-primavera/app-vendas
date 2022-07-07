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
    borderColor: 'transparent',
    backgroundColor: 'transparent'
};

const styleButtonTextDelete = {
    color: 'red.800',
};

const styleButtonAdd = {
    borderColor: 'green.800',
    borderWidth: 1,
    backgroundColor: 'transparent',
};

const styleButtonTextAdd = {
    color: 'green.800',
};

const web = {
    shadow: 2,
    borderWidth: 0
}

const light = {
    backgroundColor: "gray.50"
}

const textCenter = {
    textAlign: 'justify',
    marginBottom: 10
}

const containerFoto = {
    borderWidth: 1,
    borderRadius: 15,
    borderColor: colors.COLORS.PAXCOLOR_1,
    marginTop: 15,
    paddingTop: 12,
    paddingBottom: 10
}

const container = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
}

const imagemLogo = {
    width: 200,
    height: 65
}

export {
    imagemLogo,
    container,
    containerFoto,
    styleButtonAdd,
    styleButtonTextAdd,
    web,
    light,
    styleInputFocus,
    styleButton,
    styleButtonText,
    styleButtonOutline,
    styleButtonTextOutline,
    styleButtonDelete,
    styleButtonTextDelete,
    textCenter
};
