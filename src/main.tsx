import "flatpickr/dist/flatpickr.css";
import "jsvectormap/dist/jsvectormap.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "simplebar-react/dist/simplebar.min.css";
import "swiper/swiper-bundle.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./features/auth/AuthProvider.tsx";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider><AppWrapper><App /></AppWrapper></AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
