import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';

import { authService } from '../../services/auth';
import { safeStorage } from '../../lib/safeStorage';

const REMEMBER_EMAIL_KEY = 'lumos_remember_email';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrarMe, setLembrarMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const hasCheckedAuth = useRef(false);

  // Carrega "lembrar-me" (email) uma vez
  useEffect(() => {
    const savedEmail = safeStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setLembrarMe(true);
    }
  }, []);

  // Verifica se já está logado e redireciona
  useEffect(() => {
    if (hasCheckedAuth.current) return;

    const { isAuthenticated, user } = authService.getAuthState();
    if (isAuthenticated && user) {
      hasCheckedAuth.current = true;
      const redirectPath = authService.getRedirectPath(user.papel);
      navigate(redirectPath, { replace: true });
      return;
    }

    hasCheckedAuth.current = true;
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !senha) {
        setError('Preencha email e senha.');
        return;
      }

      const result = await authService.login(cleanEmail, senha);

      if (result.success && result.user) {
        // Lembrar-me: salva ou remove o email
        if (lembrarMe) {
          safeStorage.setItem(REMEMBER_EMAIL_KEY, cleanEmail);
        } else {
          safeStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        const redirectPath = authService.getRedirectPath(result.user.papel);
        navigate(redirectPath, { replace: true });
        return;
      }

      setError(result.error || 'Erro ao fazer login');
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro interno do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Se você quiser implementar reset real depois:
    // supabase.auth.resetPasswordForEmail(email)
    setInfo('Recuperação de senha ainda não configurada. Fale com a coordenação para redefinir o acesso.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Colégio Lumos</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lembrar"
                checked={lembrarMe}
                onCheckedChange={(checked) => setLembrarMe(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="lembrar" className="text-sm">
                Lembrar-me
              </Label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {info && (
              <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
                {info}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Esqueceu sua senha?
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Contas de teste:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Coordenador:</strong> coordenador@colegiolumos.com.br / 123456</p>
              <p><strong>Professor:</strong> prof@demo.com / 123456</p>
              <p><strong>Aluno:</strong> aluno@demo.com / 123456</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
