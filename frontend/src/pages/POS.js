import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Plus, Minus, Trash2, Camera, Scan, ShoppingBag } from 'lucide-react';
import { productsAPI } from '../utils/api';
import { customersAPI } from '../utils/api';
import { salesAPI } from '../utils/api';
import * as ReactHotToast from 'react-hot-toast';
import { debounce } from 'lodash';
import BarcodeScanner from '../components/BarcodeScanner';

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  // Persist cart and selected customer until sale completes
  const POS_CART_STORAGE_KEY = 'pos_cart';
  const POS_SELECTED_CUSTOMER_STORAGE_KEY = 'pos_selected_customer';

  const [cart, setCart] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(POS_CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (error) {
      console.error('Persisted cart load error:', error);
    }
    return [];
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(POS_SELECTED_CUSTOMER_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
      }
    } catch (error) {
      console.error('Persisted customer load error:', error);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Ödeme yöntemi seçimi
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' veya 'credit'

  // Direct quantity input values per cart item (temporary while typing)
  const [quantityInputs, setQuantityInputs] = useState({});

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

  // Quick balance helpers removed

  // Get balance status and color
  const getBalanceStatus = (balance) => {
    if (balance > 0) return { status: 'Borç', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (balance < 0) return { status: 'Alacak', color: 'text-green-600', bgColor: 'bg-green-100' };
    return { status: 'Sıfır', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  // Quick balance actions removed

  const searchProducts = useCallback(async (term) => {
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
        addToCartWithQuantity(response.data.products[0], 1);
        setSearchTerm('');
        setSearchedProducts([]);
      }
      
      // If exact barcode match found among multiple results, prioritize it
      if (response.data.products.length > 1) {
        const exactMatch = response.data.products.find(p => p.barcode === term.trim());
        if (exactMatch) {
          ReactHotToast.toast.success(`Tam barkod eşleşmesi: ${exactMatch.name}`, { duration: 3000 });
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
            ReactHotToast.toast.error(`Bu barkod ile ürün bulunamadı. Önerilen: ${suggestedBarcode}`, { duration: 4500 });
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
              ReactHotToast.toast.error(`Barkod hatası düzeltildi: ${correctedBarcode}`, { duration: 4000 });
            } else {
              ReactHotToast.toast.error('Bu barkod ile ürün bulunamadı. Lütfen kontrol edin.', { duration: 4000 });
            }
          } else {
            ReactHotToast.toast.error('Bu barkod ile ürün bulunamadı. Lütfen kontrol edin.', { duration: 4000 });
          }
        } else {
          ReactHotToast.toast.error('Ürün bulunamadı', { duration: 3500 });
        }
      }
    } catch (error) {
      console.error('Product search error:', error);
      ReactHotToast.toast.error('Ürün arama hatası. Lütfen tekrar deneyin.', { duration: 4000 });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const debouncedProductSearch = useCallback(
    debounce(async (term) => {
      if (term.length >= 1) {
        await searchProducts(term);
      } else {
        setSearchedProducts([]);
      }
    }, 300),
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
        ReactHotToast.toast.success(`Barkod otomatik tamamlandı: ${completedBarcode}`, { duration: 3000 });
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
          ReactHotToast.toast.success(`Barkod düzeltildi: ${correctedBarcode}`, { duration: 3000 });
          setSearchTerm(correctedBarcode);
          searchTermToUse = correctedBarcode;
        }
      }
      
      searchProducts(searchTermToUse);
    } else {
      ReactHotToast.toast.error('Lütfen bir arama terimi girin', { duration: 3000 });
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
    []
  );

  useEffect(() => {
    debouncedProductSearch(searchTerm);
  }, [searchTerm, debouncedProductSearch]);

  useEffect(() => {
    debouncedCustomerSearch(customerSearch);
  }, [customerSearch, debouncedCustomerSearch]);

  // Persist cart and selected customer to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(POS_CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Persisted cart save error:', error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (selectedCustomer) {
        localStorage.setItem(POS_SELECTED_CUSTOMER_STORAGE_KEY, JSON.stringify(selectedCustomer));
      } else {
        localStorage.removeItem(POS_SELECTED_CUSTOMER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Persisted customer save error:', error);
    }
  }, [selectedCustomer]);

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
    ReactHotToast.toast.success(`Barkod tarandı: ${barcode}`, { duration: 2000 });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 to focus search input
      if (e.key === 'F2') {
        e.preventDefault();
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }
      
      // F3 to open barcode scanner
      if (e.key === 'F3') {
        e.preventDefault();
        setShowBarcodeScanner(true);
      }
      
      // Escape to close scanner
      if (e.key === 'Escape' && showBarcodeScanner) {
        setShowBarcodeScanner(false);
      }

      // F9 to complete sale
      if (e.key === 'F9') {
        e.preventDefault();
        if (!loading && cart.length > 0 && selectedCustomer) {
          handleCompleteSale();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBarcodeScanner]);

  const clearCart = () => {
    setCart([]);
    setQuantityInputs({});
    try {
      localStorage.removeItem(POS_CART_STORAGE_KEY);
    } catch (error) {
      console.error('Persisted cart clear error:', error);
    }
  };

  const addToCart = (product) => {
    setSelectedProductForQuantity(product);
    setQuantityInput('1');
    setShowQuantityModal(true);
  };

  const addToCartWithQuantity = (product, quantity) => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      ReactHotToast.toast.error('Adet 0\'dan büyük olmalıdır', { duration: 3000 });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        if (newQuantity <= product.currentStock) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item
          );
        } else {
          ReactHotToast.toast.error(`Maksimum stok: ${product.currentStock} adet`, { duration: 3500 });
          return prevCart;
        }
      } else {
        if (qty <= product.currentStock) {
          return [...prevCart, { ...product, quantity: qty }];
        } else {
          ReactHotToast.toast.error(`Maksimum stok: ${product.currentStock} adet`, { duration: 3500 });
          return prevCart;
        }
      }
    });

    setShowQuantityModal(false);
    setSearchTerm('');
    setSearchedProducts([]);
    
    ReactHotToast.toast.success(`${product.name} - ${qty} adet sepete eklendi`, { duration: 2500 });
    
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
            ReactHotToast.toast.error('Maksimum stok adedine ulaşıldı', { duration: 3500 });
          }
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  // Handle typing in the quantity input box without immediately mutating the cart
  const handleQuantityInputChange = (productId, rawValue) => {
    setQuantityInputs((prev) => ({ ...prev, [productId]: rawValue }));
  };

  // Commit typed quantity to the cart on blur/enter, clamping to [1, currentStock]
  const commitQuantityInput = (productId, rawValue, currentStock) => {
    let parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed <= 0) parsed = 1;
    if (parsed > currentStock) {
      ReactHotToast.toast.error(`Maksimum stok: ${currentStock} adet`, { duration: 3000 });
      parsed = currentStock;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: parsed } : item
      )
    );

    // Clear temporary input to fall back to cart's quantity display
    setQuantityInputs((prev) => {
      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
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
    const price = item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice);
    return total + price * item.quantity;
  }, 0);

  const cartTotal = cartSubtotal; // Vergi hesaplaması kaldırıldı

  // Satış kağıdı yazdırma fonksiyonu
  const printSaleReceipt = (saleData, saleItems, targetWindow, providedPreviousBalance, providedSaleAmount) => {
    const customerName = selectedCustomer ? selectedCustomer.fullName : 'Müşteri';
    const customerPhone = selectedCustomer && selectedCustomer.phone ? selectedCustomer.phone : '';
    const currentDate = new Date().toLocaleDateString('tr-TR');
    const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const saleAmount = typeof providedSaleAmount === 'number' ? providedSaleAmount : Number(cartTotal);
    const previousBalance = typeof providedPreviousBalance === 'number'
      ? providedPreviousBalance
      : (selectedCustomer ? Number(selectedCustomer.balance || 0) : 0);
    const grandTotal = Number(previousBalance) + Number(saleAmount);

    const maxRows = 14;
    const productRows = saleItems.map(item => `
      <tr>
        <td class="cell text-center">${item.barcode || ''}</td>
        <td class="cell">${item.name}</td>
        <td class="cell text-center">${item.quantity}</td>
        <td class="cell text-right">${(item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice)).toFixed(2)} ₺</td>
        <td class="cell text-right">${(item.quantity * (item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice))).toFixed(2)} ₺</td>
      </tr>
    `).join('');

    const emptyRow = `
      <tr>
        <td class="cell">&nbsp;</td>
        <td class="cell">&nbsp;</td>
        <td class="cell">&nbsp;</td>
        <td class="cell">&nbsp;</td>
        <td class="cell">&nbsp;</td>
      </tr>
    `;
    const fillerRows = Array.from({ length: Math.max(0, maxRows - saleItems.length) }).map(() => emptyRow).join('');

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Satış Raporu - ${customerName}</title>
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
          /* A5 uyumu */
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
            <div class="field"><div class="field-label">Telefon</div><div class="field-line">${customerPhone}</div></div>
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
              ${productRows}
              ${fillerRows}
            </tbody>
          </table>

          <div class="totals">
              <div class="total-box">
                <div class="total-row"><div>Satış Tutarı</div><div>${saleAmount.toFixed(2)} ₺</div></div>
                <div class="total-row"><div>Eski Bakiye</div><div>${previousBalance.toFixed(2)} ₺</div></div>
                <div class="total-row"><div>Genel Toplam</div><div>${grandTotal.toFixed(2)} ₺</div></div>
              </div>
          </div>

          <div class="print-actions">
            <button class="btn" onclick="window.print()">Yazdır</button>
          </div>
        </div>
      </body>
      </html>
    `;

    // Hedef pencere verilmişse onu kullan, yoksa son çare yeni pencere açmayı dene
    const printWindow = targetWindow || window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      ReactHotToast.toast.error('Yazdırma penceresi tarayıcı tarafından engellendi. Lütfen pop-up izni verin.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      ReactHotToast.toast.error('Sepetiniz boş. Lütfen ürün ekleyin.', { duration: 3500 });
      return;
    }

    // Müşteri seçimi zorunlu
    if (!selectedCustomer) {
      ReactHotToast.toast.error('Satış için müşteri seçimi zorunludur.', { duration: 4000 });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerId: selectedCustomer.id,
        paymentMethod: paymentMethod, // Ödeme yöntemini kullan
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        notes: 'Otomatik hesaba kaydedilen satış'
      };

      // Pop-up engelleyicilere takılmamak için pencereyi kullanıcı tıklaması sırasında hemen aç
      const preOpenedWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      if (!preOpenedWindow) {
        ReactHotToast.toast.error('Yazdırma penceresi engellendi. Lütfen tarayıcıda pop-up izni verin.');
      } else {
        // Minimal geçici içerik, sayfa hazırlanırken boş görünmesin
        preOpenedWindow.document.open();
        preOpenedWindow.document.write('<!DOCTYPE html><html><head><title>Fiş hazırlanıyor...</title></head><body><p style="font-family:Arial;padding:16px;">Fiş hazırlanıyor...</p></body></html>');
        preOpenedWindow.document.close();
      }

      const preBalance = selectedCustomer ? Number(selectedCustomer.balance || 0) : 0;
      const response = await salesAPI.createSale(saleData);
      
      ReactHotToast.toast.success(`Satış tamamlandı! ${cartTotal.toFixed(2)} ₺ müşteri hesabına eklendi.`, { duration: 4000 });
      
      // Satış kağıdını yazdır
      printSaleReceipt(response.data, cart, preOpenedWindow, preBalance, Number(cartTotal));
      
      // Reset state
      setCart([]);
      setSelectedCustomer(null);
      setSearchTerm('');
      setCustomerSearch('');
      try {
        localStorage.removeItem(POS_CART_STORAGE_KEY);
        localStorage.removeItem(POS_SELECTED_CUSTOMER_STORAGE_KEY);
      } catch (error) {
        console.error('Persisted data clear error:', error);
      }
      
      // Auto-focus back to barcode input for next sale
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);

    } catch (error) {
      ReactHotToast.toast.error(error.response?.data?.message || 'Satış tamamlanamadı. Lütfen tekrar deneyin.', { duration: 4000 });
      console.error('Sale completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="relative rounded-xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8 gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{selectedCustomer ? selectedCustomer.fullName : 'Satış'}</h1>
              {!selectedCustomer && (
                <p className="mt-1 text-sm text-gray-600">Ürünleri arayın, sepete ekleyin ve satış fişi yazdırın</p>
              )}
              {selectedCustomer && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Bakiye:</span>
                  <span className={`text-base font-semibold ${getBalanceStatus(selectedCustomer.balance).color}`}>
                    {formatNumberForDisplay(selectedCustomer.balance)} ₺
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getBalanceStatus(selectedCustomer.balance).bgColor} ${getBalanceStatus(selectedCustomer.balance).color}`}>
                    {getBalanceStatus(selectedCustomer.balance).status}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Ödeme yöntemi seçimi */}
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    paymentMethod === 'cash'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Peşin
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    paymentMethod === 'credit'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Vadeli
                </button>
              </div>
              
              {/* Customer search inside hero header */}
              {!selectedCustomer && (
              <div className="relative block">
                <input
                  type="text"
                  placeholder="Müşteri ara..."
                  className="w-56 sm:w-64 md:w-72 pl-3 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {searchedCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {searchedCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{customer.fullName}</p>
                            <p className="text-sm text-gray-500 truncate">{customer.phone}</p>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${getBalanceStatus(customer.balance).bgColor} ${getBalanceStatus(customer.balance).color}`}>
                            {formatNumberForDisplay(customer.balance)} ₺
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  title="Seçimi kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                title="Kamera (F3)"
              >
                <Camera className="w-4 h-4 mr-2" /> Kamera
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right Column (Cart) - will appear on the right at lg via order */}
          <div className="lg:col-span-2 lg:order-2 flex flex-col gap-6 max-h-[calc(100vh-240px)] lg:sticky lg:top-24">
            {/* Customer Section removed (now handled in hero header) */}

            {/* Cart Section */}
            <div className="order-1 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Sepet</h2>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-sm text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded">Sepeti Temizle</button>
                )}
              </div>
              <div className="p-4 pt-0 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Sepetiniz boş</p>
                    <p className="text-sm text-gray-400">Ürün aramaya başlayın</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr,auto,auto] items-center gap-3 py-3 border-b border-gray-100 last:border-b-0"
                      >
                        {/* Info */}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 leading-tight break-words">
                            {item.name}
                          </p>
                          <div className="mt-0.5 text-xs text-gray-500">
                            Birim: {Number(item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice)).toFixed(2)} ₺ • Stok: {item.currentStock}
                          </div>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200">
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={item.currentStock}
                            value={
                              quantityInputs[item.id] !== undefined
                                ? quantityInputs[item.id]
                                : item.quantity
                            }
                            onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                            onBlur={(e) => commitQuantityInput(item.id, e.target.value, item.currentStock)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-14 text-center font-medium px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className="h-8 w-8 flex items-center justify-center text-red-600 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Prices */}
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {(item.quantity * Number(item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice))).toFixed(2)} ₺
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.quantity} × {Number(item.hasDiscount ? item.discountPrice : (paymentMethod === 'cash' ? item.cashPrice : item.creditPrice)).toFixed(2)} ₺
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {cart.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Toplam</span>
                      <span className="text-2xl font-extrabold text-gray-900">{cartTotal.toFixed(2)} ₺</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Column - Product Search */}
          <div className="lg:col-span-1 lg:order-1 space-y-6">
            {/* Product Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Ürün Arama</h2>
                <p className="text-sm text-gray-600">Ürün adı, barkod ile arayın veya kamera kullanın</p>
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Ürün adı veya barkod..."
                    className={`w-full pl-12 pr-3 py-2.5 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      /^\d+$/.test(searchTerm) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
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

              {/* Action buttons removed - moved to top bar */}

              {/* Search Results */}
              <div className="border border-gray-200 rounded-lg bg-gray-50 min-h-[300px] max-h-[400px] overflow-y-auto">
                {searchedProducts.length > 0 ? (
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">{searchedProducts.length} ürün bulundu</span>
                      <button
                        onClick={clearSearch}
                        className="text-sm text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded font-medium"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="space-y-3">
                      {searchedProducts.map(product => (
                        <div 
                          key={product.id} 
                          onClick={() => addToCart(product)} 
                          className="bg-white p-4 rounded-lg hover:bg-blue-50 cursor-pointer border hover:border-blue-200 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {product.brand && `${product.brand} - `}{product.size && `${product.size}, `}{product.color}
                              </div>
                              <div className="text-xs text-blue-600 font-mono mt-2 bg-blue-50 px-2 py-1 rounded inline-block">
                                {product.barcode}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-lg text-gray-900">
                                {product.hasDiscount ? product.discountPrice : (paymentMethod === 'cash' ? product.cashPrice : product.creditPrice)} ₺
                              </div>
                              <div className="text-sm text-gray-500">
                                {paymentMethod === 'cash' ? 'Peşin' : 'Vadeli'}
                              </div>
                              <div className={`text-sm font-medium ${product.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Stok: {product.currentStock}
                              </div>
                              {product.hasDiscount && (
                                <div className="text-sm text-red-500 line-through">
                                  {paymentMethod === 'cash' ? product.cashPrice : product.creditPrice} ₺
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchTerm && !searchLoading ? (
                  <div className="text-center py-16 text-gray-500">
                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Ürün bulunamadı</p>
                    <p className="text-sm text-gray-400">Farklı bir arama terimi deneyin</p>
                  </div>
                ) : !searchTerm ? (
                  <div className="text-center py-16 text-gray-400">
                    <Scan size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Ürün arayın</p>
                    <p className="text-sm">Bulunan ürünler burada görünecek</p>
                  </div>
                ) : null}
              </div>

              {/* Sale completion moved to bottom bar */}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sticky action bar - Grid içinde hizalanmış */}
      <div className="mt-8">
        <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Toplam</div>
              <div className="text-2xl font-bold text-gray-900">{cartTotal.toFixed(2)} ₺</div>
              <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{cart.length} ürün</div>
              {selectedCustomer ? (
                <div className="text-sm text-gray-700">Müşteri: <span className="font-medium">{selectedCustomer.fullName}</span></div>
              ) : (
                <div className="text-sm text-red-600">Müşteri seçin</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompleteSale}
                disabled={loading || cart.length === 0 || !selectedCustomer}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-5 rounded-lg font-semibold flex items-center justify-center gap-2"
                title="Satışı tamamla (F9)"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    İşleniyor...
                  </>
                ) : (
                  <>Satışı Tamamla & Yazdır</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Quantity Selection Modal */}
      {showQuantityModal && selectedProductForQuantity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Adet Seçimi</h2>
                <button
                  onClick={() => setShowQuantityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedProductForQuantity.name}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Fiyat: {selectedProductForQuantity.hasDiscount ? selectedProductForQuantity.discountPrice : (paymentMethod === 'cash' ? selectedProductForQuantity.cashPrice : selectedProductForQuantity.creditPrice)} ₺
                </p>
                <p className="text-sm text-gray-600">
                  Mevcut Stok: {selectedProductForQuantity.currentStock} adet
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adet</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductForQuantity.currentStock}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center"
                  placeholder="1"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToCartWithQuantity(selectedProductForQuantity, quantityInput);
                    }
                  }}
                />
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Toplam Tutar:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {(
                      (quantityInput || 0) * 
                      (selectedProductForQuantity.hasDiscount ? selectedProductForQuantity.discountPrice : (paymentMethod === 'cash' ? selectedProductForQuantity.cashPrice : selectedProductForQuantity.creditPrice))
                    ).toFixed(2)} ₺
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuantityModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => addToCartWithQuantity(selectedProductForQuantity, quantityInput)}
                  disabled={!quantityInput || quantityInput <= 0 || quantityInput > selectedProductForQuantity.currentStock}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Sepete Ekle
                </button>
              </div>
            </div>
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
