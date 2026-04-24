'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FormData, ContractTemplate, LogoPosition } from './types';
import { DEFAULT_DOCUMENT_FONT, DEFAULT_TEMPLATE } from './types';

export type Screen = 'dashboard' | 'editor' | 'form' | 'preview' | 'pdf-merge' | 'pdf-compress';

interface NavigationContextType {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  templateContent: string;
  setTemplateContent: (content: string) => void;
  templateFontFamily: string;
  setTemplateFontFamily: (fontFamily: string) => void;
  templateLogoDataUrl: string;
  setTemplateLogoDataUrl: (logoDataUrl: string) => void;
  templateLogoWidthMm: number;
  setTemplateLogoWidthMm: (width: number) => void;
  templateLogoPosition: LogoPosition;
  setTemplateLogoPosition: (position: LogoPosition) => void;
  formData: FormData | null;
  setFormData: (data: FormData | null) => void;
  selectedTemplate: ContractTemplate | null;
  setSelectedTemplate: (template: ContractTemplate | null) => void;
  resetToDefault: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [templateContent, setTemplateContent] = useState<string>(DEFAULT_TEMPLATE);
  const [templateFontFamily, setTemplateFontFamily] = useState<string>(DEFAULT_DOCUMENT_FONT);
  const [templateLogoDataUrl, setTemplateLogoDataUrl] = useState<string>('');
  const [templateLogoWidthMm, setTemplateLogoWidthMm] = useState<number>(36);
  const [templateLogoPosition, setTemplateLogoPosition] = useState<LogoPosition>('center');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const navigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const resetToDefault = useCallback(() => {
    setTemplateContent(DEFAULT_TEMPLATE);
    setTemplateFontFamily(DEFAULT_DOCUMENT_FONT);
    setTemplateLogoDataUrl('');
    setTemplateLogoWidthMm(36);
    setTemplateLogoPosition('center');
    setFormData(null);
    setSelectedTemplate(null);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        navigate,
        templateContent,
        setTemplateContent,
        templateFontFamily,
        setTemplateFontFamily,
        templateLogoDataUrl,
        setTemplateLogoDataUrl,
        templateLogoWidthMm,
        setTemplateLogoWidthMm,
        templateLogoPosition,
        setTemplateLogoPosition,
        formData,
        setFormData,
        selectedTemplate,
        setSelectedTemplate,
        resetToDefault,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
