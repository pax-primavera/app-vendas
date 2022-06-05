import axios from 'axios';
import global from './url.js';

const instance = axios.create({
    baseURL: global,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default instance;