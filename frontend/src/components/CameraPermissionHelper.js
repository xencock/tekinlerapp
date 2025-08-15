import React from 'react';
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react';

const CameraPermissionHelper = ({ permissionStatus, onRetry, onClose }) => {
  const getStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: <CheckCircle size={24} className="text-green-500" />,
          title: 'Kamera İzni Verildi',
          message: 'Kamera erişimi için gerekli izinler verildi.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
      case 'denied':
        return {
          icon: <AlertCircle size={24} className="text-red-500" />,
          title: 'Kamera İzni Reddedildi',
          message: 'Kamera erişimi için izin verilmedi. Tarayıcı ayarlarından izin vermeniz gerekiyor.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700'
        };
      default:
        return {
          icon: <Camera size={24} className="text-blue-500" />,
          title: 'Kamera İzni Gerekli',
          message: 'Barkod tarama için kamera erişimi gerekiyor. İzin vermek için butona tıklayın.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        };
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        title: 'Chrome\'da Kamera İzni Nasıl Verilir:',
        steps: [
          'Adres çubuğunun solundaki 🔒 simgesine tıklayın',
          '"Kamera" iznini "İzin Ver" olarak ayarlayın',
          'Sayfayı yenileyin'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        title: 'Firefox\'ta Kamera İzni Nasıl Verilir:',
        steps: [
          'Adres çubuğunun solundaki 🔒 simgesine tıklayın',
          '"Kamera" iznini "İzin Ver" olarak ayarlayın',
          'Sayfayı yenileyin'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        title: 'Safari\'de Kamera İzni Nasıl Verilir:',
        steps: [
          'Safari > Tercihler > Web siteleri > Kamera',
          'Bu web sitesi için "İzin Ver" seçin',
          'Sayfayı yenileyin'
        ]
      };
    } else {
      return {
        title: 'Kamera İzni Nasıl Verilir:',
        steps: [
          'Tarayıcı ayarlarından kamera izinlerini kontrol edin',
          'Bu web sitesi için kamera erişimine izin verin',
          'Sayfayı yenileyin'
        ]
      };
    }
  };

  const statusInfo = getStatusInfo();
  const browserInstructions = getBrowserInstructions();

  return (
    <div className={`mb-4 p-4 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {statusInfo.icon}
          <div className="flex-1">
            <h4 className={`text-sm font-medium ${statusInfo.textColor} mb-1`}>
              {statusInfo.title}
            </h4>
            <p className={`text-sm ${statusInfo.textColor} mb-3`}>
              {statusInfo.message}
            </p>
            
            {/* Tarayıcı özel talimatları */}
            <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                {browserInstructions.title}
              </h5>
              <ol className="text-xs text-gray-600 space-y-1">
                {browserInstructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            
            {/* İzin yeniden deneme butonu */}
            {permissionStatus === 'denied' && (
              <button
                onClick={onRetry}
                className="btn-primary text-sm px-3 py-1"
              >
                İzni Yeniden Dene
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default CameraPermissionHelper;
