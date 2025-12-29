// Utilitário para localStorage seguro
// Evita erros de SecurityError em ambientes restritos

class SafeStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability(); 
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.isAvailable) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  removeItem(key: string): void {
    if (!this.isAvailable) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silenciosamente ignora erros
    }
  }
}

export const safeStorage = new SafeStorage();
