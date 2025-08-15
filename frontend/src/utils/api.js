import axios from 'axios';

// API base URL
// Varsayılan olarak relative '/api' kullanılır; dev'de CRA proxy, prod'da aynı origin.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi ve stats güncelleme
api.interceptors.response.use(
  (response) => {
    // Satış silindiğinde stats'ı güncelle
    if (response.headers['x-stats-updated'] === 'true') {
      console.log('Stats güncellendi, frontend\'e bildirim gönderiliyor...');
      // Custom event ile frontend'e bildir
      window.dispatchEvent(new CustomEvent('saleDeleted', {
        detail: {
          saleId: response.headers['x-sale-deleted'],
          timestamp: Date.now()
        }
      }));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı logout yap
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Kullanıcı kaydı
  register: (userData) => api.post('/auth/register', userData),
  
  // Kullanıcı girişi
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Kullanıcı çıkışı
  logout: () => api.post('/auth/logout'),
  
  // Mevcut kullanıcı bilgileri
  getMe: () => api.get('/auth/me'),
  
  // PIN değiştirme
  changePin: (pinData) => api.post('/auth/change-pin', pinData),
  
  // Token yenileme
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Products API
export const productsAPI = {
  // Tüm ürünleri listele
  getProducts: (params) => api.get('/products', { params }),
  
  // POS için ürün arama (sayfalama olmadan)
  searchProductsForPOS: (params) => api.get('/products/search/pos', { params }),
  
  // Belirli ürünü getir
  getProduct: (id) => api.get(`/products/${id}`),
  
  // Yeni ürün oluştur
  createProduct: (productData) => api.post('/products', productData),
  
  // Ürün güncelle
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Ürün sil
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Stok güncelle
  updateStock: (id, stockData) => api.patch(`/products/${id}/stock`, stockData),
  
  // Filtre seçeneklerini getir
  getFilterOptions: () => api.get('/products/filters/options'),
  
  // Düşük stoklu ürünleri listele
  getLowStockProducts: () => api.get('/products/low-stock'),
  
  // Kategori bazlı barkod önerisi
  suggestBarcode: (category) => api.post('/products/suggest-barcode', { category }),
};

// Users API
export const usersAPI = {
  // Tüm kullanıcıları listele
  getUsers: (params) => api.get('/users', { params }),
  
  // Belirli kullanıcıyı getir
  getUser: (id) => api.get(`/users/${id}`),
  
  // Kullanıcı güncelle
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Kullanıcıyı deaktif et
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Kullanıcıyı aktif et
  activateUser: (id) => api.patch(`/users/${id}/activate`),
};

// Customers API
export const customersAPI = {
  // Tüm müşterileri listele
  getCustomers: (params) => api.get('/customers', { params }),
  
  // Belirli müşteriyi getir
  getCustomer: (id) => api.get(`/customers/${id}`),
  
  // Yeni müşteri oluştur
  createCustomer: (customerData) => api.post('/customers', customerData),
  
  // Müşteri güncelle
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  
  // Müşteri sil
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  
  // Telefon numarası ile müşteri ara
  searchByPhone: (phone) => api.get(`/customers/search/phone/${phone}`),
  
  // Filtre seçeneklerini getir
  getFilterOptions: () => api.get('/customers/filters/options'),
  
  // Müşteri istatistiklerini getir
  getStats: (params) => api.get('/customers/stats/overview', { params }),
  
  // Bakiye işlemi ekle
  addBalanceTransaction: (customerId, transactionData) => api.post('/balance', { customerId, ...transactionData }),
  
  // Silinen müşterileri listele
  getDeletedCustomers: (params) => api.get('/customers/deleted', { params }),
  
  // Silinen müşteriyi geri yükle
  restoreCustomer: (id) => api.post(`/customers/${id}/restore`),
  
  // Müşteriyi kalıcı olarak sil
  permanentDeleteCustomer: (id) => api.delete(`/customers/${id}/permanent`),
  
  // Müşteri satış özetini getir
  getCustomerSalesSummary: (customerId, period = 'all') => api.get(`/customers/${customerId}/sales-summary`, { 
    params: { period } 
  }),
};

// Sales API
export const salesAPI = {
  // Müşteriye ait satışları getir
  getSalesByCustomer: (customerId) => api.get(`/sales/customer/${customerId}`),
  
  // Yeni satış oluştur
  createSale: (saleData) => api.post('/sales', saleData),
  
  // Satış detaylarını getir
  getSaleDetails: (id) => api.get(`/sales/${id}`),
  
  // Satışı sil
  deleteSale: (id) => api.delete(`/sales/${id}`),
  
  // Satış istatistikleri
  getStats: (params) => api.get('/sales/stats/overview', { params }),
};

// Categories API
export const categoriesAPI = {
  // Tüm kategorileri getir
  getAll: () => api.get('/categories'),
  
  // Tek kategori getir
  getById: (id) => api.get(`/categories/${id}`),
  
  // Yeni kategori oluştur
  create: (categoryData) => api.post('/categories', categoryData),
  
  // Kategori güncelle
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Kategori sil
  delete: (id) => api.delete(`/categories/${id}`),
};

// Balance API
export const balanceAPI = {
  // Tüm bakiye işlemlerini getir
  getTransactions: (params) => api.get('/balance', { params }),
  
  // Müşteri bazında bakiye işlemlerini getir
  getCustomerTransactions: (customerId, params) => api.get(`/balance/customer/${customerId}`, { params }),
  
  // Yeni bakiye işlemi ekle
  createTransaction: (transactionData) => api.post('/balance', transactionData),
  
  // Bakiye işlemini güncelle
  updateTransaction: (id, transactionData) => api.put(`/balance/${id}`, transactionData),
  
  // Bakiye işlemini sil
  deleteTransaction: (id) => api.delete(`/balance/${id}`),
  
  // Bakiye istatistikleri
  getStats: (params) => api.get('/balance/stats/overview', { params }),
  
  // Dashboard için son işlemleri getir
  getRecentTransactions: (params) => api.get('/balance/recent', { params }),
  
  // Müşteri listesi (bakiye işlemleri için)
  getCustomers: () => api.get('/customers'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
