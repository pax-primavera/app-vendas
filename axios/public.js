import axios from 'axios';
import global from '../utils/globais.js';

const instance = axios.create({
    baseURL: global,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default instance;