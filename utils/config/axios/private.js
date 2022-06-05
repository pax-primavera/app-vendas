import axios from 'axios'
import { executarSQL } from '../../../services/index';
import global from './url.js';

let instance = axios.create();

instance.defaults.baseURL = global;

instance.interceptors.request.use(
    async config => {
        const token = await executarSQL(`select * from login`);

        if (token) {
            config.headers.Authorization = `Bearer ${token._array[0].token}`;
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
)

export default instance;