import { safeStorage } from '@/lib/safeStorage';
import { supabase } from '@/lib/supabaseClient';
import { verifyPassword } from '@/lib/hashUtils';

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
      // 1) Busca usuário no banco por email
      const { data: usuario, error: queryError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (queryError || !usuario) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // 2) Verifica a senha
      const senhaCorreta = await verifyPassword(senha, usuario.senha_hash);

      if (!senhaCorreta) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // 3) Cria objeto User
      const user: User = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        alunoId: usuario.aluno_id ?? undefined,
        professorId: usuario.professor_id ?? undefined,
      };

      // 4) Salva no localStorage
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
