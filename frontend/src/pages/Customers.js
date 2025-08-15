import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus,
  Search, 
  Edit, 
  Trash2,
  Eye,
  X,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  UsersIcon,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { customersAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Customers = () => {
  // Helper functions for number formatting
  const formatNumberForDisplay = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0,00';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return 0;
    // Remove dots (thousands separators) and replace comma with dot for decimal
    const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showCustomersListModal, setShowCustomersListModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeletedCustomers, setShowDeletedCustomers] = useState(false);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [deletedCustomersLoading, setDeletedCustomersLoading] = useState(false);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOutstandingDebt: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  });

  // Ay seçimi için state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  });

  // Türkçe ay isimleri
  const getTurkishMonthName = (monthIndex) => {
    const monthsTR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return monthsTR[monthIndex] || '';
  };

  const formatSelectedMonthTR = (value) => {
    try {
      const [yearStr, monthStr] = value.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (!year || !month) return '';
      return `${getTurkishMonthName(month - 1)} ${year}`;
    } catch {
      return '';
    }
  };

  const generateMonthOptions = (monthsBack = 24) => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < monthsBack; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${getTurkishMonthName(d.getMonth())} ${d.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  };

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    tcNumber: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    preferredColors: [],
    preferredBrands: [],
    smsPermission: true,
    emailPermission: true,
    notes: ''
  });
  const getTodayDateOnly = () => new Date().toISOString().split('T')[0];
  const [balanceFormData, setBalanceFormData] = useState({
    type: 'payment',
    amount: '',
    description: '',
    date: getTodayDateOnly(),
    notes: ''
  });
  const [amountInput, setAmountInput] = useState('');

  // Fetch customers
  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      const response = await customersAPI.getCustomers(params);
      setCustomers(response.data.customers);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('🔄 Müşteriler yüklenemedi. Lütfen tekrar deneyin.', { duration: 4000 });
      console.error('Fetch customers error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortOrder]);


  // Fetch stats
  const fetchStats = React.useCallback(async () => {
    try {
      // Seçilen ay için tarih aralığı hesapla
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      
      const response = await customersAPI.getStats({ 
        startDate, 
        endDate, 
        _t: Date.now() 
      });
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [selectedMonth]);

  // Fetch deleted customers
  const fetchDeletedCustomers = React.useCallback(async () => {
    try {
      console.log('🔍 fetchDeletedCustomers çağrıldı');
      setDeletedCustomersLoading(true);
      const params = {
        page: 1,
        limit: 50,
        search: searchTerm
      };

      console.log('📡 API çağrısı yapılıyor:', params);
      const response = await customersAPI.getDeletedCustomers(params);
      console.log('✅ API yanıtı:', response.data);
      setDeletedCustomers(response.data.customers);
    } catch (error) {
      console.error('❌ Fetch deleted customers error:', error);
      toast.error('🔄 Silinen müşteriler yüklenemedi', { duration: 3000 });
    } finally {
      console.log('🏁 Loading state false yapılıyor');
      setDeletedCustomersLoading(false);
    }
  }, [searchTerm]);

  // Handle restore customer
  const handleRestoreCustomer = async (customerId) => {
    try {
      await customersAPI.restoreCustomer(customerId);
      toast.success('✅ Müşteri başarıyla geri yüklendi', { duration: 3000 });
      fetchDeletedCustomers();
      fetchCustomers();
      fetchStats();
    } catch (error) {
      console.error('Restore customer error:', error);
      if (error.response?.data?.conflicts) {
        const conflicts = error.response.data.conflicts.join(', ');
        toast.error(`❌ Müşteri geri yüklenemedi: ${conflicts}`, { duration: 5000 });
      } else {
        toast.error('❌ Müşteri geri yüklenemedi', { duration: 3000 });
      }
    }
  };

  // Handle permanent delete customer
  const handlePermanentDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`⚠️ "${customerName}" müşterisini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      try {
        await customersAPI.permanentDeleteCustomer(customerId);
        toast.success('🗑️ Müşteri kalıcı olarak silindi', { duration: 3000 });
        fetchDeletedCustomers();
        fetchStats();
      } catch (error) {
        console.error('Permanent delete customer error:', error);
        if (error.response?.data?.message) {
          toast.error(`❌ ${error.response.data.message}`, { duration: 5000 });
        } else {
          toast.error('❌ Müşteri kalıcı olarak silinemedi', { duration: 3000 });
        }
      }
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('⏰ Oturum süresi dolmuş. Lütfen tekrar giriş yapın.', { duration: 5000 });
      return;
    }
    
    // Basic validation
    if (!formData.firstName.trim()) {
      toast.error('📝 Ad alanı zorunludur', { duration: 3000 });
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('📝 Soyad alanı zorunludur', { duration: 3000 });
      return;
    }
    // Telefon formatı validasyonu (eğer girilmişse)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        toast.error('📞 Geçerli bir telefon numarası girin (örn: 0555 123 45 67)', { duration: 4000 });
        return;
      }
      
      if (formData.phone.trim().length < 10 || formData.phone.trim().length > 15) {
        toast.error('📞 Telefon numarası 10-15 karakter arasında olmalıdır', { duration: 4000 });
        return;
      }
    }
    
    try {
      setLoading(true);
      
      if (selectedCustomer) {
        // Update existing customer
        await customersAPI.updateCustomer(selectedCustomer.id, formData);
        toast.success('✅ Müşteri başarıyla güncellendi', { duration: 3000 });
      } else {
        // Create new customer
        await customersAPI.createCustomer(formData);
        toast.success('✅ Müşteri başarıyla oluşturuldu', { duration: 3000 });
      }
      
      setShowAddModal(false);
      setSelectedCustomer(null);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        tcNumber: '',
        address: '',
        city: '',
        district: '',
        postalCode: '',
        preferredColors: [],
        preferredBrands: [],
        smsPermission: true,
        emailPermission: true,
        notes: ''
      });
      
      // Refresh data
      fetchCustomers();
      fetchStats(); // İstatistikleri güncelle
      
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response?.data?.details) {
        // Validation hatalarını detaylı göster
        const validationErrors = error.response.data.details;
        validationErrors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`, { duration: 5000 });
        });
      } else if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`, { duration: 5000 });
      } else {
        toast.error('❌ Müşteri kaydedilemedi', { duration: 3000 });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (customerId) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await customersAPI.deleteCustomer(customerId);
        toast.success('Müşteri silindi');
        fetchCustomers();
        fetchStats();
      } catch (error) {
        toast.error('Müşteri silinemedi');
        console.error('Delete error:', error);
      }
    }
  };

  // Handle edit
  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      tcNumber: customer.tcNumber || '',
      address: customer.address || '',
      city: customer.city || '',
      district: customer.district || '',
      postalCode: customer.postalCode || '',
      preferredColors: customer.preferredColors || [],
      preferredBrands: customer.preferredBrands || [],
      smsPermission: customer.smsPermission !== false,
      emailPermission: customer.emailPermission !== false,
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };



  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    
    if (!balanceFormData.amount || !balanceFormData.description) {
      toast.error('Tutar ve açıklama alanları zorunludur');
      return;
    }

    try {
      await customersAPI.addBalanceTransaction(selectedCustomer.id, balanceFormData);
      toast.success(`Bakiye ${balanceFormData.type === 'payment' ? 'eklendi' : 'çıkarıldı'}`);
      setShowBalanceModal(false);
      setBalanceFormData({
        type: 'payment',
        amount: '',
        description: '',
        date: getTodayDateOnly(),
        notes: ''
      });
      setAmountInput('');
      fetchCustomers();
      fetchStats();
    } catch (error) {
      console.error('Balance transaction error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Bakiye işlemi eklenemedi');
      }
    }
  };

  const handleBalanceInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setBalanceFormData(prev => ({
        ...prev,
        [name]: value,
        description: value === 'payment' ? 'Ödeme alındı' : ''
      }));
    } else {
      setBalanceFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to desc
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Amount input handlers for better UX
  const sanitizeAmountInputTR = (input) => {
    if (!input) return '';
    // Allow digits and comma/dot, convert dot to comma
    let value = input.replace(/\./g, ',').replace(/[^0-9,]/g, '');
    // Keep only first comma
    const parts = value.split(',');
    value = parts[0] + (parts.length > 1 ? ',' + parts.slice(1).join('').slice(0, 2) : '');
    return value;
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value;
    const clean = sanitizeAmountInputTR(raw);
    setAmountInput(clean);
    const numeric = parseFormattedNumber(clean);
    setBalanceFormData(prev => ({ ...prev, amount: numeric }));
  };

  const handleAmountBlur = () => {
    const numeric = parseFormattedNumber(amountInput);
    if (!isNaN(numeric)) {
      setAmountInput(formatNumberForDisplay(numeric));
    } else {
      setAmountInput('');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      tcNumber: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      preferredColors: [],
      preferredBrands: [],
      smsPermission: true,
      emailPermission: true,
      notes: ''
    });
    setBalanceFormData({
      type: 'payment',
      amount: '',
      description: '',
      date: getTodayDateOnly(),
      notes: ''
    });
    setSelectedCustomer(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [currentPage, searchTerm, fetchCustomers, fetchStats, selectedMonth]);

  // Otomatik istatistik güncelleme (her 30 saniyede bir - daha az sıklıkta)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Satış silme işleminden sonra istatistikleri güncelle
  useEffect(() => {
    const handleSaleDeleted = () => {
      console.log('Satış silindi, istatistikler güncelleniyor...');
      fetchStats();
    };

    // Custom event listener ekle
    window.addEventListener('saleDeleted', handleSaleDeleted);
    
    // Ayrıca sayfa focus olduğunda da güncelle
    const handleFocus = () => {
      console.log('Sayfa focus oldu, istatistikler güncelleniyor...');
      fetchStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('saleDeleted', handleSaleDeleted);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats]);

  // Sayfa görünür olduğunda istatistikleri güncelle
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Sayfa görünür oldu, istatistikler güncelleniyor...');
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats]);

  useEffect(() => {
    console.log('🔄 useEffect showDeletedCustomers değişti:', showDeletedCustomers);
    if (showDeletedCustomers) {
      console.log('📥 Silinen müşteriler yükleniyor...');
      fetchDeletedCustomers();
    }
  }, [showDeletedCustomers, fetchDeletedCustomers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Müşteri Yönetimi</h1>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600">{formatSelectedMonthTR(selectedMonth)} - Aylık Özet</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">Müşteri bilgilerini yönetin ve takip edin</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchStats}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="İstatistikleri Yenile"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </button>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {generateMonthOptions(12).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    tcNumber: '',
                    address: '',
                    city: '',
                    district: '',
                    postalCode: '',
                    preferredColors: [],
                    preferredBrands: [],
                    smsPermission: true,
                    emailPermission: true,
                    notes: ''
                  });
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Müşteri
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className="bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onDoubleClick={() => setShowCustomersListModal(true)}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Müşteri</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCustomers && typeof stats.totalCustomers === 'number' 
                        ? stats.totalCustomers 
                        : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Alacak</dt>
                    <dd className="text-lg font-medium text-gray-900 text-red-600">
                      {typeof stats.totalOutstandingDebt === 'number' 
                        ? formatNumberForDisplay(stats.totalOutstandingDebt)
                        : '0,00'} ₺
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Satış</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalRevenue && typeof stats.totalRevenue === 'number' 
                        ? formatNumberForDisplay(stats.totalRevenue)
                        : '0,00'} ₺
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Müşteri ara (ad, telefon, kod...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowDeletedCustomers(!showDeletedCustomers)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  showDeletedCustomers
                    ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {showDeletedCustomers ? 'Aktif Müşteriler' : 'Silinen Müşteriler'}
              </button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Müşteriler yükleniyor...</p>
            </div>
          ) : showDeletedCustomers ? (
            deletedCustomersLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Silinen müşteriler yükleniyor...</p>
              </div>
            ) : deletedCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <UsersIcon className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600">Silinen müşteri bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Silinen Müşteri Bilgileri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bakiye
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Silinen Tarih
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deletedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition-colors bg-red-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.phone || 'Telefon yok'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.tcNumber ? `TC: ${customer.tcNumber}` : 'TC bilgisi yok'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-medium">
                            <span className={customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-gray-600'}>
                              {formatNumberForDisplay(customer.balance) || '0,00'} ₺
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(customer.updatedAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleRestoreCustomer(customer.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              title="Geri Yükle"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Geri Yükle
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteCustomer(customer.id, customer.fullName)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Kalıcı Sil"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Kalıcı Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {showDeletedCustomers ? 'Silinen Müşteri Bilgileri' : 'Müşteri Bilgileri'}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('balance')}
                    >
                      <div className="flex items-center gap-1">
                        Bakiye
                        <div className="flex flex-col">
                          <ChevronUp 
                            size={12} 
                            className={`${sortBy === 'balance' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                          />
                          <ChevronDown 
                            size={12} 
                            className={`${sortBy === 'balance' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'} -mt-1`} 
                          />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {showDeletedCustomers ? 'Silinen Tarih' : 'Oluşturan'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {showDeletedCustomers ? (
                    // Silinen müşteriler listesi
                    deletedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition-colors bg-red-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.phone || 'Telefon yok'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.tcNumber ? `TC: ${customer.tcNumber}` : 'TC bilgisi yok'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-medium">
                            <span className={customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-gray-600'}>
                              {formatNumberForDisplay(customer.balance) || '0,00'} ₺
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(customer.updatedAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreCustomer(customer.id);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              title="Geri Yükle"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Geri Yükle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Aktif müşteriler listesi
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onDoubleClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.phone || 'Telefon yok'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.tcNumber ? `TC: ${customer.tcNumber}` : 'TC bilgisi yok'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-medium">
                            <span className={customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-gray-600'}>
                              {formatNumberForDisplay(customer.balance) || '0,00'} ₺
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.createdByUser ? customer.createdByUser.fullName || customer.createdByUser.username : 'Sistem'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/${customer.id}`);
                              }}
                              className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              title="Detayları Görüntüle"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(customer);
                              }}
                              className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(customer.id);
                              }}
                              className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {showEditModal ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0555 123 45 67 (opsiyonel)"
                    pattern="[0-9+\-\s()]+"
                    minLength="10"
                    maxLength="15"
                    className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Adres bilgisi (opsiyonel)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TC Kimlik No</label>
                    <input
                      type="text"
                      name="tcNumber"
                      value={formData.tcNumber}
                      onChange={handleInputChange}
                      maxLength="11"
                      pattern="[0-9]{11}"
                      placeholder="TC Kimlik No (opsiyonel)"
                      className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {showEditModal ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Transaction Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCustomer?.fullName} - Bakiye İşlemi
              </h2>
            </div>
            <form onSubmit={handleBalanceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                <select
                  name="type"
                  value={balanceFormData.type}
                  onChange={handleBalanceInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="debt">Satış</option>
                  <option value="payment">Ödeme Al</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  name="date"
                  value={balanceFormData.date}
                  onChange={handleBalanceInputChange}
                  max={getTodayDateOnly()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                <div className="relative">
                  <input
                    type="text"
                    name="amount"
                    value={amountInput}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    placeholder="0,00"
                    inputMode="decimal"
                    pattern="[0-9.,]+"
                    className="w-full pr-10 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-lg font-semibold"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">₺</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Güncel Bakiye:</p>
                <p className={`text-lg font-bold ${selectedCustomer?.balance > 0 ? 'text-red-600' : selectedCustomer?.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {formatNumberForDisplay(selectedCustomer?.balance) || '0,00'} ₺
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={balanceFormData.description}
                  onChange={handleBalanceInputChange}
                  placeholder={balanceFormData.type === 'payment' ? 'Ödeme açıklaması' : 'Satış açıklaması'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  name="notes"
                  value={balanceFormData.notes}
                  onChange={handleBalanceInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="İşlem hakkında notlar (opsiyonel)"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBalanceModal(false);
                    setBalanceFormData({
                      type: 'payment',
                      amount: '',
                      description: '',
                      date: getTodayDateOnly(),
                      notes: ''
                    });
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {balanceFormData.type === 'payment' ? 'Ödeme Al' : 'Satış'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List Modal */}
      {showCustomersListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Müşteri Listesi (Alfabetik Sıralı)</h2>
                <button
                  onClick={() => setShowCustomersListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers
                  .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'))
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setShowCustomersListModal(false);
                        navigate(`/customers/${customer.id}`);
                      }}
                    >
                      <div className="font-medium text-gray-900">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                      {customer.tcNumber && (
                        <div className="text-xs text-gray-400">TC: {customer.tcNumber}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
