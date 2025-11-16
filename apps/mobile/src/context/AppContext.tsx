import { createContext, ReactNode, useCallback,useContext, useState } from 'react';

import LoadingOverlay from '~/components/common/LoadingOverlay';

type AppContextType = {
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  // Add more global state/actions here as needed
};

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string | undefined>(undefined);

  const showLoading = useCallback((msg?: string) => {
    setLoadingText(msg);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingText(undefined);
  }, []);

  return (
    <>
      <AppContext.Provider value={{ showLoading, hideLoading, isLoading: isLoading }}>
        {children}
      </AppContext.Provider>

      <LoadingOverlay visible={isLoading} text={loadingText} />
    </>
  );
};
