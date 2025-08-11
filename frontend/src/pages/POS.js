import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Plus, Minus, Trash2, TrendingUp, TrendingDown, Camera, Scan } from 'lucide-react';
import { productsAPI } from '../utils/api';
import { customersAPI } from '../utils/api';
import { salesAPI } from '../utils/api';
import { balanceAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import BarcodeScanner from '../components/BarcodeScanner';

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    type: 'debt',
    amount: '',
    description: '',
    category: 'Satış'
  });

  // Refs for auto-focus
  const barcodeInputRef = useRef(null);

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
    const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Get balance status and color
  const getBalanceStatus = (balance) => {
    if (balance > 0) return { status: 'Borç', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (balance < 0) return { status: 'Alacak', color: 'text-green-600', bgColor: 'bg-green-100' };
    return { status: 'Sıfır', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  // Handle quick balance transaction
  const handleQuickBalanceSubmit = async (e) => {
    e.preventDefault();
    
    if (!balanceForm.amount || !balanceForm.description) {
      toast.error('Tutar ve açıklama alanları zorunludur', { duration: 3500 });
      return;
    }

    try {
      const amount = parseFormattedNumber(balanceForm.amount);
      if (amount <= 0) {
        toast.error('Tutar 0\'dan büyük olmalıdır', { duration: 3500 });
        return;
      }

      await balanceAPI.createTransaction({
        customerId: selectedCustomer.id,
        type: balanceForm.type,
        amount: amount,
        description: balanceForm.description,
        category: balanceForm.category,
        date: new Date().toISOString(),
        notes: ''
      });

      toast.success('Bakiye işlemi başarıyla eklendi', { duration: 3000 });
      setShowBalanceModal(false);
      setBalanceForm({
        type: 'debt',
        amount: '',
        description: '',
        category: 'Satış'
      });
      
      // Refresh customer data to update balance
      const customerResponse = await customersAPI.getCustomer(selectedCustomer.id);
      setSelectedCustomer(customerResponse.data.customer);
    } catch (error) {
      console.error('Quick balance error:', error);
      toast.error('❌ Bakiye işlemi eklenemedi. Lütfen tekrar deneyin.', { duration: 4000 });
    }
  };

  // Handle balance form input change
  const handleBalanceChange = (e) => {
    const { name, value } = e.target;
    setBalanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchProducts = async (term) => {
    if (!term.trim()) {
      setSearchedProducts([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      // POS için özel arama endpoint'ini kullan
      const response = await productsAPI.searchProductsForPOS({ 
        search: term, 
        limit: 50 // POS için yeterli limit
      });
      setSearchedProducts(response.data.products);
      
      // If only one product found and it's an exact barcode match, auto-add to cart
      if (response.data.products.length === 1 && 
          response.data.products[0].barcode === term.trim()) {
        addToCart(response.data.products[0]);
        setSearchTerm('');
        setSearchedProducts([]);
        toast.success(`${response.data.products[0].name} sepete eklendi`, { duration: 2500 });
      }
      
      // If exact barcode match found among multiple results, prioritize it
      if (response.data.products.length > 1) {
        const exactMatch = response.data.products.find(p => p.barcode === term.trim());
        if (exactMatch) {
          toast.success(`Tam barkod eşleşmesi: ${exactMatch.name}`, { duration: 3000 });
        }
      }
      
      // Eğer hiç sonuç bulunamadıysa kullanıcıya bilgi ver
      if (response.data.products.length === 0) {
        // Barkod araması için özel mesaj
        if (/^\d+$/.test(term.trim())) {
          if (term.trim().length === 12) {
            // 12 haneli barkod için check digit hesaplama önerisi
            let sum = 0;
            for (let i = 0; i < 12; i++) {
              const digit = parseInt(term.trim()[i]);
              sum += digit * (i % 2 === 0 ? 1 : 3);
            }
            const checkDigit = (10 - (sum % 10)) % 10;
            const suggestedBarcode = term.trim() + checkDigit.toString();
            toast.error(`🔍 Bu barkod ile ürün bulunamadı. Önerilen: ${suggestedBarcode}`, { duration: 4500 });
          } else if (term.trim().length === 13) {
            // 13 haneli barkod için check digit kontrolü
            let sum = 0;
            for (let i = 0; i < 12; i++) {
              const digit = parseInt(term.trim()[i]);
              sum += digit * (i % 2 === 0 ? 1 : 3);
            }
            const expectedCheckDigit = (10 - (sum % 10)) % 10;
            const actualCheckDigit = parseInt(term.trim()[12]);
            
            if (expectedCheckDigit !== actualCheckDigit) {
              const correctedBarcode = term.trim().substring(0, 12) + expectedCheckDigit.toString();
              toast.error(`⚠️ Barkod hatası düzeltildi: ${correctedBarcode}`, { duration: 4000 });
            } else {
              toast.error('🚫 Bu barkod ile ürün bulunamadı. Lütfen kontrol edin.', { duration: 4000 });
            }
          } else {
            toast.error('🚫 Bu barkod ile ürün bulunamadı. Lütfen kontrol edin.', { duration: 4000 });
          }
        } else {
          toast.error('🔍 Ürün bulunamadı', { duration: 3500 });
        }
      }
    } catch (error) {
      console.error('Product search error:', error);
      toast.error('⚠️ Ürün arama hatası. Lütfen tekrar deneyin.', { duration: 4000 });
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedProductSearch = useCallback(
    debounce(async (term) => {
      if (term.length >= 1) {
        await searchProducts(term);
      } else {
        setSearchedProducts([]);
      }
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleManualSearch = () => {
    if (searchTerm.trim()) {
      // Barkod düzeltme ve tamamlama
      let searchTermToUse = searchTerm.trim();
      
      if (/^\d{12}$/.test(searchTermToUse)) {
        // 12 haneli barkod için check digit hesaplama
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(searchTermToUse[i]);
          sum += digit * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        const completedBarcode = searchTermToUse + checkDigit.toString();
        
        // Kullanıcıya bilgi ver
        toast.success(`✨ Barkod otomatik tamamlandı: ${completedBarcode}`, { duration: 3000 });
        setSearchTerm(completedBarcode);
        searchTermToUse = completedBarcode;
      } else if (/^\d{13}$/.test(searchTermToUse)) {
        // 13 haneli barkod için check digit kontrolü
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(searchTermToUse[i]);
          sum += digit * (i % 2 === 0 ? 1 : 3);
        }
        const expectedCheckDigit = (10 - (sum % 10)) % 10;
        const actualCheckDigit = parseInt(searchTermToUse[12]);
        
        if (expectedCheckDigit !== actualCheckDigit) {
          const correctedBarcode = searchTermToUse.substring(0, 12) + expectedCheckDigit.toString();
          toast.success(`🔧 Barkod düzeltildi: ${correctedBarcode}`, { duration: 3000 });
          setSearchTerm(correctedBarcode);
          searchTermToUse = correctedBarcode;
        }
      }
      
      searchProducts(searchTermToUse);
    } else {
      toast.error('📝 Lütfen bir arama terimi girin', { duration: 3000 });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchedProducts([]);
  };

  const debouncedCustomerSearch = useCallback(
    debounce(async (term) => {
      if (term.length > 2) {
        try {
          const response = await customersAPI.getCustomers({ search: term, limit: 5 });
          setSearchedCustomers(response.data.customers);
        } catch (error) {
          console.error('Customer search error:', error);
        }
      } else {
        setSearchedCustomers([]);
      }
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    debouncedProductSearch(searchTerm);
  }, [searchTerm, debouncedProductSearch]);

  useEffect(() => {
    debouncedCustomerSearch(customerSearch);
  }, [customerSearch, debouncedCustomerSearch]);

  // Auto-focus on barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Handle barcode scanner result
  const handleBarcodeScanned = (barcode) => {
    setSearchTerm(barcode);
    setShowBarcodeScanner(false);
    // Auto search for the scanned barcode
    searchProducts(barcode);
    toast.success(`Barkod tarandı: ${barcode}`, { duration: 2000 });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }
      
      // F5 to open barcode scanner
      if (e.key === 'F5') {
        e.preventDefault();
        setShowBarcodeScanner(true);
      }
      
      // Escape to close scanner
      if (e.key === 'Escape' && showBarcodeScanner) {
        setShowBarcodeScanner(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBarcodeScanner]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.currentStock) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast.error('Maksimum stok adedine ulaşıldı', { duration: 3500 });
          return prevCart;
        }
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
    setSearchedProducts([]);
    
    // Auto-focus back to barcode input for next scan
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + amount;
          if (newQuantity > 0 && newQuantity <= item.currentStock) {
            return { ...item, quantity: newQuantity };
          }
          if (newQuantity > item.currentStock) {
            toast.error('Maksimum stok adedine ulaşıldı', { duration: 3500 });
          }
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setSearchedCustomers([]);
  };

  const cartSubtotal = cart.reduce((total, item) => {
    const price = item.hasDiscount ? item.discountPrice : item.retailPrice;
    return total + price * item.quantity;
  }, 0);

  const cartTotal = cartSubtotal; // Vergi hesaplaması kaldırıldı

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş. Lütfen ürün ekleyin.', { duration: 3500 });
      return;
    }

    // Veresiye satış için müşteri kontrolü
    if (paymentMethod === 'Veresiye' && !selectedCustomer) {
      toast.error('Veresiye satış için müşteri seçimi zorunludur.', { duration: 4000 });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        notes: ''
      };

      await salesAPI.createSale(saleData);
      
      // Veresiye satış için özel mesaj
      if (paymentMethod === 'Veresiye') {
        toast.success(`Veresiye satış tamamlandı! ${cartTotal.toFixed(2)} ₺ müşteri hesabına eklendi.`, { duration: 4000 });
      } else {
        toast.success('Satış başarıyla tamamlandı!', { duration: 3000 });
      }
      
      // Reset state
      setCart([]);
      setSelectedCustomer(null);
      setSearchTerm('');
      setCustomerSearch('');
      setPaymentMethod('Nakit');
      
      // Auto-focus back to barcode input for next sale
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);

    } catch (error) {
      toast.error(error.response?.data?.message || '❌ Satış tamamlanamadı. Lütfen tekrar deneyin.', { duration: 4000 });
      console.error('Sale completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      {/* Left Side - Cart and Customer */}
      <div className="w-2/5 flex flex-col gap-4">
        {/* Customer Section */}
        <div className="bg-white rounded-lg shadow p-4 flex-shrink-0">
          <h2 className="text-lg font-bold mb-2">Müşteri</h2>
          {selectedCustomer ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{selectedCustomer.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:text-red-700">
                  <X size={20} />
                </button>
              </div>
              
              {/* Balance Display */}
              <div className={`p-3 rounded-lg border ${getBalanceStatus(selectedCustomer.balance).bgColor} mb-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bakiye</p>
                    <p className={`text-xl font-bold ${getBalanceStatus(selectedCustomer.balance).color}`}>
                      {formatNumberForDisplay(selectedCustomer.balance)} ₺
                    </p>
                    <p className={`text-xs ${getBalanceStatus(selectedCustomer.balance).color}`}>
                      {getBalanceStatus(selectedCustomer.balance).status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setBalanceForm({ type: 'debt', amount: '', description: '', category: 'Satış' });
                        setShowBalanceModal(true);
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Borç Ekle"
                    >
                      <TrendingUp size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setBalanceForm({ type: 'payment', amount: '', description: '', category: 'Satış' });
                        setShowBalanceModal(true);
                      }}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Ödeme Ekle"
                    >
                      <TrendingDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Müşteri ara (isim, telefon...)"
                className="input pl-10 w-full"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {searchedCustomers.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchedCustomers.map(customer => (
                    <li key={customer.id} onClick={() => selectCustomer(customer)} className="p-2 hover:bg-gray-100 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{customer.fullName}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${getBalanceStatus(customer.balance).bgColor} ${getBalanceStatus(customer.balance).color}`}>
                          {formatNumberForDisplay(customer.balance)} ₺
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="bg-white rounded-lg shadow p-4 flex-grow flex flex-col">
          <h2 className="text-lg font-bold mb-2">Sepet</h2>
          <div className="flex-grow overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">Sepetiniz boş.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {cart.map(item => (
                  <li key={item.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.hasDiscount ? item.discountPrice : item.retailPrice} TL</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={14} /></button>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Toplam</span>
                <span>{cartTotal.toFixed(2)} TL</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Product Search and Sale Completion */}
      <div className="w-3/5 flex flex-col gap-4">
        {/* Product Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Satış</h2>
            <p className="text-gray-600">Ürün arayın veya barkod taratın</p>
          </div>
          
          {/* Large Barcode Input */}
          <div className="mb-6">
            <div className="relative">
              <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Ürün adı veya barkod..."
                className={`w-full pl-14 pr-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  /^\d+$/.test(searchTerm) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={(e) => e.target.select()}
              />
              {/^\d{12}$/.test(searchTerm) && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded font-medium">
                  Enter'a basın
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Camera size={18} />
              Kamera Aç
            </button>
            <button
              onClick={handleManualSearch}
              disabled={searchLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Arıyor...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Ara
                </>
              )}
            </button>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-700">
              <div className="font-medium mb-2">Klavye Kısayolları:</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• F5: Kamera açar</div>
                <div>• Ctrl+F: Arama alanına odaklanır</div>
                <div>• Enter: Aramayı başlatır</div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="mt-4 h-64 overflow-y-auto border rounded-lg bg-gray-50">
            {searchedProducts.length > 0 ? (
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">{searchedProducts.length} ürün bulundu</span>
                  <button
                    onClick={clearSearch}
                    className="text-sm text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded font-medium"
                  >
                    Temizle
                  </button>
                </div>
                <ul className="space-y-2">
                  {searchedProducts.map(product => (
                    <li 
                      key={product.id} 
                      onClick={() => addToCart(product)} 
                      className="bg-white p-3 rounded-lg hover:bg-blue-50 cursor-pointer border hover:border-blue-200 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-lg">{product.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {product.brand && `${product.brand} - `}{product.size && `${product.size}, `}{product.color}
                          </div>
                          <div className="text-xs text-blue-600 font-mono mt-2 bg-blue-50 px-2 py-1 rounded inline-block">
                            {product.barcode}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-xl text-gray-900">
                            {product.hasDiscount ? product.discountPrice : product.retailPrice} TL
                          </div>
                          <div className={`text-sm font-medium ${product.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Stok: {product.currentStock}
                          </div>
                          {product.hasDiscount && (
                            <div className="text-sm text-red-500 line-through">
                              {product.retailPrice} TL
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : searchTerm && !searchLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Ürün bulunamadı</p>
                <p className="text-sm text-gray-400">Farklı bir arama terimi deneyin</p>
              </div>
            ) : !searchTerm ? (
              <div className="text-center py-12 text-gray-400">
                <Scan size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Ürün arayın</p>
                <p className="text-sm">Bulunan ürünler burada görünecek</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sale Completion */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Satışı Tamamla</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Nakit</option>
                <option>Kredi Kartı</option>
                <option>Havale/EFT</option>
                <option>Veresiye</option>
                <option>Diğer</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCompleteSale}
                disabled={loading || cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    İşleniyor...
                  </>
                ) : (
                  `Satışı Tamamla (${cartTotal.toFixed(2)} TL)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {balanceForm.type === 'debt' ? 'Borç Ekle' : 'Ödeme Ekle'}
                </h2>
                <button
                  onClick={() => setShowBalanceModal(false)}
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
                    value={balanceForm.amount}
                    onChange={handleBalanceChange}
                    placeholder="0,00"
                    pattern="[0-9.,]+"
                    required
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">TL</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={balanceForm.description}
                  onChange={handleBalanceChange}
                  placeholder={balanceForm.type === 'debt' ? 'Borç açıklaması...' : 'Ödeme açıklaması...'}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  name="category"
                  value={balanceForm.category}
                  onChange={handleBalanceChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Satış">Satış</option>
                  <option value="Genel">Genel</option>
                  <option value="Hizmet">Hizmet</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${
                    balanceForm.type === 'debt' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {balanceForm.type === 'debt' ? 'Borç Ekle' : 'Ödeme Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};

export default POS;