import React, { useState, useRef } from 'react';
import { Camera, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsScanning(true);
    } catch (error) {
      console.error('Kamera erişimi hatası:', error);
      toast.error('📷 Kamera erişimi sağlanamadı. Lütfen izin verin.', { duration: 4000 });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

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

        {/* Kamera Tarama */}
        <div className="mb-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden h-64">
            {isScanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera size={48} className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="mt-2 flex space-x-2">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="flex-1 btn-primary"
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

        {/* Manuel Barkod Girişi */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Manuel Barkod Girişi
          </h4>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Barkod numarasını girin"
              className="flex-1 input"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualBarcode.trim()}
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          💡 Barkod tarama için kamerayı açın veya barkod numarasını manuel olarak girin
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 