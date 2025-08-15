import { useState, useEffect, useCallback } from 'react';

export const useCameraPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  // Kamera desteğini kontrol et
  const checkSupport = useCallback(() => {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasPermissions = !!(navigator.permissions && navigator.permissions.query);
    const hasMediaDevices = !!navigator.mediaDevices;
    
    setIsSupported(hasGetUserMedia && hasMediaDevices);
    
    console.log('Kamera desteği kontrol edildi:', {
      hasGetUserMedia,
      hasPermissions,
      hasMediaDevices,
      isSupported: hasGetUserMedia && hasMediaDevices
    });
  }, []);

  // İzin durumunu kontrol et
  const checkPermission = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(permission.state);
        
        console.log('Kamera izin durumu:', permission.state);
        
        // İzin durumu değişikliklerini dinle
        permission.onchange = () => {
          console.log('İzin durumu değişti:', permission.state);
          setPermissionStatus(permission.state);
        };
      } else {
        // Permissions API desteklenmiyorsa varsayılan olarak 'prompt' kabul et
        setPermissionStatus('prompt');
        console.log('Permissions API desteklenmiyor, varsayılan: prompt');
      }
    } catch (error) {
      console.error('İzin kontrol hatası:', error);
      setPermissionStatus('prompt');
    }
  }, []);

  // İzin iste
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      
      // Daha esnek video constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 320, ideal: 640, max: 1920 },
          height: { min: 240, ideal: 480, max: 1080 }
        }
      };
      
      console.log('Kamera erişimi isteniyor...', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (stream) {
        console.log('Stream başarıyla alındı:', stream);
        
        // Stream'i hemen durdur (sadece izin testi için)
        stream.getTracks().forEach(track => track.stop());
        
        setPermissionStatus('granted');
        
        return {
          success: true,
          message: 'Kamera izni verildi'
        };
      } else {
        throw new Error('Stream alınamadı');
      }
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      setError(error);
      
      let userMessage = 'Kamera izni alınamadı';
      
      if (error.name === 'NotAllowedError') {
        userMessage = 'Kamera izni reddedildi. Tarayıcı ayarlarından izin verin.';
      } else if (error.name === 'NotFoundError') {
        userMessage = 'Kamera bulunamadı. Cihazda kamera olduğundan emin olun.';
      } else if (error.name === 'NotReadableError') {
        userMessage = 'Kamera başka bir uygulama tarafından kullanılıyor.';
      } else if (error.name === 'OverconstrainedError') {
        userMessage = 'Kamera ayarları uygun değil.';
      } else if (error.name === 'SecurityError') {
        userMessage = 'Güvenlik nedeniyle kamera erişimi engellendi. HTTPS kullanın.';
      }
      
      setPermissionStatus('denied');
      
      return {
        success: false,
        message: userMessage,
        error: error
      };
    }
  }, []);

  // İzin durumunu sıfırla
  const resetPermission = useCallback(() => {
    setPermissionStatus('prompt');
    setError(null);
  }, []);

  // Mevcut video input cihazlarını listele
  const enumerateDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Video input cihazları:', videoDevices);
        return videoDevices;
      }
      return [];
    } catch (error) {
      console.error('Cihaz listesi alınamadı:', error);
      return [];
    }
  }, []);

  // Component mount olduğunda kontrol et
  useEffect(() => {
    checkSupport();
    checkPermission();
  }, [checkSupport, checkPermission]);

  return {
    permissionStatus,
    isSupported,
    error,
    checkPermission,
    requestPermission,
    resetPermission,
    enumerateDevices
  };
};
