import React, { useState, useEffect, useRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Download, 
  ChevronLeft, ChevronRight, FileText, Image, ExternalLink, HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface DocumentViewerProps {
  files: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function DocumentViewer({ files, initialIndex, onClose }: DocumentViewerProps) {
  const { screenReaderActive } = useAccessibility();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Image interactive states
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentUrl = files[currentIndex] || '';

  // Detect file type
  const getFileType = (url: string): 'pdf' | 'image' | 'other' => {
    if (!url) return 'other';
    if (url.startsWith('data:application/pdf')) return 'pdf';
    if (url.startsWith('data:image/')) return 'image';
    
    const lower = url.toLowerCase();
    if (lower.includes('.pdf') || lower.includes('pdf?')) return 'pdf';
    if (
      lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') ||
      lower.includes('.gif') || lower.includes('.webp') || lower.includes('.svg') ||
      lower.includes('image/') || lower.includes('/images?')
    ) {
      return 'image';
    }
    return 'other';
  };

  const fileType = getFileType(currentUrl);

  // Generate a friendly name for the file
  const getFileName = (url: string, index: number) => {
    if (!url) return `Documento ${index + 1}`;
    if (url.startsWith('data:')) {
      const mime = url.split(';')[0];
      const ext = mime.split('/')[1] || 'bin';
      return `Anexo_${index + 1}.${ext}`;
    }
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const baseSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (baseSegment && baseSegment.length > 3) {
        return decodeURIComponent(baseSegment);
      }
    } catch (e) {
      // Not a standard HTTP URL
    }
    return `Anexo ${index + 1}`;
  };

  // Reset interactive adjustments when switching files
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, [currentIndex]);

  // Bind keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, files.length]);

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan event handlers
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (fileType !== 'image') return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging || fileType !== 'image') return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan event handlers (Mobile)
  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (fileType !== 'image' || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!isDragging || fileType !== 'image' || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const speakText = (text: string) => {
    if (screenReaderActive && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[999] flex flex-col justify-between text-white select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador Integrado de Documentos"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-slate-800/60 rounded-lg text-primary-light flex-shrink-0">
            {fileType === 'pdf' ? <FileText size={20} className="text-blue-400" /> : <Image size={20} className="text-emerald-400" />}
          </div>
          <div className="min-w-0">
            <h2 
              className="text-sm font-bold truncate pr-3 text-slate-100"
              title={getFileName(currentUrl, currentIndex)}
            >
              {getFileName(currentUrl, currentIndex)}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">
              Arquivo {currentIndex + 1} de {files.length} • {fileType.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Action Controls for image magnification and rotation */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {fileType === 'image' && (
            <div className="flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50 mr-2">
              <button 
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 hover:bg-slate-700/60 disabled:opacity-40 rounded-lg transition text-slate-300 hover:text-white"
                title="Afastar (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono font-semibold px-1.5 text-slate-300 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="p-1.5 hover:bg-slate-700/60 disabled:opacity-40 rounded-lg transition text-slate-300 hover:text-white"
                title="Aproximar (+)"
              >
                <ZoomIn size={16} />
              </button>
              <div className="w-px h-5 bg-slate-700/50 mx-1" />
              <button 
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-700/60 rounded-lg transition text-slate-300 hover:text-white"
                title="Rotacionar (90º)"
              >
                <RotateCw size={16} />
              </button>
              <button 
                onClick={handleReset}
                className="p-1.5 hover:bg-slate-700/60 rounded-lg transition text-slate-300 hover:text-white"
                title="Resetar Ajustes (R)"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}

          {/* Download button */}
          <a 
            href={currentUrl} 
            download={getFileName(currentUrl, currentIndex)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800/60 rounded-xl hover:bg-slate-700 hover:text-white transition text-slate-300 border border-slate-700/50"
            title="Baixar Arquivo"
            onClick={() => speakText("Baixando arquivo em nova janela")}
          >
            <Download size={18} />
          </a>

          <div className="w-px h-6 bg-slate-800 mx-2 hidden md:block" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="p-2 bg-red-950/45 hover:bg-red-900 border border-red-900/30 text-red-200 rounded-xl transition"
            title="Fechar Visualizador (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative">
        {/* Left Arrow Button */}
        {files.length > 1 && (
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-900/60 border border-slate-800 backdrop-blur-sm rounded-full text-slate-400 hover:text-white disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
            aria-label="Anexo Anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Right Arrow Button */}
        {files.length > 1 && (
          <button 
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-900/60 border border-slate-800 backdrop-blur-sm rounded-full text-slate-400 hover:text-white disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
            aria-label="Próximo Anexo"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Content Box */}
        <div 
          ref={containerRef}
          className={cn(
            "flex-1 h-full overflow-hidden flex items-center justify-center p-6 relative bg-slate-950/50",
            fileType === 'image' ? 'cursor-grab active:cursor-grabbing' : ''
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {fileType === 'image' ? (
            <div 
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1.0)'
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img 
                ref={imgRef}
                src={currentUrl} 
                alt={getFileName(currentUrl, currentIndex)} 
                className="max-w-[90vw] max-h-[72vh] object-contain shadow-2xl rounded pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : fileType === 'pdf' ? (
            <div className="w-full h-full max-w-5xl bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* PDF Header warning regarding iframe security / download handles */}
              <div className="p-3 bg-slate-800/40 text-xs text-slate-300 flex items-center justify-between border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Visualizador de PDF integrado
                </span>
                <a 
                  href={currentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg flex items-center gap-1 transition shadow border border-slate-700/50"
                >
                  Abrir tela cheia <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex-1 w-full h-full relative">
                <iframe 
                  src={`${currentUrl}#toolbar=1`}
                  className="w-full h-full border-none bg-slate-900"
                  title="PDF Document Preview"
                />
              </div>
            </div>
          ) : (
            // Unknown or external link formats (Google Drive / Word files)
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-slate-800/80 text-primary-light flex items-center justify-center mx-auto rounded-2xl border border-slate-700/50">
                <FileText size={32} className="text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Visualização não suportada</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Este anexo é um link externo ou possui um formato que não pode ser renderizado diretamente na interface.
                </p>
              </div>
              
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 font-mono text-xs truncate text-slate-300">
                {currentUrl}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a 
                  href={currentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 btn btn-primary flex items-center justify-center space-x-2 py-3"
                >
                  <ExternalLink size={16} />
                  <span>Acessar Link Externo</span>
                </a>
                <button 
                  onClick={onClose}
                  className="flex-1 btn btn-secondary hover:bg-slate-800 border-slate-700 text-slate-300 py-3"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Sidebar with Attachments list */}
        {files.length > 1 && (
          <div className="w-full md:w-64 bg-slate-900/60 border-t md:border-t-0 md:border-l border-slate-800/80 flex flex-col min-h-[140px] md:min-h-0">
            <div className="p-3 border-b border-slate-800 hidden md:block">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Todos os Anexos</h3>
            </div>
            <div className="flex-1 flex md:flex-col overflow-x-auto md:overflow-y-auto p-4 gap-3 select-none scrollbar-thin scrollbar-thumb-slate-800">
              {files.map((url, index) => {
                const isActive = index === currentIndex;
                const type = getFileType(url);
                return (
                  <button 
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "flex-shrink-0 md:flex-shrink-1 flex items-center space-x-3 p-2 rounded-xl border text-left transition-all w-48 md:w-full",
                      isActive 
                        ? "bg-slate-800 border-primary text-white" 
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-800/30 hover:border-slate-700 hover:text-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                      isActive ? "bg-primary/20 text-white" : "bg-slate-800/50 text-slate-400"
                    )}>
                      {type === 'image' && url.startsWith('data:') ? (
                        <img 
                          src={url} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      ) : type === 'pdf' ? (
                        <FileText size={18} className="text-blue-400" />
                      ) : (
                        <Image size={18} className="text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {getFileName(url, index)}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">
                        {type}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Helpful Tips bar */}
      <div className="p-2 border-t border-slate-800/50 bg-slate-900/10 text-center text-[10px] text-slate-500 hidden md:flex items-center justify-center gap-4">
        <span className="flex items-center gap-1"><HelpCircle size={12} /> Atalhos de Teclado Úteis:</span>
        <span>Mudar de anexo: <kbd className="px-1 bg-slate-800 border border-slate-750 font-mono text-[9px] rounded">Seta Esquerda</kbd> e <kbd className="px-1 bg-slate-800 border border-slate-750 font-mono text-[9px] rounded">Seta Direita</kbd></span>
        <span>Ajuste de Imagem: Pressione <kbd className="px-1 bg-slate-805 border border-slate-750 font-mono text-[9px] rounded">+</kbd> ou <kbd className="px-1 bg-slate-800 border border-slate-750 font-mono text-[9px] rounded">-</kbd> para zoom, ou <kbd className="px-1 bg-slate-800 border border-slate-750 font-mono text-[9px] rounded">R</kbd> para resetar</span>
        <span>Fechar: <kbd className="px-1 bg-slate-800 border border-slate-150 font-mono text-[9px] rounded">Esc</kbd></span>
      </div>
    </div>
  );
}
