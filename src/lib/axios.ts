import axios from 'axios';

import { env } from '@/env';

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

if (env.VITE_ENABLE_API_DELAY) {
  // Interceptando todas as requisições, ou seja, antes de todas as funções será executado a
  // função que está dentro de "use".
  api.interceptors.request.use(async (config) => {
    // A Promise será resolvida em 2 segundos que foi o tempo que passamos
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return config;
  });
}
