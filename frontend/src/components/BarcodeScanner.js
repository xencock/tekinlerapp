import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import * as ZXing from '@zxing/library';
import { useCameraPermission } from '../hooks/useCameraPermission';
import CameraPermissionHelper from './CameraPermissionHelper';
import CameraTest from './CameraTest';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPermissionHelper, setShowPermissionHelper] = useState(true);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const codeReaderRef = useRef(null);
  
  const { 
    permissionStatus, 
    isSupported, 
    error,
    checkPermission, 
    requestPermission
  } = useCameraPermission();

  // ZXing code reader'ı başlat
  useEffect(() => {
    console.log('=== ZXING CODE READER BAŞLATILIYOR ===');
    
    try {
      // ZXing kütüphanesinin yüklenip yüklenmediğini kontrol et
      if (typeof ZXing.BrowserMultiFormatReader === 'undefined') {
        console.error('❌ ZXing.BrowserMultiFormatReader tanımlı değil');
        console.error('ZXing kütüphanesi yüklenemedi');
        toast.error('❌ Barkod tarama kütüphanesi yüklenemedi', { duration: 5000 });
        return;
      }

      console.log('✅ ZXing.BrowserMultiFormatReader bulundu');
      console.log('📚 ZXing kütüphanesi yüklendi');
      
      // Code reader'ı başlat
              codeReaderRef.current = new ZXing.BrowserMultiFormatReader();
      console.log('✅ ZXing code reader başlatıldı:', codeReaderRef.current);
      
      // Code reader'ın özelliklerini kontrol et
      console.log('🔍 Code reader özellikleri:', {
        hasDecodeFromVideoDevice: typeof codeReaderRef.current.decodeFromVideoDevice === 'function',
        hasReset: typeof codeReaderRef.current.reset === 'function',
        hasListVideoInputDevices: typeof codeReaderRef.current.listVideoInputDevices === 'function'
      });
      
    } catch (error) {
      console.error('❌ ZXing code reader başlatılamadı:', error);
      toast.error(`❌ Barkod tarama sistemi başlatılamadı: ${error.message}`, { duration: 5000 });
    }

    return () => {
      if (codeReaderRef.current) {
        try {
          console.log('🧹 Code reader temizleniyor...');
          codeReaderRef.current.reset();
          console.log('✅ Code reader temizlendi');
        } catch (error) {
          console.error('❌ Code reader reset hatası:', error);
        }
      }
    };
  }, []);

  // Sayfa yüklendiğinde kamera izin durumunu kontrol et
  useEffect(() => {
    if (isSupported) {
      checkPermission();
    }
  }, [isSupported, checkPermission]);

  // stopScanning function definition moved here to avoid "used before defined" warning
  const stopScanning = useCallback(() => {
    // Önce barkod taramayı durdur
    if (typeof stopBarcodeScanning === 'function') {
      stopBarcodeScanning();
    }
    
    // Sonra stream'i durdur
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    console.log('Kamera durduruldu');
  }, []);

  // Video element hazır olduğunda kontrol et
  useEffect(() => {
    if (videoRef.current) {
      console.log('Video element DOM\'a eklendi:', videoRef.current);
      
      // Video element'in hazır olduğundan emin ol
      const video = videoRef.current;
      
      // Video element'in temel özelliklerini kontrol et
      if (video.tagName === 'VIDEO') {
        console.log('Video element doğru tipte');
        
        // Video element'in gerekli özelliklerini ayarla
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        console.log('Video element özellikleri ayarlandı');
      } else {
        console.error('Video element yanlış tip:', video.tagName);
      }
    }
  }, []);

  // Component unmount olduğunda stream'i temizle
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        console.log('Component unmount, stream temizleniyor');
        stopScanning();
      }
    };
  }, [stopScanning]);

  const startScanning = async () => {
    try {
      setErrorMessage('');
      
      // Video element referansını kontrol et
      if (!videoRef.current) {
        console.error('Video element referansı bulunamadı');
        // Video element henüz render edilmemiş olabilir, biraz bekle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!videoRef.current) {
          throw new Error('Video element bulunamadı - DOM henüz hazır değil');
        }
      }
      
      console.log('Video element bulundu:', videoRef.current);
      
      // HTTPS kontrolü
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setErrorMessage('Kamera erişimi için HTTPS gerekli. Lütfen güvenli bağlantı kullanın.');
        toast.error('🔒 Kamera erişimi için HTTPS gerekli', { duration: 4000 });
        return;
      }

      // Önce mevcut stream'i temizle
      if (streamRef.current) {
        stopScanning();
      }

      // Kamera erişimi iste - daha esnek ayarlar
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 320, ideal: 640, max: 1920 },
          height: { min: 240, ideal: 480, max: 1080 }
        }
      };

      console.log('Kamera erişimi isteniyor...', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream) {
        throw new Error('Stream alınamadı');
      }
      
      console.log('Stream başarıyla alındı:', stream);
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      // Video yüklenme olaylarını dinle - sadece bir kez
      let videoReady = false;
      let videoLoadTimeout = null;
      
      const handleVideoReady = () => {
        if (videoReady) return; // Sadece bir kez çalışsın
        videoReady = true;
        
        // Timeout'u temizle
        if (videoLoadTimeout) {
          clearTimeout(videoLoadTimeout);
          videoLoadTimeout = null;
        }
        
        console.log('Video metadata yüklendi');
        console.log('Video readyState:', videoRef.current.readyState);
        console.log('Video videoWidth:', videoRef.current.videoWidth);
        console.log('Video videoHeight:', videoRef.current.videoHeight);
        console.log('Video currentTime:', videoRef.current.currentTime);
        
        // Video boyutlarını kontrol et
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          console.log('Video boyutları geçerli:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        } else {
          console.warn('Video boyutları henüz hazır değil');
        }
        
        setIsScanning(true);
        // Toast spam'i önlemek için sadece bir kez göster
        if (!window.cameraToastShown) {
          toast.success('📷 Kamera başarıyla açıldı', { duration: 2000 });
          window.cameraToastShown = true;
          // 3 saniye sonra flag'i sıfırla
          setTimeout(() => {
            window.cameraToastShown = false;
          }, 3000);
        }
        
        // Video hazır olduktan sonra barkod taramayı başlat
        setTimeout(() => {
          startBarcodeScanning();
        }, 1000); // 1 saniye bekle, video tamamen hazır olsun
      };
      
      // Video event listener'ları ekle
      videoRef.current.onloadedmetadata = () => {
        console.log('onloadedmetadata event tetiklendi');
        handleVideoReady();
      };
      
      videoRef.current.onloadeddata = () => {
        console.log('onloadeddata event tetiklendi');
        handleVideoReady();
      };
      
      videoRef.current.oncanplay = () => {
        console.log('oncanplay event tetiklendi');
        handleVideoReady();
      };
      
      videoRef.current.oncanplaythrough = () => {
        console.log('oncanplaythrough event tetiklendi');
        handleVideoReady();
      };
      
      videoRef.current.onerror = (e) => {
        console.error('Video yükleme hatası:', e);
        console.error('Video error code:', videoRef.current.error?.code);
        console.error('Video error message:', videoRef.current.error?.message);
        throw new Error('Video yüklenemedi');
      };
      
      // Video yüklenene kadar bekle
      await new Promise((resolve, reject) => {
        if (videoRef.current.readyState >= 2) {
          console.log('Video zaten hazır, readyState:', videoRef.current.readyState);
          handleVideoReady();
          resolve();
        } else {
          console.log('Video yükleniyor, readyState:', videoRef.current.readyState);
          
          // Event listener'lar zaten yukarıda eklendi
          // 10 saniye timeout (daha uzun süre)
          videoLoadTimeout = setTimeout(() => {
            console.error('Video yükleme timeout - readyState:', videoRef.current.readyState);
            reject(new Error('Video yükleme zaman aşımı'));
          }, 10000);
          
          // Ek güvenlik: video playable olduğunda da hazır say
          const checkVideoReady = () => {
            if (videoRef.current.readyState >= 2) {
              console.log('Video readyState kontrolünde hazır:', videoRef.current.readyState);
              handleVideoReady();
              resolve();
            } else {
              // 100ms sonra tekrar kontrol et
              setTimeout(checkVideoReady, 100);
            }
          };
          
          // İlk kontrol
          setTimeout(checkVideoReady, 100);
        }
      });
      
      console.log('Video yükleme tamamlandı');
      
    } catch (error) {
      console.error('Kamera erişimi hatası:', error);
      
      let userMessage = 'Kamera erişimi sağlanamadı';
      let technicalDetails = '';
      
      if (error.name === 'NotAllowedError') {
        userMessage = 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
        technicalDetails = 'Kullanıcı kamera iznini reddetti veya tarayıcı izin vermedi';
      } else if (error.name === 'NotFoundError') {
        userMessage = 'Kamera bulunamadı. Lütfen kamera bağlı olduğundan emin olun.';
        technicalDetails = 'Cihazda kamera bulunamadı veya tanınmadı';
      } else if (error.name === 'NotReadableError') {
        userMessage = 'Kamera başka bir uygulama tarafından kullanılıyor.';
        technicalDetails = 'Kamera başka bir uygulama tarafından kilitlendi';
      } else if (error.name === 'OverconstrainedError') {
        userMessage = 'Kamera ayarları uygun değil. Daha basit ayarlarla tekrar deneyin.';
        technicalDetails = 'İstenen kamera ayarları desteklenmiyor';
      } else if (error.name === 'SecurityError') {
        userMessage = 'Güvenlik nedeniyle kamera erişimi engellendi. HTTPS kullanın.';
        technicalDetails = 'Güvenlik politikası kamera erişimini engelledi';
      } else if (error.name === 'AbortError') {
        userMessage = 'Kamera erişimi iptal edildi.';
        technicalDetails = 'Kamera erişimi kullanıcı tarafından iptal edildi';
      } else if (error.name === 'NotSupportedError') {
        userMessage = 'Kamera erişimi desteklenmiyor.';
        technicalDetails = 'Tarayıcı kamera erişimini desteklemiyor';
      } else if (error.message === 'Video element bulunamadı - DOM henüz hazır değil') {
        userMessage = 'Kamera arayüzü henüz hazır değil. Lütfen tekrar deneyin.';
        technicalDetails = 'Video DOM elementi henüz render edilmemiş';
      } else if (error.message === 'Stream alınamadı') {
        userMessage = 'Kamera akışı başlatılamadı. Tekrar deneyin.';
        technicalDetails = 'getUserMedia stream döndürmedi';
      } else if (error.message === 'Video yüklenemedi') {
        userMessage = 'Kamera görüntüsü yüklenemedi. Tekrar deneyin.';
        technicalDetails = 'Video element yükleme hatası';
      } else if (error.message === 'Video yükleme zaman aşımı') {
        userMessage = 'Kamera yükleme zaman aşımı. Lütfen tekrar deneyin veya sayfayı yenileyin.';
        technicalDetails = 'Video yükleme 10 saniyede tamamlanamadı - readyState: ' + (videoRef.current?.readyState || 'unknown');
      }
      
      console.error('Teknik detaylar:', technicalDetails);
      setErrorMessage(userMessage);
      toast.error(`📷 ${userMessage}`, { duration: 5000 });
      
      // Hata durumunda scanning state'ini false yap
      setIsScanning(false);
    }
  };



  const handleClose = () => {
    stopScanning();
    onClose();
  };



  const handleRetryPermission = async () => {
    setErrorMessage('');
    console.log('İzin yeniden deneniyor...');
    
    try {
      const result = await requestPermission();
      
      if (result.success) {
        toast.success('✅ Kamera izni verildi!', { duration: 2000 });
        // Otomatik olarak kamerayı aç
        setTimeout(() => {
          startScanning();
        }, 500);
      } else {
        console.error('İzin yeniden deneme başarısız:', result);
        toast.error(`❌ Kamera izni alınamadı: ${result.message}`, { duration: 3000 });
        
        // Daha detaylı hata mesajı göster
        if (result.error) {
          setErrorMessage(`İzin hatası: ${result.error.name} - ${result.error.message}`);
        }
      }
    } catch (error) {
      console.error('İzin yeniden deneme hatası:', error);
      toast.error('❌ İzin yeniden deneme sırasında hata oluştu', { duration: 3000 });
    }
  };

  // Barkod taramayı başlat
  const startBarcodeScanning = async () => {
    console.log('=== BARKOD TARAMA BAŞLATILIYOR ===');
    
    if (!codeReaderRef.current) {
      console.error('❌ Code reader hazır değil');
      toast.error('❌ Barkod tarama sistemi hazır değil', { duration: 3000 });
      return;
    }

    if (!videoRef.current) {
      console.error('❌ Video element hazır değil');
      toast.error('❌ Video element bulunamadı', { duration: 3000 });
      return;
    }

    // Eğer zaten tarama yapılıyorsa, tekrar başlatma
    if (isProcessingBarcode) {
      console.log('⚠️ Barkod tarama zaten aktif');
      return;
    }

    try {
      setIsProcessingBarcode(true);
      console.log('✅ Barkod tarama başlatılıyor...');
      
      // Video element durumunu kontrol et
      const video = videoRef.current;
      console.log('📹 Video element durumu:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        srcObject: !!video.srcObject,
        paused: video.paused,
        ended: video.ended,
        currentTime: video.currentTime
      });

      // Video hazır değilse bekle
      if (video.readyState < 2) {
        console.log('⏳ Video henüz hazır değil, bekleniyor...');
        await new Promise(resolve => {
          const checkReady = () => {
            if (video.readyState >= 2) {
              console.log('✅ Video hazır, readyState:', video.readyState);
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
      }

      // Önceki taramayı temizle
      try {
        console.log('🧹 Önceki tarama temizleniyor...');
        codeReaderRef.current.reset();
        console.log('✅ Önceki tarama temizlendi');
      } catch (error) {
        console.log('⚠️ Önceki tarama temizleme hatası (normal):', error);
      }

      // Barkod tarama başlat
      console.log('🚀 Barkod tarama başlatılıyor...');
      
      const scanResult = await codeReaderRef.current.decodeFromVideoDevice(
        null, // Varsayılan kamera
        video,
        (result, error) => {
          console.log('🔍 Tarama callback çağrıldı');
          
          if (result) {
            console.log('🎯 BARKOD YAKALANDI!');
            console.log('📝 Barkod detayları:', {
              text: result.text,
              format: result.format,
              timestamp: new Date().toISOString()
            });
            handleBarcodeDetected(result.text);
          }
          
          if (error) {
            if (error.name === 'NotFoundException') {
              // Bu normal, barkod bulunamadı
              console.log('🔍 Barkod bulunamadı (normal)');
            } else {
              console.log('❌ Barkod tarama hatası:', error.name, error.message);
            }
          }
        }
      );

      console.log('✅ Barkod tarama başlatıldı, scanResult:', scanResult);
      
      // Tarama başarılı oldu mu kontrol et
      if (scanResult) {
        console.log('✅ Tarama sistemi aktif');
        toast.success('🔍 Barkod tarama başladı', { duration: 2000 });
      } else {
        console.warn('⚠️ Tarama sistemi başlatılamadı');
        toast.error('⚠️ Barkod tarama başlatılamadı', { duration: 3000 });
      }
      
    } catch (error) {
      console.error('❌ Barkod tarama başlatma hatası:', error);
      toast.error(`❌ Barkod tarama hatası: ${error.message}`, { duration: 5000 });
      setIsProcessingBarcode(false);
    }
  };

  // Barkod taramayı durdur
  const stopBarcodeScanning = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        console.log('Barkod tarama durduruldu');
      } catch (error) {
        console.error('Barkod tarama durdurma hatası:', error);
      }
    }
  };

  // Barkod yakalandığında
  const handleBarcodeDetected = (barcodeText) => {
    if (!barcodeText || barcodeText.trim() === '') {
      return;
    }

    // Eğer zaten işleniyorsa, tekrar işleme
    if (isProcessingBarcode === false) {
      return;
    }

    console.log('Barkod işleniyor:', barcodeText);
    
    // Barkod işleme durumunu false yap (tekrar işlenmesin)
    setIsProcessingBarcode(false);
    
    // Başarı sesi çal (opsiyonel)
    try {
      // Tarayıcı destekliyorsa ses çal
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.log('Ses çalınamadı:', error);
    }

    // Başarı mesajı
    toast.success(`✅ Barkod yakalandı: ${barcodeText}`, { duration: 2000 });
    
    // Barkodu callback'e gönder
    onScan(barcodeText.trim());
    
    // Kamerayı kapat
    stopScanning();
  };

  // Debug bilgileri
  const debugInfo = {
    isSupported,
    permissionStatus,
    error: error,
    isScanning,
    isProcessingBarcode,
    hasCodeReader: !!codeReaderRef.current,
    hasZXingLibrary: typeof ZXing.BrowserMultiFormatReader !== 'undefined',
    videoReady: videoRef.current?.readyState >= 2,
    videoDimensions: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A',
    videoSrcObject: !!videoRef.current?.srcObject,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    hasMediaDevices: !!(navigator.mediaDevices),
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasPermissions: !!(navigator.permissions && navigator.permissions.query)
  };

  console.log('BarcodeScanner Debug Bilgileri:', debugInfo);

  // Kamera desteklenmiyorsa
  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Barkod Tarama</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="text-red-400 mx-auto mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Kamera Desteklenmiyor
            </h4>
            <p className="text-gray-600 mb-4">
              Tarayıcınız kamera erişimini desteklemiyor. Ürün arama ekranından barkod ile arama yapabilirsiniz.
            </p>
          </div>


        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Barkod Tarama</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCameraTest(true)}
                className="text-gray-500 hover:text-gray-700 p-1"
                title="Kamera Test"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* İzin Durumu Yardımcısı */}
          {showPermissionHelper && (
            <CameraPermissionHelper
              permissionStatus={permissionStatus}
              onRetry={handleRetryPermission}
              onClose={() => setShowPermissionHelper(false)}
            />
          )}

          {/* Hata Mesajı */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-700 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Kamera Tarama */}
          <div className="mb-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden h-64">
              {/* Video element her zaman render edilir ama sadece scanning sırasında görünür */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              />
              
              {/* Kamera açılmadığında placeholder göster */}
              {!isScanning && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Camera size={48} className="mb-2" />
                  <span className="text-sm text-center">
                    {permissionStatus === 'denied' 
                      ? 'Kamera izni gerekli' 
                      : 'Kamerayı açmak için butona tıklayın'
                    }
                  </span>
                </div>
              )}
              
              {/* Barkod tarama durumu */}
              {isScanning && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  {isProcessingBarcode ? '🔍 Barkod Aranıyor...' : '📷 Kamera Aktif'}
                </div>
              )}
              
              {/* Debug bilgileri (geliştirme modunda) */}
              {process.env.NODE_ENV === 'development' && isScanning && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
                </div>
              )}
            </div>
            
            <div className="mt-2 flex space-x-2">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  disabled={permissionStatus === 'denied'}
                  className={`flex-1 btn-primary ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Kamerayı Aç
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex-1 btn-secondary"
                >
                  Kamerayı Kapat
                </button>
              )}
            </div>
          </div>



          {isScanning && (
            <div className="mt-4 text-xs text-green-600 text-center">
              🔍 Kamera açık - Barkod aranıyor... Barkodu kameraya gösterin
            </div>
          )}
        </div>
      </div>

      {/* Kamera Test Modal */}
      {showCameraTest && (
        <CameraTest onClose={() => setShowCameraTest(false)} />
      )}
    </>
  );
};

export default BarcodeScanner; 