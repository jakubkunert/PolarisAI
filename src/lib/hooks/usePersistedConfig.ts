import { useState, useEffect } from 'react';

interface PersistedConfig {
  selectedProvider: string;
  apiKey: string;
  rememberSettings: boolean;
}

const CONFIG_STORAGE_KEY = 'polaris-ai-config';

const defaultConfig: PersistedConfig = {
  selectedProvider: '',
  apiKey: '',
  rememberSettings: true,
};

export function usePersistedConfig(onSave?: (config: PersistedConfig) => void) {
  const [config, setConfig] = useState<PersistedConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;

    try {
      if (config.rememberSettings) {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        onSave?.(config);
      } else {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }, [config, isLoaded, onSave]);

  const updateConfig = (updates: Partial<PersistedConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const clearConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  };

  const toggleRememberSettings = () => {
    const newRememberSettings = !config.rememberSettings;
    updateConfig({ rememberSettings: newRememberSettings });

    // If turning off remember settings, clear storage
    if (!newRememberSettings) {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  };

  return {
    config,
    isLoaded,
    updateConfig,
    clearConfig,
    toggleRememberSettings,
  };
}
