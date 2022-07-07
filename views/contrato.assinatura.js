import React, { useLayoutEffect } from "react";
import { WebView } from "react-native-webview";
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Icon } from "native-base";
import colors from '../utils/styles/colors.js';
import { useRoute } from '@react-navigation/native';

const ContratoContentAssinatura = ({ navigation }) => {
    const route = useRoute();

    const { emailSignatario, uuidDocumento, cpfSignatario, nomeSignatario } = route.params;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                    <Icon as={MaterialCommunityIcons} size="8" name="exit-to-app" color={colors.COLORS.PAXCOLOR_1} />
                </TouchableOpacity>
            )
        });
    }, [navigation, MaterialCommunityIcons]);

    return <WebView
        source={{
            html: `<div id='signature-div'></div>
            <script>
                var key             = "${uuidDocumento}";
                var signer_disable_preview  = "0";
                var signer_email        = "${emailSignatario}";
                var signer_display_name     = "${nomeSignatario}"; //Opcional
                var signer_documentation    = "${cpfSignatario}"; //Opcional
                var signer_birthday     = ""; //Opcional
                var signer_key_signer   = ""; //Opcional
                
                var host            = "https://secure.d4sign.com.br/embed/viewblob";
                var container       = "signature-div";    
                var width           = '100%';
                var height          =  '100%';
                
                var is_safari = navigator.userAgent.indexOf('Safari') > -1;
                var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
                if ((is_chrome) && (is_safari)) {is_safari = false;}  
                if (is_safari) {
                    if (!document.cookie.match(/^(.;)?\s*fixed\s=\s*[^;]+(.*)?$/)) {
                        document.cookie = 'fixed=fixed; expires=Tue, 19 Jan 2038 03:14:07 UTC; path=/';
                        var url = document.URL;
                        var str = window.location.search;
                        var param = str.replace("?", "");
                        if (url.indexOf("?")>-1){
                            url = url.substr(0,url.indexOf("?"));
                        }
                        window.location.replace("https://secure.d4sign.com.br/embed/safari_fix?param="+param+'&r='+url);
                    }
                }
                iframe = document.createElement("iframe");
                if (signer_key_signer === ''){
                    iframe.setAttribute("src", host+'/'+key+'?email='+signer_email+'&display_name='+signer_display_name+'&documentation='+signer_documentation+'&birthday='+signer_birthday+'&disable_preview='+signer_disable_preview);
                }else{
                    iframe.setAttribute("src", host+'/'+key+'?email='+signer_email+'&display_name='+signer_display_name+'&documentation='+signer_documentation+'&birthday='+signer_birthday+'&disable_preview='+signer_disable_preview+'&key_signer='+signer_key_signer);
                }
                iframe.setAttribute("id", 'd4signIframe');
                iframe.setAttribute('width', width);
                iframe.setAttribute('height', height);
                iframe.style.border = 0;
                iframe.setAttribute("allow", 'geolocation');
                var cont = document.getElementById(container);
                cont.appendChild(iframe);
                window.addEventListener("message", (event) => {
                    if (event.data === "signed") {
                        alert("Contrato assinato e registrado com sucesso! Click no botão voltar '<-'");
                    }
                    if (event.data === "wrong-data") {
                        alert("Não foi possivel assinar contrato, informações incorretas!")
                    }
                }, false);
            </script>` }}
    />
}

export { ContratoContentAssinatura };
