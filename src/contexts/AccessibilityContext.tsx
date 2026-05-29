import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 87.5 | 100 | 112.5 | 125 | 137.5;

interface AccessibilityContextType {
  fontSizeScale: FontSize;
  highContrast: boolean;
  dyslexicFont: boolean;
  screenReaderActive: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleHighContrast: () => void;
  toggleDyslexicFont: () => void;
  toggleScreenReader: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeScale, setFontSizeScale] = useState<FontSize>(() => {
    const saved = localStorage.getItem('accessibility-font-scale');
    return saved ? (parseFloat(saved) as FontSize) : 100;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-high-contrast') === 'true';
  });

  const [dyslexicFont, setDyslexicFont] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-dyslexic-font') === 'true';
  });

  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-screen-reader') === 'true';
  });

  // Apply font size scale to documentElement HTML
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.fontSize = `${fontSizeScale}%`;
    localStorage.setItem('accessibility-font-scale', fontSizeScale.toString());
  }, [fontSizeScale]);

  // Apply high contrast styling class
  useEffect(() => {
    const root = window.document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('accessibility-high-contrast', highContrast.toString());
  }, [highContrast]);

  // Apply dyslexic-friendly font styling class
  useEffect(() => {
    const root = window.document.documentElement;
    if (dyslexicFont) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }
    localStorage.setItem('accessibility-dyslexic-font', dyslexicFont.toString());
  }, [dyslexicFont]);

  // Apply screen reader tracking hover / focus speak actions
  useEffect(() => {
    localStorage.setItem('accessibility-screen-reader', screenReaderActive.toString());
    
    if (!screenReaderActive) return;

    // Use Speech Synthesis with PT-BR voice helper
    const speakText = (text: string) => {
      if (!text || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      // Lower rate slightly for better academic comprehension
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    };

    let hoverTimeout: NodeJS.Timeout;

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const readable = target.closest('p, h1, h2, h3, h4, span, button, a, input, label, select, textarea, td, th');
      if (readable) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          const text = readable.textContent || readable.getAttribute('aria-label') || readable.getAttribute('placeholder') || '';
          const cleanText = text.trim();
          if (cleanText) {
            speakText(cleanText);
          }
        }, 150); // Small debounce to avoid speaking while moving fast
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const text = target.textContent || target.getAttribute('aria-label') || target.getAttribute('placeholder') || '';
      const cleanText = text.trim();
      if (cleanText) {
        speakText(cleanText);
      }
    };

    document.addEventListener('mouseover', handleHover);
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      clearTimeout(hoverTimeout);
      document.removeEventListener('mouseover', handleHover);
      document.removeEventListener('focusin', handleFocus);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [screenReaderActive]);

  // Keyboard Shortcuts implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt key modifiers for keyboard accessibility shortcuts
      if (e.altKey) {
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          toggleHighContrast();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          toggleDyslexicFont();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          toggleScreenReader();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetFontSize();
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          increaseFontSize();
        } else if (e.key === '-') {
          e.preventDefault();
          decreaseFontSize();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fontSizeScale, highContrast, dyslexicFont, screenReaderActive]);

  const increaseFontSize = () => {
    setFontSizeScale((prev) => {
      if (prev === 87.5) return 100;
      if (prev === 100) return 112.5;
      if (prev === 112.5) return 125;
      if (prev === 125) return 137.5;
      return prev;
    });
  };

  const decreaseFontSize = () => {
    setFontSizeScale((prev) => {
      if (prev === 137.5) return 125;
      if (prev === 125) return 112.5;
      if (prev === 112.5) return 100;
      if (prev === 100) return 87.5;
      return prev;
    });
  };

  const resetFontSize = () => setFontSizeScale(100);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleDyslexicFont = () => setDyslexicFont((prev) => !prev);
  const toggleScreenReader = () => setScreenReaderActive((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
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
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
