import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  Info, 
  History, 
  Leaf, 
  Bug, 
  Bird, 
  Search,
  ChevronRight,
  X,
  Dna,
  Share2,
  Download,
  AlertCircle
} from 'lucide-react';
import { detectOrganism } from './services/gemini';
import { BiologicalDetection, DetectionHistoryItem } from './types';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

// Fallback for crypto.randomUUID
const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [result, setResult] = useState<BiologicalDetection | null>(null);
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Load history from local storage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('biolens_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse history", e);
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('biolens_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Gagal mengambil gambar dari kamera.");
        return;
      }

      setCapturedImage(imageSrc);
      setIsCapturing(true);
      setError(null);
      setResult(null);

      const detection = await detectOrganism(imageSrc);
      setResult(detection);
      
      const newItem: DetectionHistoryItem = {
        id: generateId(),
        timestamp: Date.now(),
        image: imageSrc,
        result: detection
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mendeteksi organisme. Pastikan gambar jelas dan coba lagi.");
    } finally {
      setIsCapturing(false);
    }
  }, [webcamRef]);

  const reset = () => {
    setResult(null);
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bio-light font-sans">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white border-b border-bio-green/10 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-bio-green rounded-xl flex items-center justify-center text-white shadow-lg">
            <Dna size={24} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-bio-green leading-none">BioLens AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-bio-accent font-semibold">Biology Detector</p>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-2 hover:bg-bio-green/5 rounded-full transition-colors text-bio-green"
          aria-label="History"
        >
          <History size={24} />
        </button>
      </header>

      <main className="flex-1 relative flex flex-col max-w-2xl mx-auto w-full">
        {/* Camera Viewport */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-slate-900 overflow-hidden shadow-2xl sm:rounded-2xl sm:mt-4 sm:mx-4">
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={(err) => {
                  console.error("Webcam error:", err);
                  setError("Kamera tidak dapat diakses. Pastikan Anda telah memberikan izin kamera.");
                }}
              />
              
              {cameraReady && (
                <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/40"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/40"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/40"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/40"></div>
                </div>
              )}

              {!cameraReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white/60">
                  <RefreshCw size={32} className="animate-spin mb-4" />
                  <p className="text-sm font-medium">Menyiapkan Kamera...</p>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              {isCapturing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-[2px]">
                  <div className="scan-line"></div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="mb-4"
                  >
                    <RefreshCw size={48} className="text-white" />
                  </motion.div>
                  <p className="text-white font-medium tracking-widest uppercase text-sm">Menganalisis Spesimen...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-8 flex justify-center items-center gap-6">
          {!capturedImage ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={capture}
              disabled={!cameraReady || isCapturing}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white transition-all ${
                cameraReady && !isCapturing ? 'bg-bio-green shadow-bio-green/30' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <Camera size={32} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="px-8 py-3 bg-white text-bio-green rounded-full font-bold shadow-lg flex items-center gap-2 border border-bio-green/20 hover:bg-bio-light transition-colors"
            >
              <RefreshCw size={20} />
              Ambil Ulang
            </motion.button>
          )}
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="px-4 pb-12"
            >
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="bg-bio-green p-6 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-80 font-bold">Identifikasi Berhasil</span>
                    <div className="flex gap-3">
                      <Share2 size={18} className="opacity-80 cursor-pointer hover:opacity-100 transition-opacity" />
                      <Download size={18} className="opacity-80 cursor-pointer hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-serif font-bold leading-tight">{result.commonName}</h2>
                  <p className="text-bio-light/80 italic font-medium">{result.scientificName}</p>
                </div>

                <div className="p-6 space-y-8">
                  {/* Taxonomy Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <TaxonomyItem label="Kingdom" value={result.kingdom} />
                    <TaxonomyItem label="Phylum" value={result.phylum} />
                    <TaxonomyItem label="Class" value={result.class} />
                    <TaxonomyItem label="Order" value={result.order} />
                    <TaxonomyItem label="Family" value={result.family} />
                    <TaxonomyItem label="Genus" value={result.genus} />
                    <TaxonomyItem label="Species" value={result.species} />
                    <TaxonomyItem label="Status" value={result.conservationStatus} highlight />
                  </div>

                  <div className="h-px bg-bio-green/10"></div>

                  {/* Description */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-bio-accent font-bold mb-3 flex items-center gap-2">
                      <Info size={14} /> Deskripsi
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{result.description}</p>
                  </section>

                  {/* Habitat & Fun Fact */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-bio-green/5 p-5 rounded-2xl border border-bio-green/10">
                      <h3 className="text-xs uppercase tracking-widest text-bio-green font-bold mb-2">Habitat</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{result.habitat}</p>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                      <h3 className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">Fakta Menarik</h3>
                      <p className="text-sm text-slate-600 italic leading-relaxed">"{result.funFact}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 shadow-sm"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-1">Terjadi Kendala</p>
                <p className="text-xs leading-relaxed">{error}</p>
                {error.includes("izin") && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 text-xs font-bold underline underline-offset-4"
                  >
                    Muat Ulang Halaman
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold text-bio-green">Riwayat Temuan</h2>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Search size={48} className="mb-4" />
                    <p className="text-sm font-medium">Belum ada temuan yang disimpan</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layoutId={item.id}
                      onClick={() => {
                        setResult(item.result);
                        setCapturedImage(item.image);
                        setShowHistory(false);
                      }}
                      className="flex gap-4 p-3 rounded-2xl hover:bg-bio-green/5 cursor-pointer transition-all border border-transparent hover:border-bio-green/10 group"
                    >
                      <img src={item.image} alt="" className="w-20 h-20 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{item.result.commonName}</h4>
                        <p className="text-xs text-slate-500 italic truncate">{item.result.scientificName}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(item.timestamp).toLocaleDateString('id-ID')} • {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight size={20} className="self-center text-slate-300 group-hover:text-bio-green transition-colors" />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Instructions */}
      {!capturedImage && !result && (
        <div className="p-8 text-center bg-white/50 border-t border-bio-green/5">
          <div className="inline-flex gap-6 justify-center mb-4 opacity-60">
            <Leaf size={24} className="text-emerald-700" />
            <Bug size={24} className="text-amber-700" />
            <Bird size={24} className="text-blue-700" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Arahkan kamera ke tanaman, hewan, atau serangga dan tekan tombol untuk mengidentifikasi spesies secara instan.
          </p>
        </div>
      )}
    </div>
  );
}

function TaxonomyItem({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] uppercase tracking-wider text-bio-accent font-bold">{label}</span>
      <p className={`text-xs font-medium truncate ${highlight ? 'text-bio-green font-bold' : 'text-slate-700'}`}>
        {value || '-'}
      </p>
    </div>
  );
}
