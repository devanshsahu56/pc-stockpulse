import axios from "axios";
import { getAccessToken, refreshAccessToken, clearTokens } from "./auth";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

// Add token to every request
API.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (err) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);

export const productAPI = {
  getAll: () => API.get("/products"),
  search: (query) => API.get(`/products/search/${query}`),
  create: (data) => API.post("/products", data),
  update: (id, data) => API.put(`/products/${id}`, data),
  restock: (id, quantity) => API.patch(`/products/${id}/restock`, { quantity }),
  receive: (id, data) => API.post(`/products/${id}/receive`, data),
  updateSuppliers: (id, data) => API.patch(`/products/${id}/suppliers`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const customerAPI = {
  getAll: () => API.get("/customers"),
  search: (query) => API.get(`/customers/search/${query}`),
  create: (data) => API.post("/customers", data),
  update: (id, data) => API.put(`/customers/${id}`, data),
  delete: (id) => API.delete(`/customers/${id}`),
  getSales: (id) => API.get(`/sales/customer/${id}`),
};

export const saleAPI = {
  getAll: (params) => API.get("/sales", { params }),
  create: (data) => API.post("/sales", data),
  getById: (id) => API.get(`/sales/${id}`),
  getByCustomer: (customerId) => API.get(`/sales/customer/${customerId}`),
  addPayment: (id, data) => API.patch(`/sales/${id}/payment`, data),
  convertToCustomer: (id, customerId) =>
    API.patch(`/sales/${id}/convert`, { customerId }),
};

export const reportsAPI = {
  getSummary: (params) => API.get("/sales/reports/summary", { params }),
};

export const purchaseAPI = {
  getAll: () => API.get("/purchases"),
  create: (data) => API.post("/purchases", data),
  receive: (id) => API.patch(`/purchases/${id}/receive`),
  cancel: (id) => API.patch(`/purchases/${id}/cancel`),
  delete: (id) => API.delete(`/purchases/${id}`),
};

export const supplierAPI = {
  getAll: () => API.get("/suppliers"),
  search: (query) => API.get(`/suppliers/search/${query}`),
  create: (data) => API.post("/suppliers", data),
  update: (id, data) => API.put(`/suppliers/${id}`, data),
  delete: (id) => API.delete(`/suppliers/${id}`),
};

export const authAPI = {
  login: (data) => axios.post("http://localhost:5000/api/auth/login", data),
  logout: (refreshToken) =>
    axios.post("http://localhost:5000/api/auth/logout", { refreshToken }),
  refresh: (refreshToken) =>
    axios.post("http://localhost:5000/api/auth/refresh", { refreshToken }),
  forgotPassword: () =>
    axios.post("http://localhost:5000/api/auth/forgot-password"),
  getAccessCode: () => API.get("/auth/access-code"),
  regenerateAccessCode: () => API.post("/auth/access-code/regenerate"),
  verifyOTP: (otp) =>
    axios.post("http://localhost:5000/api/auth/verify-otp", { otp }),
  resetPassword: (resetToken, newPassword) =>
    axios.post("http://localhost:5000/api/auth/reset-password", {
      resetToken,
      newPassword,
    }),
};

export default API;
