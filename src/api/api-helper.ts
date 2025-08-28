// utils/apiClient.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "x-client-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
});

// Attach JWT if needed
const setAuthHeader = (
  config: AxiosRequestConfig,
  useAuth: boolean
): AxiosRequestConfig => {
  if (useAuth) {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config as InternalAxiosRequestConfig<unknown>,
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized. Redirecting...");
      window.location.href = "/auth"; // or custom path
    }

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Unknown error";
      console.error("API Error:", errorMessage);
    }
    return Promise.reject(error);
  }
);

// ---------- Utility functions ----------
export const ApiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(config || {}, useAuth);
  const res = await apiClient.get<T>(url, finalConfig);
  return res.data;
};

export const ApiPost = async <T>(
  url: string,
  data: Record<string, unknown>,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(config || {}, useAuth);
  const res = await apiClient.post<T>(url, data, finalConfig);
  return res.data;
};

export const ApiPostFormData = async <T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(
    {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    },
    useAuth
  );
  const res = await apiClient.post<T>(url, formData, finalConfig);
  return res.data;
};

export const ApiPutFormData = async <T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(
    {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    },
    useAuth
  );
  const res = await apiClient.put<T>(url, formData, finalConfig);
  return res.data;
};

export const ApiPut = async <T>(
  url: string,
  data: Record<string, unknown>,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(config || {}, useAuth);
  const res = await apiClient.put<T>(url, data, finalConfig);
  return res.data;
};

export const ApiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
  useAuth = true
): Promise<T> => {
  const finalConfig = setAuthHeader(config || {}, useAuth);
  const res = await apiClient.delete<T>(url, finalConfig);
  return res.data;
};

export default apiClient;
