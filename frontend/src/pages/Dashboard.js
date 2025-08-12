import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye,
  ShoppingBag,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { customersAPI, balanceAPI, productsAPI, salesAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    customers: {
      total: 0,
      newThisMonth: 0,
      active: 0
    },
    balance: {
      totalDebt: 0,
      totalCredit: 0,
      netBalance: 0,
      recentTransactions: 0
    },
    products: {
      total: 0,
      lowStock: 0,
      outOfStock: 0
    },
    sales: {
      today: 0,
      thisMonth: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [debugMode, setDebugMode] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Her API çağrısını ayrı ayrı yap ve hataları yakala
      let customerStats = { data: {} };
      let balanceStats = { data: {} };
      let transactions = { data: { transactions: [] } };
      let lowStockProducts = { data: { products: [] } };
      let salesStats = { data: {} };
      
      try {
        customerStats = await customersAPI.getStats({ _t: Date.now() });
      } catch (error) {
        console.error('Customer stats error:', error);
      }
      
      try {
        balanceStats = await balanceAPI.getStats({ _t: Date.now() });
      } catch (error) {
        console.error('Balance stats error:', error);
      }
      
      try {
        salesStats = await salesAPI.getStats({ _t: Date.now() });
      } catch (error) {
        console.error('Sales stats error:', error);
      }
      
      try {
        // Son 5 işlemi al (en yeni işlemler)
        transactions = await balanceAPI.getRecentTransactions({ limit: 5 });
      } catch (error) {
        console.error('Transactions error:', error);
      }
      
      try {
        lowStockProducts = await productsAPI.getLowStockProducts();
      } catch (error) {
        console.error('Low stock products error:', error);
      }
      
      setStats({
        customers: {
          total: customerStats.data?.totalCustomers || 0,
          newThisMonth: customerStats.data?.newCustomers || 0,
          active: customerStats.data?.totalCustomers || 0
        },
        balance: {
          totalDebt: balanceStats.data?.allTimeDebts || 0,
          totalCredit: balanceStats.data?.allTimePayments || 0,
          netBalance: balanceStats.data?.allTimeNetBalance || 0,
          recentTransactions: balanceStats.data?.totalTransactions || 0,
          monthlyDebt: balanceStats.data?.totalDebts || 0,
          monthlyCredit: balanceStats.data?.totalPayments || 0
        },
        products: {
          total: 0,
          lowStock: lowStockProducts.data?.products?.length || lowStockProducts.data?.length || 0,
          outOfStock: 0
        },
        sales: {
          today: salesStats.data?.todaySales || 0,
          thisMonth: salesStats.data?.thisMonthSales || 0,
          total: salesStats.data?.totalSales || 0,
          monthlyCount: salesStats.data?.thisMonthSalesCount || 0
        }
      });
      
      setRecentTransactions(transactions.data?.transactions || []);
      
      // Debug modunda başarı mesajı göster
      if (debugMode) {
        toast.success('📊 Dashboard verileri başarıyla yüklendi', { duration: 2500 });
      }
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('📊 Dashboard verileri yüklenemedi. Lütfen tekrar deneyin.', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [debugMode]);

  useEffect(() => {
    fetchDashboardData();

    // Sayfa odaklandığında verileri yenile
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardData]);

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Net bakiye kaldırıldığı için renk yardımcı fonksiyonu gereksiz hale geldi

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="px-6 py-6 sm:px-8 sm:py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kontrol Paneli</h1>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('tr-TR', { 
                  year: 'numeric', 
                  month: 'long' 
                })} - Aylık Özet
              </p>
            </div>
          </div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-3 py-1 text-xs rounded-full border ${
              debugMode 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {debugMode ? 'Debug Açık' : 'Debug Kapalı'}
          </button>
        </div>
      </div>

      {/* Stats Grid - Aylık Odaklı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bu Ayın Satışları */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Bu Ay Satış</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatNumber(stats.sales.thisMonth)} ₺
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">{stats.sales.monthlyCount} işlem</p>
            {debugMode && (
              <p className="text-xs text-green-500">Bugün: {formatNumber(stats.sales.today)} ₺</p>
            )}
          </div>
        </div>

        {/* Bu Ay Alınan Ödemeler */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Bu Ay Alınan Ödeme</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatNumber(stats.balance.monthlyCredit)} ₺
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Toplam: {formatNumber(stats.balance.totalCredit)} ₺</p>
          </div>
        </div>
      </div>

      {/* Quick Actions removed by request */}

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Son Bakiye İşlemleri</h2>
          <div className="flex items-center gap-2">
            {debugMode && (
              <span className="text-xs text-gray-500">
                {recentTransactions.length} işlem yüklendi
              </span>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-700 flex items-center px-2 py-1 rounded border border-gray-300 hover:border-gray-400"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            <button
              onClick={() => navigate('/balance')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Tümünü Gör
            </button>
          </div>
        </div>
        
        {recentTransactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Henüz bakiye işlemi bulunmuyor.</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'payment' ? (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.customer?.firstName} {transaction.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'payment' ? '-' : '+'}{formatNumber(transaction.amount)} ₺
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
