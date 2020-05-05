import axios from 'axios';

const axiosIns = axios.create({
    baseURL: '/api/v1',
    headers: {
        'content-type': 'application/json'
    }
});

export const get = path => axiosIns.get(path);