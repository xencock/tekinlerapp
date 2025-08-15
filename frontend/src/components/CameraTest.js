import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const CameraTest = ({ onClose }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});

  const runCameraTests = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Test 1: Kamera Desteği
      const hasMediaDevices = !!(navigator.mediaDevices);
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      results.push({
        test: 'Kamera Desteği',
        status: hasMediaDevices && hasGetUserMedia ? 'success' : 'error',
        message: hasMediaDevices && hasGetUserMedia 
          ? 'Kamera API destekleniyor' 
          : 'Kamera API desteklenmiyor'
      });

      // Test 2: Permissions API Desteği
      const hasPermissions = !!(navigator.permissions && navigator.permissions.query);
      results.push({
        test: 'Permissions API',
        status: hasPermissions ? 'success' : 'warning',
        message: hasPermissions 
          ? 'Permissions API destekleniyor' 
          : 'Permissions API desteklenmiyor (eski tarayıcı)'
      });

      // Test 3: HTTPS Bağlantısı
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      results.push({
        test: 'HTTPS Bağlantısı',
        status: isHTTPS ? 'success' : 'error',
        message: isHTTPS 
          ? 'Güvenli bağlantı (HTTPS veya localhost)' 
          : 'HTTPS gerekli (localhost değil)'
      });

      // Test 4: Kamera İzin Durumu
      if (hasPermissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' });
          results.push({
            test: 'Kamera İzin Durumu',
            status: permission.state === 'granted' ? 'success' : 'warning',
            message: `İzin durumu: ${permission.state}`
          });
        } catch (error) {
          results.push({
            test: 'Kamera İzin Durumu',
            status: 'error',
            message: `İzin kontrol hatası: ${error.message}`
          });
        }
      } else {
        results.push({
          test: 'Kamera İzin Durumu',
          status: 'warning',
          message: 'Permissions API desteklenmiyor'
        });
      }

      // Test 5: MediaDevices API
      if (hasMediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          results.push({
            test: 'Kamera Cihazları',
            status: videoDevices.length > 0 ? 'success' : 'warning',
            message: `${videoDevices.length} kamera cihazı bulundu`
          });
        } catch (error) {
          results.push({
            test: 'Kamera Cihazları',
            status: 'error',
            message: `Cihaz listesi hatası: ${error.message}`
          });
        }
      }

      // Test 6: Kamera Erişim Testi
      if (hasGetUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            results.push({
              test: 'Kamera Erişimi',
              status: 'success',
              message: 'Kamera erişimi başarılı'
            });
          } else {
            results.push({
              test: 'Kamera Erişimi',
              status: 'error',
              message: 'Stream alınamadı'
            });
          }
        } catch (error) {
          results.push({
            test: 'Kamera Erişimi',
            status: 'error',
            message: `Erişim hatası: ${error.name} - ${error.message}`
          });
        }
      }

      // Test 7: Tarayıcı Uyumluluğu
      const userAgent = navigator.userAgent;
      const isChrome = userAgent.includes('Chrome');
      const isFirefox = userAgent.includes('Firefox');
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const isEdge = userAgent.includes('Edg');
      
      let browserStatus = 'warning';
      let browserMessage = 'Bilinmeyen tarayıcı';
      
      if (isChrome) {
        browserStatus = 'success';
        browserMessage = 'Chrome - Tam destek';
      } else if (isFirefox) {
        browserStatus = 'success';
        browserMessage = 'Firefox - Tam destek';
      } else if (isSafari) {
        browserStatus = 'warning';
        browserMessage = 'Safari - Sınırlı destek';
      } else if (isEdge) {
        browserStatus = 'success';
        browserMessage = 'Edge - Tam destek';
      }
      
      results.push({
        test: 'Tarayıcı Uyumluluğu',
        status: browserStatus,
        message: browserMessage
      });

    } catch (error) {
      results.push({
        test: 'Genel Test',
        status: 'error',
        message: `Test hatası: ${error.message}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // Sistem bilgilerini topla
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      hasMediaDevices: !!(navigator.mediaDevices),
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasPermissions: !!(navigator.permissions && navigator.permissions.query)
    });

    // Otomatik test başlat
    runCameraTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getRecommendations = () => {
    const errorCount = testResults.filter(r => r.status === 'error').length;
    const warningCount = testResults.filter(r => r.status === 'warning').length;
    
    if (errorCount === 0 && warningCount === 0) {
      return 'Tüm testler başarılı! Kamera erişimi çalışmalı.';
    }
    
    const recommendations = [];
    
    if (testResults.some(r => r.test === 'HTTPS Bağlantısı' && r.status === 'error')) {
      recommendations.push('HTTPS bağlantısı kullanın veya localhost\'ta test edin');
    }
    
    if (testResults.some(r => r.test === 'Kamera İzin Durumu' && r.status === 'error')) {
      recommendations.push('Tarayıcı ayarlarından kamera iznini verin');
    }
    
    if (testResults.some(r => r.test === 'Kamera Erişimi' && r.status === 'error')) {
      recommendations.push('Kameranın başka bir uygulama tarafından kullanılmadığından emin olun');
    }
    
    if (testResults.some(r => r.test === 'Tarayıcı Uyumluluğu' && r.status === 'warning')) {
      recommendations.push('Chrome veya Firefox kullanmayı deneyin');
    }
    
    return recommendations.length > 0 ? recommendations : 'Genel bir sorun var. Sayfayı yenileyin.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Kamera Test Sonuçları</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sistem Bilgileri */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sistem Bilgileri</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Tarayıcı: {systemInfo.userAgent?.split(' ').slice(-2).join(' ')}</div>
            <div>Platform: {systemInfo.platform}</div>
            <div>Protokol: {systemInfo.protocol}</div>
            <div>Host: {systemInfo.hostname}</div>
          </div>
        </div>

        {/* Test Sonuçları */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Test Sonuçları</h4>
            <button
              onClick={runCameraTests}
              disabled={isRunning}
              className="btn-secondary text-sm px-3 py-1"
            >
              {isRunning ? 'Test Ediliyor...' : 'Yeniden Test Et'}
            </button>
          </div>
          
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{result.test}</div>
                  <div className="text-xs text-gray-600">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Öneriler */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Öneriler</h4>
          <div className="text-sm text-blue-600">
            {Array.isArray(getRecommendations()) ? (
              <ul className="list-disc list-inside space-y-1">
                {getRecommendations().map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p>{getRecommendations()}</p>
            )}
          </div>
        </div>

        {/* Kapat Butonu */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;
