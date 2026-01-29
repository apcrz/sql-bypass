// @/context/ThemeContext.tsx

'use client';

import {
   createContext,
   useContext,
   useEffect,
   useState,
   ReactNode,
} from 'react';

type ThemeContextType = {
   theme: string;
   setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
   theme: 'business',
   setTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
   const [theme, setThemeState] = useState('business');
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      const savedTheme =
         typeof window !== 'undefined'
            ? localStorage.getItem('app-theme')
            : null;

      const initialTheme = savedTheme || 'business';

      setThemeState(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      setMounted(true);
   }, []);

   const setTheme = (newTheme: string) => {
      setThemeState(newTheme);
      localStorage.setItem('app-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
   };

   return (
      <ThemeContext.Provider value={{ theme, setTheme }}>
         {mounted ? children : null}
      </ThemeContext.Provider>
   );
}

export function useTheme() {
   return useContext(ThemeContext);
}
