import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import Modal from './common/Modal';
import { FoodItem } from '../types';
import Button from './common/Button';
import { LoaderIcon } from './common/Icons';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (item: FoodItem) => void;
}

type ScanState = 'scanning' | 'loading' | 'notFound' | 'found';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanned }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedItem, setScannedItem] = useState<FoodItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setScanState('scanning');
      setScannedItem(null);
      setErrorMessage('');

      const startScanner = async () => {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            scannerRef.current = new Html5Qrcode('reader');
            await scannerRef.current.start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              async (decodedText) => {
                if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
                   await scannerRef.current.pause();
                   handleBarcodeFound(decodedText);
                }
              },
              (errorMessage) => {
                // console.warn(`QR code parse error: ${errorMessage}`);
              }
            );
          }
        } catch (err) {
            console.error(err);
            setErrorMessage("Could not start camera. Please grant permission and refresh.");
        }
      };
      
      startScanner();

    } else if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
    }
    
    return () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
        }
    };
  }, [isOpen]);
  
  const handleBarcodeFound = async (barcode: string) => {
    setScanState('loading');
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product) {
            const product = data.product;
            const item: FoodItem = {
                id: barcode,
                name: product.product_name || 'Unknown Product',
                calories: product.nutriments['energy-kcal_100g'] || 0,
                protein: product.nutriments.proteins_100g || 0,
                carbs: product.nutriments.carbohydrates_100g || 0,
                fat: product.nutriments.fat_100g || 0,
            };
            setScannedItem(item);
            setScanState('found');
        } else {
            setScanState('notFound');
        }
    } catch (error) {
        console.error("Error fetching product data:", error);
        setScanState('notFound');
    }
  };

  const resetScanner = () => {
    setScanState('scanning');
    setScannedItem(null);
    if(scannerRef.current?.getState() === Html5QrcodeScannerState.PAUSED) {
        scannerRef.current.resume();
    }
  }

  const renderContent = () => {
    switch(scanState) {
        case 'loading':
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <LoaderIcon className="h-12 w-12 text-violet-400"/>
                    <p className="mt-4 text-lg">Fetching Nutrition Info...</p>
                </div>
            );
        case 'notFound':
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-xl font-semibold">Product Not Found</p>
                    <p className="text-gray-400 mt-2">Sorry, we couldn't find that barcode in our database.</p>
                    <Button onClick={resetScanner} className="mt-6">Scan Again</Button>
                </div>
            );
        case 'found':
            if (!scannedItem) return null;
            return (
                 <div className="text-center">
                    <h3 className="text-xl font-bold">{scannedItem.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">(per 100g)</p>
                    <div className="grid grid-cols-2 gap-4 my-6 text-left">
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Calories</p>
                            <p className="text-2xl font-bold">{scannedItem.calories} <span className="text-base font-normal">kcal</span></p>
                        </div>
                         <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Protein</p>
                            <p className="text-2xl font-bold">{scannedItem.protein} <span className="text-base font-normal">g</span></p>
                        </div>
                         <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Carbs</p>
                            <p className="text-2xl font-bold">{scannedItem.carbs} <span className="text-base font-normal">g</span></p>
                        </div>
                         <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Fat</p>
                            <p className="text-2xl font-bold">{scannedItem.fat} <span className="text-base font-normal">g</span></p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={resetScanner} className="flex-1">Scan Another</Button>
                        <Button onClick={() => onScanned(scannedItem)} className="flex-1">Add to Log</Button>
                    </div>
                </div>
            )
        case 'scanning':
        default:
             return (
                <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                    {errorMessage && <p className="text-red-400 text-center">{errorMessage}</p>}
                    <div id="reader" className="w-full h-full"></div>
                </div>
             )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Barcode">
        {renderContent()}
    </Modal>
  );
};

export default BarcodeScanner;