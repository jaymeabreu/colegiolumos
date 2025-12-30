import { safeStorage } from '@/lib/safeStorage';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  id: number; // id interno da tabela public.usuarios
  authUserId: string; // uuid do auth.users
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

        // validação mínima do payload salvo
        if (
          user &&
          typeof user === 'object' &&
          typeof user.id === 'number' &&
          typeof user.email === 'string' &&
          typeof user.papel === 'string' &&
          typeof user.authUserId === 'string'
        ) {
          this.cachedAuthState = { user, isAuthenticated: true };
          return this.cachedAuthState;
        }
      }
    } catch {
      // storage corrompido
      safeStorage.removeItem(this.storageKey);
    }

    this.cachedAuthState = { user: null, isAuthenticated: false };
    return this.cachedAuthState;
  }

  async login(
    email: string,
    senha: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanSenha = (senha || '').trim();

      // Logs mínimos para depurar payload (removi a senha do log por segurança)
      console.log('LOGIN TRY:', { email: cleanEmail, senhaLen: cleanSenha.length });

      // 1) Login via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanSenha,
      });

      if (error || !data?.user) {
        console.error('SUPABASE SIGNIN ERROR:', {
          message: error?.message,
          status: (error as any)?.status,
          name: (error as any)?.name,
          code: (error as any)?.code,
        });

        // Mensagem que vem do Supabase ajuda a entender "invalid_credentials" vs "email_not_confirmed" etc.
        return { success: false, error: error?.message || 'Falha ao autenticar' };
      }

      const authUserId = data.user.id;

      // 2) Busca perfil no seu domínio (public.usuarios)
      const { data: usuario, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (perfilError || !usuario) {
        console.error('PERFIL ERROR / usuario não encontrado:', {
          perfilError,
          authUserId,
        });

        // Usuário autenticou, mas não tem perfil/role cadastrado
        await supabase.auth.signOut();
        return { success: false, error: 'Usuário sem perfil cadastrado no sistema' };
      }

      const user: User = {
        id: usuario.id,
        authUserId,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        alunoId: usuario.aluno_id ?? undefined,
        professorId: usuario.professor_id ?? undefined,
      };

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
      case 'COORDENADOR':
        return '/app/admin';
      case 'PROFESSOR':
        return '/app/professor';
      case 'ALUNO':
        return '/app/aluno';
      default:
        return '/';
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
