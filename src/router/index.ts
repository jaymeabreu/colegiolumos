import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { useEffect, useRef } from "react";
import routes from "./config";
import { authService } from "../services/auth";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      window.REACT_APP_NAVIGATE = navigate;
      navigateResolver(window.REACT_APP_NAVIGATE);
      
      // Registra o navigate no authService para logout funcionar
      authService.setNavigate((path: string, options?: any) => {
        navigate(path, options);
      });
      
      isInitialized.current = true;
    }
  }, [navigate]);

  return element;
}
