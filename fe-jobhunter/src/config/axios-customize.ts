import { IBackendRes } from "@/types/backend";
import { Mutex } from "async-mutex";
import axiosClient from "axios";
import { store } from "@/redux/store";
import { setRefreshTokenAction } from "@/redux/slice/accountSlide";
interface AccessTokenResponse {
    access_token: string;
}

/**
 * Creates an initial 'axios' instance with custom settings.
 */

const instance = axiosClient.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true
});

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';
const PUBLIC_AUTH_PATHS = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh'
];

const normalizePath = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            return new URL(url).pathname;
        } catch {
            return url;
        }
    }
    return url;
};

const isPublicAuthPath = (url?: string): boolean => {
    const normalizedPath = normalizePath(url);
    if (!normalizedPath) return false;
    return PUBLIC_AUTH_PATHS.some(path => normalizedPath.startsWith(path));
};

const handleRefreshToken = async (): Promise<string | null> => {
    return await mutex.runExclusive(async () => {
        const res = await instance.get<IBackendRes<AccessTokenResponse>>('/api/v1/auth/refresh');
        if (res && res.data) return res.data.access_token;
        else return null;
    });
};

instance.interceptors.request.use(function (config) {
    const isPublicAuthRequest = isPublicAuthPath(config.url);
    const accessToken = typeof window !== "undefined" ? window.localStorage.getItem('access_token') : null;

    if (isPublicAuthRequest && config.headers) {
        delete config.headers.Authorization;
    }

    if (accessToken && !isPublicAuthRequest) {
        config.headers.Authorization = 'Bearer ' + accessToken;
    }
    if (!config.headers.Accept && config.headers["Content-Type"]) {
        config.headers.Accept = "application/json";
        config.headers["Content-Type"] = "application/json; charset=utf-8";
    }
    return config;
});

/**
 * Handle all responses. It is possible to add handlers
 * for requests, but it is omitted here for brevity.
 */
instance.interceptors.response.use(
    (res) => res.data,
    async (error) => {
        const requestUrl = error?.config?.url as string | undefined;
        const hasAccessToken = typeof window !== "undefined" && !!window.localStorage.getItem('access_token');

        if (error.config && error.response
            && +error.response.status === 401
            && hasAccessToken
            && !isPublicAuthPath(requestUrl)
            && !error.config.headers[NO_RETRY_HEADER]
        ) {
            const access_token = await handleRefreshToken();
            error.config.headers[NO_RETRY_HEADER] = 'true'
            if (access_token) {
                error.config.headers['Authorization'] = `Bearer ${access_token}`;
                localStorage.setItem('access_token', access_token)
                return instance.request(error.config);
            }
        }

        if (
            error.config && error.response
            && (+error.response.status === 400 || +error.response.status === 401)
            && requestUrl === '/api/v1/auth/refresh'
            && location.pathname.startsWith("/admin")
        ) {
            const message = error?.response?.data?.error ?? "Có lỗi xảy ra, vui lòng login.";
            //dispatch redux action
            store.dispatch(setRefreshTokenAction({ status: true, message }));
        }

        return error?.response?.data ?? Promise.reject(error);
    }
);

/**
 * Replaces main `axios` instance with the custom-one.
 *
 * @param cfg - Axios configuration object.
 * @returns A promise object of a response of the HTTP request with the 'data' object already
 * destructured.
 */
// const axios = <T>(cfg: AxiosRequestConfig) => instance.request<any, T>(cfg);

// export default axios;

export default instance;