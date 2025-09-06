import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Scan, AlertTriangle, CheckCircle, XCircle, Info, History, Zap } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Separator } from './components/ui/separator';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' 
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError('');
    } catch (err) {
      setError('Could not access camera. Please check permissions or use file upload.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedImage({ file, preview: canvas.toDataURL() });
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  }, [cameraStream]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({ file, preview: e.target.result });
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const scanImage = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError('');
    setScanResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage.file);

      const response = await fetch(`${BACKEND_URL}/api/scan`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Scan failed');
      }

      const result = await response.json();
      setScanResults(result);
      
      // Add to scan history
      setScanHistory(prev => [result, ...prev.slice(0, 4)]);
      
    } catch (err) {
      setError(`Scan failed: ${err.message}`);
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'caution': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'banned': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      case 'caution': return <AlertTriangle className="w-4 h-4" />;
      case 'banned': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const resetScan = () => {
    setSelectedImage(null);
    setScanResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Scan className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NutriCheck</h1>
                <p className="text-sm text-gray-600">Advanced ingredient analysis for better health choices</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <Tabs defaultValue="scanner" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="space-y-6">
              {/* Image Capture Section */}
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    Capture Food Label
                  </CardTitle>
                  <CardDescription>
                    Take a photo or upload an image of a food label to analyze its ingredients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera Interface */}
                  {showCamera && (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                      />
                      <div className="flex justify-center gap-4 mt-4">
                        <Button onClick={capturePhoto} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {selectedImage && !showCamera && (
                    <div className="text-center space-y-4">
                      <img
                        src={selectedImage.preview}
                        alt="Selected food label"
                        className="max-w-md mx-auto rounded-xl shadow-lg border-2 border-emerald-100"
                      />
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={scanImage}
                          disabled={isScanning}
                          size="lg"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isScanning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Scan className="w-4 h-4 mr-2" />
                              Scan Label
                            </>
                          )}
                        </Button>
                        <Button onClick={resetScan} variant="outline">
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload Options */}
                  {!selectedImage && !showCamera && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        size="lg"
                        className="h-24 flex flex-col gap-2 border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <Camera className="w-8 h-8 text-emerald-600" />
                        <span>Use Camera</span>
                      </Button>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="lg"
                        className="h-24 flex flex-col gap-2 border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <Upload className="w-8 h-8 text-emerald-600" />
                        <span>Upload Image</span>
                      </Button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Scan Results */}
              {scanResults && (
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Scan Results
                    </CardTitle>
                    <CardDescription>
                      Analysis completed in {scanResults.processing_time?.toFixed(2)}s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ingredients Analysis */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Ingredients Analysis</h3>
                      <div className="grid gap-3">
                        {scanResults.parsed_ingredients?.map((ingredient, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-2 ${getRiskColor(ingredient.risk_level)} transition-all hover:shadow-md`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {getRiskIcon(ingredient.risk_level)}
                                <div>
                                  <h4 className="font-semibold">{ingredient.name}</h4>
                                  <p className="text-sm opacity-90 mt-1">{ingredient.description}</p>
                                  {ingredient.banned_in && Object.keys(ingredient.banned_in).length > 0 && (
                                    <p className="text-xs mt-2">
                                      <strong>Banned in:</strong> {Object.keys(ingredient.banned_in).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="text-xs">
                                    {(ingredient.confidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Analysis confidence level</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {ingredient.sources && ingredient.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-current/20">
                                <p className="text-xs">
                                  <strong>Sources:</strong> {ingredient.sources.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nutritional Information */}
                    {scanResults.nutritional_info && Object.keys(scanResults.nutritional_info).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">Nutritional Information</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(scanResults.nutritional_info).map(([key, value]) => (
                              <div key={key} className="bg-white/80 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 uppercase tracking-wide">
                                  {key.replace('_', ' ')}
                                </p>
                                <p className="text-lg font-semibold text-gray-800">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Raw OCR Text */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Extracted Text</h4>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                        {scanResults.ocr_text}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <History className="w-5 h-5 text-emerald-600" />
                    Scan History
                  </CardTitle>
                  <CardDescription>
                    Recent food label scans and analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scanHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No scans yet. Start by scanning your first food label!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scanHistory.map((scan, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white/80">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800">
                              Scan #{scan.scan_id?.slice(-8) || index + 1}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {scan.processing_time?.toFixed(2)}s
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {scan.parsed_ingredients?.slice(0, 5).map((ingredient, idx) => (
                              <Badge
                                key={idx}
                                className={`text-xs ${getRiskColor(ingredient.risk_level)}`}
                              >
                                {ingredient.name}
                              </Badge>
                            ))}
                            {scan.parsed_ingredients?.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{scan.parsed_ingredients.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Canvas for camera capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </TooltipProvider>
  );
}

export default App;