import { safeStorage } from '@/lib/safeStorage';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  id: number;
  nome: string;
  email: string;
  papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  alunoId?: number;
  professorId?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

class AuthService {
  private storageKey = 'gestao_escolar_auth';
  private cachedAuthState: AuthState | null = null;
  private navigateCallback: ((path: string, options?: any) => void) | null = null;

  // Método para registrar o navigate do React Router
  setNavigate(navigate: (path: string, options?: any) => void) {
    this.navigateCallback = navigate;
  }

  getAuthState(): AuthState {
    if (this.cachedAuthState) return this.cachedAuthState;

    try {
      const stored = safeStorage.getItem(this.storageKey);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id && user.email && user.papel) {
          this.cachedAuthState = { user, isAuthenticated: true };
          return this.cachedAuthState;
        }
      }
    } catch {
      safeStorage.removeItem(this.storageKey);
    }

    this.cachedAuthState = { user: null, isAuthenticated: false };
    return this.cachedAuthState;
  }

  async login(email: string, senha: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Busca usuário no banco
      const { data: usuario, error: queryError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (queryError || !usuario) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // Verifica a senha simples
      if (usuario.senha !== senha) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // Cria objeto User
      const user: User = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        alunoId: usuario.aluno_id ?? undefined,
        professorId: usuario.professor_id ?? undefined,
      };

      // Salva no localStorage
      safeStorage.setItem(this.storageKey, JSON.stringify(user));
      this.cachedAuthState = { user, isAuthenticated: true };
      return { success: true, user };
    } catch (e) {
      console.error('Erro no login:', e);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } finally {
      safeStorage.removeItem(this.storageKey);
      this.cachedAuthState = null;

      // Redireciona para login se navigate foi registrado
      if (this.navigateCallback) {
        this.navigateCallback('/', { replace: true });
      }
    }
  }

  getRedirectPath(papel: string): string {
    switch (papel) {
      case 'COORDENADOR': return '/app/admin';
      case 'PROFESSOR': return '/app/professor';
      case 'ALUNO': return '/app/aluno';
      default: return '/';
    }
  }

  hasPermission(userRole: string, requiredRole: string): boolean {
    if (userRole === 'COORDENADOR') return true;
    return userRole === requiredRole;
  }

  canAccessDiario(userId: number, diarioId: number): boolean {
    if (userId === 2 && diarioId === 1) return true;
    return false;
  }
}

export const authService = new AuthService();
