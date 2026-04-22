'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FormData, ContractTemplate } from './types';
import { DEFAULT_TEMPLATE } from './types';

export type Screen = 'dashboard' | 'editor' | 'form' | 'preview';

interface NavigationContextType {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  templateContent: string;
  setTemplateContent: (content: string) => void;
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
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const navigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const resetToDefault = useCallback(() => {
    setTemplateContent(DEFAULT_TEMPLATE);
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
