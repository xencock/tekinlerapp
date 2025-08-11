import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { customersAPI, balanceAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Edit, X, Trash2, Calendar } from 'lucide-react';

const CustomerDetail = () => {
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

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuickBalanceModal, setShowQuickBalanceModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({
    type: 'payment',
    amount: '',
    description: '',
    date: '',
    notes: ''
  });
  const [quickBalanceForm, setQuickBalanceForm] = useState({
    type: 'debt',
    amount: '',
    description: ''
  });
  const { id } = useParams();

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const customerResponse = await customersAPI.getCustomer(id);
        setCustomer(customerResponse.data.customer);

        // Fetch balance transactions instead of sales
        const transactionsResponse = await balanceAPI.getCustomerTransactions(id, { limit: 50 });
        // İşlemleri tersine çevir (en eski yukarıda)
        const reversedTransactions = transactionsResponse.data.transactions.reverse();
        setTransactions(reversedTransactions);
      } catch (error) {
        toast.error('Müşteri detayları yüklenemedi');
        console.error('Fetch customer details error:', error);
      } finally {
        setLoading(false);
        setLoadingTransactions(false);
      }
    };

    fetchCustomerDetails();
  }, [id]);

  // Handle quick balance transaction
  const handleQuickBalanceSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickBalanceForm.amount || !quickBalanceForm.description) {
      toast.error('Tutar ve açıklama alanları zorunludur');
      return;
    }

    try {
      const amount = parseFormattedNumber(quickBalanceForm.amount);
      if (amount <= 0) {
        toast.error('Tutar 0\'dan büyük olmalıdır');
        return;
      }

      await balanceAPI.createTransaction({
        customerId: id,
        type: quickBalanceForm.type,
        amount: amount,
        description: quickBalanceForm.description,
        date: new Date().toISOString(),
        notes: ''
      });

      toast.success('Bakiye işlemi başarıyla eklendi');
      setShowQuickBalanceModal(false);
      setQuickBalanceForm({
        type: 'debt',
        amount: '',
        description: ''
      });
      
      // Refresh data
      const customerResponse = await customersAPI.getCustomer(id);
      setCustomer(customerResponse.data.customer);
      
      const transactionsResponse = await balanceAPI.getCustomerTransactions(id, { limit: 50 });
      // İşlemleri tersine çevir (en eski yukarıda)
      const reversedTransactions = transactionsResponse.data.transactions.reverse();
      setTransactions(reversedTransactions);
    } catch (error) {
      console.error('Quick balance error:', error);
      toast.error('Bakiye işlemi eklenemedi');
    }
  };

  // Handle quick balance input change
  const handleQuickBalanceChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setQuickBalanceForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setQuickBalanceForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
      notes: transaction.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await balanceAPI.deleteTransaction(selectedTransaction.id);
      toast.success('İşlem başarıyla silindi');
      setShowDeleteModal(false);
      
      // Refresh transactions
      const transactionsResponse = await balanceAPI.getCustomerTransactions(id, { limit: 50 });
      // İşlemleri tersine çevir (en eski yukarıda)
      const reversedTransactions = transactionsResponse.data.transactions.reverse();
      setTransactions(reversedTransactions);
      
      // Refresh customer data to update balance
      const customerResponse = await customersAPI.getCustomer(id);
      setCustomer(customerResponse.data.customer);
    } catch (error) {
      console.error('Delete transaction error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('İşlem silinemedi');
      }
    }
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.amount || !editFormData.description) {
      toast.error('Tutar ve açıklama alanları zorunludur');
      return;
    }

    try {
      await balanceAPI.updateTransaction(selectedTransaction.id, editFormData);
      toast.success('İşlem başarıyla güncellendi');
      setShowEditModal(false);
      
      // Refresh transactions
      const transactionsResponse = await balanceAPI.getCustomerTransactions(id, { limit: 50 });
      // İşlemleri tersine çevir (en eski yukarıda)
      const reversedTransactions = transactionsResponse.data.transactions.reverse();
      setTransactions(reversedTransactions);
      
      // Refresh customer data to update balance
      const customerResponse = await customersAPI.getCustomer(id);
      setCustomer(customerResponse.data.customer);
    } catch (error) {
      console.error('Update transaction error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('İşlem güncellenemedi');
      }
    }
  };

  // Handle edit form input change
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Parse the formatted input value to a number
      const parsedAmount = parseFormattedNumber(value);
      setEditFormData(prev => ({
        ...prev,
        [name]: parsedAmount
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Get balance status and color
  const getBalanceStatus = () => {
    if (!customer) return { status: 'Sıfır', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    if (customer.balance > 0) return { status: 'Borç', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (customer.balance < 0) return { status: 'Alacak', color: 'text-green-600', bgColor: 'bg-green-100' };
    return { status: 'Sıfır', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  // Get last payment date
  const getLastPaymentInfo = () => {
    if (!transactions || transactions.length === 0) {
      return { date: null, text: 'Henüz ödeme yok', daysSince: null };
    }

    // Find the most recent payment transaction
    const paymentTransactions = transactions.filter(t => t.type === 'payment');
    
    if (paymentTransactions.length === 0) {
      return { date: null, text: 'Henüz ödeme yok', daysSince: null };
    }

    // Sort by date descending and get the most recent
    const lastPayment = paymentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const paymentDate = new Date(lastPayment.date);
    const today = new Date();
    const daysDiff = Math.floor((today - paymentDate) / (1000 * 60 * 60 * 24));

    const formatDate = (date) => {
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    };

    let text = formatDate(paymentDate);
    if (daysDiff === 0) {
      text += ' (Bugün)';
    } else if (daysDiff === 1) {
      text += ' (Dün)';
    } else if (daysDiff <= 7) {
      text += ` (${daysDiff} gün önce)`;
    } else if (daysDiff <= 30) {
      text += ` (${daysDiff} gün önce)`;
    } else if (daysDiff <= 365) {
      const months = Math.floor(daysDiff / 30);
      text += ` (${months} ay önce)`;
    } else {
      const years = Math.floor(daysDiff / 365);
      text += ` (${years} yıl önce)`;
    }

    return { 
      date: paymentDate, 
      text: text, 
      daysSince: daysDiff,
      amount: lastPayment.amount
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-8">Müşteri bulunamadı.</div>;
  }

  const balanceInfo = getBalanceStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{customer?.fullName}</h1>
              <p className="mt-1 text-sm text-gray-600">Müşteri detayları ve işlem geçmişi</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQuickBalanceForm({ type: 'payment', amount: '', description: 'Ödeme alındı' });
                  setShowQuickBalanceModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Ödeme Al
              </button>
              <button
                onClick={() => {
                  setQuickBalanceForm({ type: 'debt', amount: '', description: 'Borç eklendi' });
                  setShowQuickBalanceModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Borç Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats and Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Customer Info Card */}
          <div className="md:col-span-1 bg-white p-5 shadow-sm rounded-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h3>
            <div className="space-y-2 text-sm">
              {customer?.tcNumber && (
                <p><strong className="font-medium text-gray-600">TC Kimlik:</strong> {customer.tcNumber}</p>
              )}
              <p><strong className="font-medium text-gray-600">Telefon:</strong> {customer.phone || 'Yok'}</p>
              <p><strong className="font-medium text-gray-600">Adres:</strong> {customer.address || 'Yok'}</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="md:col-span-1 bg-white p-5 shadow-sm rounded-lg border border-gray-100 flex flex-col justify-center items-center text-center">
            <p className="text-sm font-medium text-gray-500">Güncel Bakiye</p>
            <p className={`text-3xl font-bold ${balanceInfo.color}`}>
              {formatNumberForDisplay(customer?.balance) || '0,00'} ₺
            </p>
            <p className={`text-md font-semibold ${balanceInfo.color}`}>
              {balanceInfo.status}
            </p>
          </div>

          {/* Last Payment Card */}
          <div className="md:col-span-1 bg-white p-5 shadow-sm rounded-lg border border-gray-100 flex flex-col justify-center items-center text-center">
            <p className="text-sm font-medium text-gray-500">Son Ödeme</p>
            {(() => {
              const lastPayment = getLastPaymentInfo();
              return (
                <>
                  <p className="text-xl font-bold text-blue-600">
                    {lastPayment.amount ? `${formatNumberForDisplay(lastPayment.amount)} ₺` : 'Yok'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{lastPayment.text}</p>
                  {lastPayment.daysSince !== null && lastPayment.daysSince > 30 && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      ⚠️ 30+ gün önce
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">İşlem Geçmişi</h2>
          </div>
          
          {loadingTransactions ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-500">Bu müşteriye ait bakiye işlemi bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(transaction.date).toLocaleDateString('tr-TR')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.createdByUser ? (transaction.createdByUser.fullName || transaction.createdByUser.username) : 'Sistem'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'payment' ? `+${formatNumberForDisplay(transaction.amount)}` : `-${formatNumberForDisplay(transaction.amount)}`} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
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

      {/* Quick Balance Modal */}
      {showQuickBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {quickBalanceForm.type === 'debt' ? 'Borç Ekle' : 'Ödeme Al'}
                </h2>
                <button
                  onClick={() => setShowQuickBalanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleQuickBalanceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                <div className="relative">
                  <input
                    type="text"
                    name="amount"
                    value={quickBalanceForm.amount}
                    onChange={handleQuickBalanceChange}
                    placeholder="0,00"
                    pattern="[0-9.,]+"
                    required
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">₺</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={quickBalanceForm.description}
                  onChange={handleQuickBalanceChange}
                  placeholder={quickBalanceForm.type === 'debt' ? 'Borç açıklaması...' : 'Ödeme açıklaması...'}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickBalanceModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${
                    quickBalanceForm.type === 'debt' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {quickBalanceForm.type === 'debt' ? 'Borç Ekle' : 'Ödeme Al'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">İşlem Düzenle</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                <select
                  name="type"
                  value={editFormData.type}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="payment">Ödeme</option>
                  <option value="debt">Borç</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                <input
                  type="text"
                  name="amount"
                  value={formatNumberForDisplay(editFormData.amount)}
                  onChange={handleEditInputChange}
                  placeholder="0,00"
                  pattern="[0-9.,]+"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">İşlem Sil</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Bu işlemi silmek istediğinizden emin misiniz?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Tarih:</strong> {selectedTransaction && new Date(selectedTransaction.date).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Tutar:</strong> {selectedTransaction && parseFloat(selectedTransaction.amount).toFixed(2)} ₺
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Açıklama:</strong> {selectedTransaction?.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerDetail;
