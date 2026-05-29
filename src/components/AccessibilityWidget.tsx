import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useTheme } from '../contexts/ThemeContext';
import { Accessibility, Eye, Volume2, Type, Star, X, Sun, Moon, Minus, Plus, RefreshCw, Key } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  
  const {
    fontSizeScale,
    highContrast,
    dyslexicFont,
    screenReaderActive,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleHighContrast,
    toggleDyslexicFont,
    toggleScreenReader,
  } = useAccessibility();

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={widgetRef} className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col items-end">
      {/* Accessibility popup panel */}
      {isOpen && (
        <div 
          className="mb-3 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-200 card"
          role="dialog"
          aria-label="Painel de Acessibilidade"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Accessibility size={18} className="text-primary" />
              Recursos de Acessibilidade
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              aria-label="Fechar painel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Font Size controls */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tamanho da Fonte ({fontSizeScale}%)</span>
                <button 
                  onClick={resetFontSize}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Resetar
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <button 
                  onClick={decreaseFontSize}
                  className="flex-1 flex items-center justify-center p-2 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition"
                  title="Diminuir Fonte"
                >
                  <Minus size={14} className="mr-1" />
                  <span className="text-xs font-bold">A-</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                <button 
                  onClick={increaseFontSize}
                  className="flex-1 flex items-center justify-center p-2 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition"
                  title="Aumentar Fonte"
                >
                  <Plus size={14} className="mr-1" />
                  <span className="text-xs font-bold">A+</span>
                </button>
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-1 gap-2">
              {/* High Contrast */}
              <button 
                onClick={toggleHighContrast}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition text-left text-xs font-medium w-full",
                  highContrast 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span className="flex items-center gap-2">
                  <Eye size={16} />
                  Alto Contraste
                </span>
                <span className={cn("inline-block w-2.5 h-2.5 rounded-full", highContrast ? "bg-primary animate-pulse" : "bg-slate-300 dark:bg-slate-700")} />
              </button>

              {/* Dyslexic Font */}
              <button 
                onClick={toggleDyslexicFont}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition text-left text-xs font-medium w-full",
                  dyslexicFont 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span className="flex items-center gap-2">
                  <Type size={16} className="stroke-[2.5]" />
                  Fonte para Dislexia
                </span>
                <span className={cn("inline-block w-2.5 h-2.5 rounded-full", dyslexicFont ? "bg-primary animate-pulse" : "bg-slate-300 dark:bg-slate-700")} />
              </button>

              {/* Assistive Voice reader */}
              <button 
                onClick={toggleScreenReader}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition text-left text-xs font-medium w-full",
                  screenReaderActive 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span className="flex items-center gap-2">
                  <Volume2 size={16} />
                  Leitor de Tela por Voz
                </span>
                <span className={cn("inline-block w-2.5 h-2.5 rounded-full", screenReaderActive ? "bg-primary animate-pulse" : "bg-slate-300 dark:bg-slate-700")} />
              </button>

              {/* Quick theme toggler */}
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-left text-xs font-medium w-full"
              >
                <span className="flex items-center gap-2">
                  {theme === 'Claro' ? <Sun size={16} /> : <Moon size={16} />}
                  Tema: {theme}
                </span>
                <span className="text-[10px] text-slate-500 lowercase">mudar</span>
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 text-center font-medium">
            Segure <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border">Alt</kbd> + H / D / S para atalhos do teclado.
          </div>
        </div>
      )}

      {/* Main floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 flex items-center justify-center rounded-full shadow-2xl transition duration-300 transform active:scale-90",
          isOpen 
            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-2 border-primary/40 rotate-90" 
            : "bg-primary text-white hover:bg-blue-600 hover:scale-110 border border-primary-light"
        )}
        aria-label="Abrir recursos de acessibilidade"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} /> : <Accessibility size={24} />}
      </button>
    </div>
  );
}
