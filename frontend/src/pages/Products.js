import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import BarcodeScanner from '../components/BarcodeScanner';
import BarcodeGenerator from '../components/BarcodeGenerator';

// Not: Kategori kodları artık backend'de yönetiliyor



const Products = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    seasons: ['Yaz', 'Kış', 'Dört Mevsim'],
    brands: []
  });
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [currentProductName, setCurrentProductName] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form state for textile products
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    brand: '',
    season: '',
    costPrice: '',
    retailPrice: '',
    currentStock: ''
  });

  // Reset form - tanımlamayı erken yapalım
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      barcode: '',
      category: '',
      brand: '',
      season: '',
      costPrice: '',
      retailPrice: '',
      currentStock: ''
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
  }, []);

  // Debounced search
  const searchTimeoutRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        category: selectedCategory,
        season: selectedSeason,
        lowStock: showLowStock
      };

      const response = await productsAPI.getProducts(params);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Fetch products error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || '🔄 Ürünler yüklenemedi. Lütfen tekrar deneyin.', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedCategory, selectedSeason, showLowStock]);

  // Fetch filter options
  const fetchFilters = async () => {
    try {
      const response = await productsAPI.getFilterOptions();
      setFilters(response.data);
    } catch (error) {
      console.error('Fetch filters error:', error);
      // Hata durumunda varsayılan değerler
      setFilters({
        categories: [],
        seasons: ['Yaz', 'Kış', 'Dört Mevsim'],
        brands: []
      });
    }
  };

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal || showEditModal) {
          resetForm();
        } else if (showBarcodeScanner) {
          setShowBarcodeScanner(false);
        } else if (showBarcodeGenerator) {
          setShowBarcodeGenerator(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddModal, showEditModal, showBarcodeScanner, showBarcodeGenerator, resetForm]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('Kategoriler yükleniyor...');
      const response = await categoriesAPI.getAll();
      console.log('Kategoriler API response:', response);
      
      // API response yapısını kontrol et
      const categoriesData = response.data.categories || response.data || [];
      console.log('Kategoriler data:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.log('Authentication error - user might need to login again');
        // The API interceptor should handle this automatically
        return;
      }
      
      setCategories([]); // Hata durumunda boş array
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchFilters();
    fetchCategories();
  }, []);

  // Refetch categories when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal && selectedProduct) {
        await productsAPI.updateProduct(selectedProduct.id, formData);
        toast.success('✅ Ürün bilgileri başarıyla güncellendi!', { duration: 3000 });
      } else {
        await productsAPI.createProduct(formData);
        toast.success('🎉 Yeni ürün başarıyla eklendi!', { duration: 3000 });
      }
      
      resetForm();
      fetchProducts();
      fetchFilters(); // Refresh filters in case new options were added
    } catch (error) {
      console.error('Product operation error:', error);
      console.error('Error response:', error.response?.data);
      
      let message = 'İşlem başarısız';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = `${error.response.data.error}: ${error.response.data.message || ''}`;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(`⚠️ ${message}`, { duration: 4000 });
    }
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await productsAPI.deleteProduct(productId);
        toast.success('🗑️ Ürün başarıyla silindi', { duration: 3000 });
        fetchProducts();
      } catch (error) {
        toast.error('❌ Ürün silinemedi. Lütfen tekrar deneyin.', { duration: 4000 });
      }
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    try {
      setSelectedProduct(product);
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || '',
        brand: product.brand || '',
        season: product.season || '',
        costPrice: product.costPrice || '',
        retailPrice: product.retailPrice || '',
        currentStock: product.currentStock || ''
      });

      setShowEditModal(true);
    } catch (error) {
      console.error('Ürün düzenleme hatası:', error);
      toast.error('⚠️ Ürün düzenleme sırasında bir hata oluştu. Lütfen tekrar deneyin.', { duration: 4000 });
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    try {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

    } catch (error) {
      console.error('Input değişiklik hatası:', error);
    }
  };

  // Barkod tarama işlemi
  const handleBarcodeScan = (scannedBarcode) => {
    setShowBarcodeScanner(false);
    setSearchTerm(scannedBarcode);
    toast.success(`📱 Barkod başarıyla tarandı: ${scannedBarcode}`, { duration: 2500 });
  };

  // Barkod üretme işlemi
  const handleGenerateBarcode = (product) => {
    setCurrentProductName(product.name);
    setCurrentBarcode(product.barcode || '');
    setShowBarcodeGenerator(true);
  };

  // Barkod arama işlemi
  const handleBarcodeSearch = () => {
    if (currentBarcode) {
      setSearchTerm(currentBarcode);
      setShowBarcodeGenerator(false);
      toast.success(`🔍 Barkod aranıyor: ${currentBarcode}`, { duration: 2000 });
    }
  };

  // Kategori bazlı barkod önerisi
  const handleSuggestBarcode = async () => {
    if (!formData.category) {
      toast.error('📂 Barkod önerisi için lütfen önce kategori seçiniz', { duration: 3500 });
      return;
    }

    setBarcodeLoading(true);
    try {
      console.log('🎯 Barkod önerisi isteniyor, kategori:', formData.category);
      const response = await productsAPI.suggestBarcode(formData.category);
      console.log('📋 API yanıtı:', response.data);
      
      if (response.data.success) {
        const suggestion = response.data.data;
        setFormData(prev => ({
          ...prev,
          barcode: suggestion.barcode
        }));
        
        toast.success(
          `🏷️ ${suggestion.category} kategorisi için barkod önerisi: ${suggestion.formatted}`,
          { 
            duration: 5000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          }
        );
      } else {
        toast.error(response.data.message || '❌ Barkod önerisi oluşturulamadı. Lütfen tekrar deneyin.', { duration: 4000 });
      }
    } catch (error) {
      console.error('❌ Barkod önerisi hatası:', error);
      
      let message = 'Barkod önerisi alınamadı';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(`⚠️ ${message}`, {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: '#fff',
        }
      });
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (parseFloat(p.costPrice) || 0)), 0);
    
    return {
      totalProducts,
      lowStockProducts,
      totalValue
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stok Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-600">Ürün stoklarını yönetin ve takip edin</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Barkod Tara
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Ürün
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Ürün</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Stok Dışı</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.lowStockProducts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <span className="font-bold text-lg">₺</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Değer</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalValue.toFixed(2)} ₺</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Ortalama Fiyat kartı kaldırıldı */}
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ürün ara (isim, barkod...)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <select
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Tüm Kategoriler</option>
                  {filters.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  <option value="">Tüm Sezonlar</option>
                  {filters.seasons.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sadece stok dışı ürünler</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Ürünler yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Bilgileri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori & Marka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat Bilgileri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Durumu
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.barcode || 'Barkod yok'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category || 'Kategori yok'}</div>
                        <div className="text-sm text-gray-500">{product.brand || 'Marka yok'}</div>
                        <div className="text-xs text-gray-400">{product.season || 'Sezon belirtilmemiş'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Alış:</span> {(parseFloat(product.costPrice) || 0).toFixed(2)} ₺
                        </div>
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Satış:</span> {(parseFloat(product.retailPrice) || 0).toFixed(2)} ₺
                        </div>
                        {product.costPrice && product.retailPrice && parseFloat(product.costPrice) > 0 && (
                          <div className="text-xs text-gray-500">
                            Kar: {((parseFloat(product.retailPrice) - parseFloat(product.costPrice)) / parseFloat(product.costPrice) * 100).toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-sm font-medium ${
                            product.currentStock > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.currentStock || 0} adet
                          </div>
                          {product.currentStock <= 0 && (
                            <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Stok Dışı
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(product);
                            }}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateBarcode(product);
                            }}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Barkod Görüntüle"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product.id);
                            }}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Sayfa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">
                    {showEditModal ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Ürün Bilgileri */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="flex items-center font-medium text-gray-900 mb-4">
                  📝 Ürün Bilgileri
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Ürün adını girin"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori *
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">Kategori Seçin</option>
                          {Array.isArray(categories) && categories.length > 0 ? (
                            categories.map(category => (
                              <option key={category.id || category.name} value={category.name}>
                                {category.name}
                              </option>
                            ))
                          ) : (
                            <option disabled>
                              {loadingCategories ? 'Kategoriler yükleniyor...' : 'Henüz kategori yok'}
                            </option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barkod
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="barcode"
                          value={formData.barcode}
                          onChange={handleInputChange}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Otomatik oluşturulacak"
                        />
                        <button
                          type="button"
                          onClick={handleSuggestBarcode}
                          disabled={!formData.category || barcodeLoading}
                          className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 min-w-max"
                        >
                          {barcodeLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <QrCode size={16} />
                              <span>Öneri</span>
                            </>
                          )}
                        </button>
                      </div>
                      {!formData.category && (
                        <p className="text-xs text-amber-600 mt-1">
                          💡 Önce kategori seçin, barkod önerisi alabilirsiniz
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marka
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Marka adını girin"
                        list="brands"
                      />
                      <datalist id="brands">
                        {filters.brands.map(brand => (
                          <option key={brand} value={brand} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sezon
                      </label>
                      <select
                        name="season"
                        value={formData.season}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Sezon Seçin</option>
                        <option value="Yaz">🌞 Yaz</option>
                        <option value="Kış">❄️ Kış</option>
                        <option value="Dört Mevsim">🔄 Dört Mevsim</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiyat ve Stok */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="flex items-center font-medium text-gray-900 mb-4">
                  💰 Fiyat ve Stok Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="retailPrice"
                      value={formData.retailPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mevcut Stok
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-colors shadow-lg"
                  >
                    {showEditModal ? '✅ Güncelle' : '💾 Kaydet'}
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Barkod Tarayıcı</h2>
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <BarcodeScanner 
                onScan={handleBarcodeScan} 
                onClose={() => setShowBarcodeScanner(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barcode Generator Modal */}
      {showBarcodeGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Barkod Görüntüleyici</h2>
                <button
                  type="button"
                  onClick={() => setShowBarcodeGenerator(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <BarcodeGenerator 
                barcode={currentBarcode}
                productName={currentProductName}
                onClose={() => setShowBarcodeGenerator(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
