import axios, { type AxiosInstance } from "axios";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const http = axios.create({
    baseURL: "http://localhost:4000/",
    timeout: 4000,
    headers: {
        "Content-Type": "application/json"
    }
});

http.interceptors.request.use((config) => {
    return config;
}, (error) => {
    return Promise.reject(error)
});

http.interceptors.response.use((response) => {
    return response
}, async (error) => {
    const config = error.config;

    const shouldRetry =
        !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (!shouldRetry) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= 3) return Promise.reject(error);
    config._retryCount += 1;

    const backoff = 100 * 2 ** config._retryCount;
    await delay(backoff);

    return http(config)
});

export type httpType = AxiosInstance