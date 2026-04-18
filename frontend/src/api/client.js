import axios from 'axios';

// Use production backend URL if set, otherwise fallback to Vite proxy behavior
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: baseURL
});

api.interceptors.request.use(
  (config) => {
    // Force prefix '/api' to prevent proxy collisions with React routes
    if (config.url && config.url.startsWith('/')) {
      config.url = '/api' + config.url;
    } else if (config.url && !config.url.startsWith('http')) {
      config.url = '/api/' + config.url;
    }
    
    console.log(`[FRONTEND REQUEST] ${config.method.toUpperCase()} ${config.url}`, config.data || '(no payload)');
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(`[FRONTEND REQUEST ERROR] Failed before sending`, error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[FRONTEND RESPONSE] ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[FRONTEND RESPONSE ERROR] ${error.response.status} from ${error.config.url}`, error.response.data);
    } else if (error.request) {
      console.error(`[FRONTEND NETWORK ERROR] No response received from ${error.config.url}`, error.request);
    } else {
      console.error(`[FRONTEND ERROR] Request setup failed`, error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
