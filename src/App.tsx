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
  Download
} from 'lucide-react';
import { detectOrganism } from './services/gemini';
import { BiologicalDetection, DetectionHistoryItem } from './types';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [result, setResult] = useState<BiologicalDetection | null>(null);
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('biolens_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('biolens_history', JSON.stringify(history));
  }, [history]);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCapturedImage(imageSrc);
    setIsCapturing(true);
    setError(null);
    setResult(null);

    try {
      const detection = await detectOrganism(imageSrc);
      setResult(detection);
      
      const newItem: DetectionHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        image: imageSrc,
        result: detection
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));
    } catch (err) {
      console.error(err);
      setError("Gagal mendeteksi organisme. Pastikan gambar jelas dan coba lagi.");
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
    <div className="min-h-screen flex flex-col bg-bio-light">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white border-b border-bio-green/10 sticky top-0 z-50">
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
        >
          <History size={24} />
        </button>
      </header>

      <main className="flex-1 relative flex flex-col max-w-2xl mx-auto w-full">
        {/* Camera Viewport */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-black overflow-hidden shadow-2xl sm:rounded-2xl sm:mt-4 sm:mx-4">
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 border border-white/10 rounded-full"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative w-full h-full">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              {isCapturing && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
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
              className="w-20 h-20 bg-bio-green rounded-full flex items-center justify-center text-white shadow-xl shadow-bio-green/30 border-4 border-white"
            >
              <Camera size={32} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="px-6 py-3 bg-white text-bio-green rounded-full font-semibold shadow-lg flex items-center gap-2 border border-bio-green/20"
            >
              <RefreshCw size={20} />
              Ambil Ulang
            </motion.button>
          )}
        </div>

        {/* Results Area */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="px-4 pb-12"
            >
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="bg-bio-green p-6 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-80 font-bold">Identifikasi Berhasil</span>
                    <div className="flex gap-2">
                      <Share2 size={18} className="opacity-80 cursor-pointer hover:opacity-100" />
                      <Download size={18} className="opacity-80 cursor-pointer hover:opacity-100" />
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
                    <p className="text-slate-700 leading-relaxed">{result.description}</p>
                  </section>

                  {/* Habitat & Fun Fact */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-bio-green/5 p-4 rounded-2xl border border-bio-green/10">
                      <h3 className="text-xs uppercase tracking-widest text-bio-green font-bold mb-2">Habitat</h3>
                      <p className="text-sm text-slate-600">{result.habitat}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <h3 className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">Fakta Menarik</h3>
                      <p className="text-sm text-slate-600 italic">"{result.funFact}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3"
            >
              <X size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
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
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold text-bio-green">Riwayat Temuan</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Search size={48} className="mb-4" />
                    <p>Belum ada temuan yang disimpan</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setResult(item.result);
                        setCapturedImage(item.image);
                        setShowHistory(false);
                      }}
                      className="flex gap-4 p-3 rounded-2xl hover:bg-bio-green/5 cursor-pointer transition-colors border border-transparent hover:border-bio-green/10"
                    >
                      <img src={item.image} alt="" className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{item.result.commonName}</h4>
                        <p className="text-xs text-slate-500 italic truncate">{item.result.scientificName}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight size={20} className="self-center text-slate-300" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Instructions Overlay (First time) */}
      {!capturedImage && !result && (
        <div className="p-6 text-center">
          <div className="inline-flex gap-4 justify-center mb-4">
            <Leaf size={20} className="text-emerald-600" />
            <Bug size={20} className="text-amber-600" />
            <Bird size={20} className="text-blue-600" />
          </div>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Arahkan kamera ke tanaman, hewan, atau serangga dan tekan tombol untuk mengidentifikasi.
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
        {value}
      </p>
    </div>
  );
}
