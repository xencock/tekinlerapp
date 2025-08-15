import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { customersAPI, balanceAPI, salesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Edit, X, Trash2, Calendar, Receipt } from 'lucide-react';

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
  const getTodayDateOnly = () => new Date().toISOString().split('T')[0];
  const [quickBalanceForm, setQuickBalanceForm] = useState({
    type: 'debt',
    amount: '',
    description: '',
    date: getTodayDateOnly()
  });
  
  // Satış özeti state'i
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState('all'); // 'all' veya 'monthly'
  const [loadingSalesSummary, setLoadingSalesSummary] = useState(false);
  
  const { id } = useParams();

  // Satış işlemi kontrolü: yalnızca satıştan kaynaklanan borçları satış olarak işaretle
  const isSaleTransaction = (transaction) => {
    if (!transaction || transaction.type !== 'debt') return false;
    const desc = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const notes = (transaction.notes || '').toLowerCase();
    return (
      category === 'satış' ||
      desc.includes('satış') ||
      notes.includes('satış fatura no')
    );
  };

  // Satış ID'sini description'dan çıkart
  const extractSaleId = (transaction) => {
    // Eski format: description 'Satış #123'
    if (transaction.description) {
      const oldMatch = transaction.description.match(/Satış #(\d+)/);
      if (oldMatch) return parseInt(oldMatch[1]);
    }
    // Yeni format: notes 'Satış fatura no: 123'
    if (transaction.notes) {
      const notesMatch = transaction.notes.match(/Satış fatura no:\s*(\d+)/);
      if (notesMatch) return parseInt(notesMatch[1]);
    }
    return null;
  };

  // Satış kağıdı yazdırma fonksiyonu
  const printSaleReceipt = async (saleId, customerData = customer, targetWindow) => {
    try {
      console.log('Satış detayları getiriliyor, ID:', saleId);
      
      // Satış detaylarını al
      const saleResponse = await salesAPI.getSaleDetails(saleId);
      console.log('API yanıtı:', saleResponse);
      
      const sale = saleResponse.data.sale;
      
      if (!sale) {
        console.error('Sale data bulunamadı:', saleResponse.data);
        toast.error('Satış bilgileri bulunamadı');
        return;
      }

      console.log('Satış verisi:', sale);

      const customerName = customerData ? customerData.fullName : 'Müşteri Adı Belirtilmemiş';
      const saleDate = new Date(sale.createdAt);
      const currentDate = saleDate.toLocaleDateString('tr-TR');
      const currentTime = saleDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      // Eski bakiye: bu satış öncesi bakiye olmalı.
      // Eğer BalanceTransaction listesi varsa, bu satışın borcu eklenmeden önceki değeri tahmin etmek için çıkarabiliriz.
      // Güvenli yaklaşım: mevcut müşteri bakiyesinden satış tutarını düş.
      const totalAmount = parseFloat(sale.totalAmount || 0);
      const currentBalance = customerData ? Number(customerData.balance || 0) : 0;
      const previousBalance = (currentBalance - totalAmount);
      const grandTotal = (previousBalance + totalAmount).toFixed(2);

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Satış Fişi - ${customerName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; margin: 0; padding: 0; }
            .page { width: 210mm; max-width: 100%; margin: 0 auto; padding: 12mm; }
            .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1.5px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
            .brand { font-weight: 800; font-size: 20px; letter-spacing: 1px; }
            .company-info { font-size: 11px; line-height: 1.4; margin-top: 4px; }
            .title { font-weight: 700; font-size: 16px; text-transform: uppercase; }
            .meta { font-size: 11px; margin-top: 6px; text-align: right; }
            .section { border: 1px solid #000; padding: 10px; margin-bottom: 12px; }
            .section-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
            .field { display: flex; gap: 10px; font-size: 12px; margin-bottom: 6px; }
            .field-label { width: 140px; color: #000; }
            .field-line { flex: 1; border-bottom: 1px dotted #000; }
            table { width: 100%; border-collapse: collapse; }
            .thead th { font-size: 12px; font-weight: 700; border: 1px solid #000; padding: 6px 6px; text-align: left; }
            .cell { border: 1px solid #000; padding: 6px 6px; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals { margin-top: 10px; display: flex; justify-content: flex-end; }
            .total-box { width: 280px; border: 1px solid #000; }
            .total-row { display: flex; }
            .total-row div { flex: 1; border-right: 1px solid #000; padding: 6px; font-size: 12px; }
            .total-row div:last-child { border-right: none; text-align: right; font-weight: 700; }
            .print-actions { margin-top: 14px; text-align: right; }
            .btn { border: 1px solid #000; background: #fff; color: #000; padding: 8px 14px; font-size: 12px; cursor: pointer; }
            @page { size: A4; margin: 12mm; }
            @media print { .btn, .print-actions { display: none; } .page { box-shadow: none; padding: 0; } }
            @media screen and (max-width: 768px) { .page { width: 148mm; padding: 8mm; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <div class="brand"></div>
                <div class="company-info">
                  Mağaza | Adres | Telefon<br/>
                  Web: tekinler.example
                </div>
              </div>
              <div style="text-align:right;">
                <div class="title">SATIŞ FİŞİ</div>
                <div class="meta">Tarih: ${currentDate} ${currentTime}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Müşteri Bilgileri</div>
              <div class="field"><div class="field-label">Adı Soyadı / Ünvanı</div><div class="field-line">${customerName}</div></div>
              <div class="field"><div class="field-label">Telefon</div><div class="field-line">${customerData && customerData.phone ? customerData.phone : ''}</div></div>
            </div>

            <table>
              <thead class="thead">
                <tr>
                  <th style="width: 18%">Kod No</th>
                  <th>Ürün Adı</th>
                  <th style="width: 12%" class="text-center">Adet</th>
                  <th style="width: 16%" class="text-right">Birim Fiyat</th>
                  <th style="width: 18%" class="text-right">Toplam Fiyat</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map(item => `
                  <tr>
                    <td class="cell text-center">${item.product ? item.product.barcode || '' : ''}</td>
                    <td class="cell">${item.product ? item.product.name : 'Ürün'}</td>
                    <td class="cell text-center">${item.quantity}</td>
                    <td class="cell text-right">${parseFloat(item.unitPrice).toFixed(2)} ₺</td>
                    <td class="cell text-right">${parseFloat(item.totalPrice).toFixed(2)} ₺</td>
                  </tr>
                `).join('')}
                ${Array.from({ length: Math.max(0, 14 - sale.items.length) }).map(() => `
                  <tr>
                    <td class="cell">&nbsp;</td>
                    <td class="cell">&nbsp;</td>
                    <td class="cell">&nbsp;</td>
                    <td class="cell">&nbsp;</td>
                    <td class="cell">&nbsp;</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-box">
                <div class="total-row"><div>Satış Tutarı</div><div>${parseFloat(sale.totalAmount).toFixed(2)} ₺</div></div>
                <div class="total-row"><div>Eski Bakiye</div><div>${previousBalance.toFixed(2)} ₺</div></div>
                <div class="total-row"><div>Genel Toplam</div><div>${grandTotal} ₺</div></div>
              </div>
            </div>

            <div class="print-actions">
              <button class="btn" onclick="window.print()">Yazdır</button>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Yeni sekmede aç (mümkünse daha önce kullanıcı tıklamasıyla açılmış pencereyi kullan)
      const printWindow = targetWindow || window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (!printWindow) {
        toast.error('Yazdırma penceresi engellendi. Lütfen tarayıcıda pop-up izni verin.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      
    } catch (error) {
      console.error('Sale receipt error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Satış fişi yüklenemedi.';
      if (error.response?.status === 404) {
        errorMessage = 'Satış kaydı bulunamadı.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Hata: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Satış işlemine çift tıklama handler'ı
  const handleSaleDoubleClick = async (transaction) => {
    console.log('Çift tıklama yapıldı, transaction:', transaction);
    
    if (!isSaleTransaction(transaction)) {
      console.log('Bu bir satış işlemi değil');
      return;
    }
    
    const saleId = extractSaleId(transaction);
    console.log('Çıkarılan sale ID:', saleId, 'Description:', transaction.description);
    
    if (saleId) {
      // Pop-up engelleyiciye yakalanmamak için tıklama sırasında aç
      const preOpenedWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (preOpenedWindow) {
        preOpenedWindow.document.open();
        preOpenedWindow.document.write('<!DOCTYPE html><html><head><title>Fiş hazırlanıyor...</title></head><body><p style="font-family:Arial;padding:16px;">Fiş hazırlanıyor...</p></body></html>');
        preOpenedWindow.document.close();
      } else {
        toast.error('Yazdırma penceresi engellendi. Lütfen tarayıcıda pop-up izni verin.');
      }
      await printSaleReceipt(saleId, undefined, preOpenedWindow);
    } else {
      console.error('Sale ID çıkarılamadı:', transaction.description);
      toast.error('Satış ID\'si bulunamadı');
    }
  };

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
        
        // Fetch sales summary
        await fetchSalesSummary('all');
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

  // Fetch sales summary
  const fetchSalesSummary = async (period = 'all') => {
    try {
      setLoadingSalesSummary(true);
      const response = await customersAPI.getCustomerSalesSummary(id, period);
      setSalesSummary(response.data);
    } catch (error) {
      console.error('Fetch sales summary error:', error);
      toast.error('Satış özeti alınamadı');
    } finally {
      setLoadingSalesSummary(false);
    }
  };

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
        category: quickBalanceForm.type === 'debt' ? 'Manuel' : 'Ödeme',
        date: quickBalanceForm.date || new Date().toISOString(),
        notes: ''
      });

      toast.success('Bakiye işlemi başarıyla eklendi');
      setShowQuickBalanceModal(false);
      setQuickBalanceForm({
        type: 'debt',
        amount: '',
        description: '',
        date: getTodayDateOnly()
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
                  setQuickBalanceForm({ type: 'payment', amount: '', description: 'Ödeme alındı', date: getTodayDateOnly() });
                  setShowQuickBalanceModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Ödeme Al
              </button>
              <button
                onClick={() => {
                  setQuickBalanceForm({ type: 'debt', amount: '', description: 'Borç eklendi', date: getTodayDateOnly() });
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
                    <span className="ml-2 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      30+ gün önce
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Sales Summary Section */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Satış Özeti</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSalesPeriod('all');
                    fetchSalesSummary('all');
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    salesPeriod === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Tüm Satışlar
                </button>
                <button
                  onClick={() => {
                    setSalesPeriod('monthly');
                    fetchSalesSummary('monthly');
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    salesPeriod === 'monthly'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Bu Ay
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingSalesSummary ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Satış özeti yükleniyor...</p>
              </div>
            ) : salesSummary ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Toplam Satış Sayısı */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Toplam Satış</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {salesSummary.summary.totalSales}
                    </p>
                  </div>
                  
                  {/* Toplam Satış Tutarı */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatNumberForDisplay(salesSummary.summary.totalAmount)} ₺
                    </p>
                  </div>
                  
                  {/* Aylık Ortalama */}
                  {salesPeriod === 'monthly' && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Aylık Ortalama</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatNumberForDisplay(salesSummary.summary.monthlyAverage)} ₺
                      </p>
                    </div>
                  )}
                  
                  {/* Satış Yöntemi */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Satış Yöntemi</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(salesSummary.summary.paymentMethods).map(([method, count]) => (
                        <div key={method} className="text-sm">
                          <span className="font-medium text-gray-700">
                            {method === 'cash' ? 'Peşin' : method === 'credit' ? 'Vadeli' : method}:
                          </span>
                          <span className="ml-1 text-gray-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Satış Listesi */}
                {salesSummary.sales.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      {salesPeriod === 'monthly' ? 'Bu Ayın Satışları' : 'Tüm Satışlar'}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tutar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satış Yöntemi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notlar
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salesSummary.sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(sale.date).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {formatNumberForDisplay(sale.totalAmount)} ₺
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sale.paymentMethod === 'cash' ? 'Peşin' : sale.paymentMethod === 'credit' ? 'Vadeli' : sale.paymentMethod}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {sale.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Satış verisi bulunamadı.
              </div>
            )}
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
                  {transactions.map((transaction) => {
                    const isSale = isSaleTransaction(transaction);
                    return (
                      <tr 
                        key={transaction.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          isSale ? 'cursor-pointer hover:bg-blue-50' : ''
                        }`}
                        onDoubleClick={() => handleSaleDoubleClick(transaction)}
                        title={isSale ? 'Çift tıklayarak satış fişini görüntüleyin' : ''}
                      >
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
                          <div className={`text-sm font-medium ${isSale ? 'text-blue-700' : 'text-gray-900'} flex items-center gap-2`}>
                            {isSale && <Receipt className="w-4 h-4 text-blue-600" />}
                             {isSale ? 'Satış' : transaction.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.createdByUser ? (transaction.createdByUser.fullName || transaction.createdByUser.username) : 'Sistem'}
                          </div>
                          {isSale && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Fişi görüntülemek için çift tıklayın
                            </div>
                          )}
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
                            {isSale && (
                              <button
                                onClick={() => handleSaleDoubleClick(transaction)}
                                className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="Satış Fişini Görüntüle"
                              >
                                <Receipt className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-full text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
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
                    );
                  })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  name="date"
                  value={quickBalanceForm.date}
                  onChange={handleQuickBalanceChange}
                  max={getTodayDateOnly()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
