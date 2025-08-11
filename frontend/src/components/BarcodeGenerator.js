import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Printer } from 'lucide-react';

const BarcodeGenerator = ({ barcode, productName, onClose }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcode, {
          format: "EAN13",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (error) {
        console.error('Barkod oluşturma hatası:', error);
      }
    }
  }, [barcode]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barkod Yazdır - ${productName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            .barcode-container {
              display: inline-block;
              padding: 20px;
              border: 1px solid #ccc;
            }
            .product-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .barcode {
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
              .barcode-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${productName}</div>
            <div class="barcode">
              <svg id="barcode"></svg>
            </div>
            <div>Barkod: ${barcode}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${barcode}", {
              format: "CODE128",
              width: 2,
              height: 100,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              background: "#ffffff",
              lineColor: "#000000",
            });
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const svg = barcodeRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `barcode-${barcode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!barcode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Barkod Oluşturuldu</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {productName}
            </div>
            <div className="flex justify-center">
              <svg ref={barcodeRef}></svg>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {barcode}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              <Printer size={16} />
              <span>Yazdır</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>İndir</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full btn-secondary"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator; 