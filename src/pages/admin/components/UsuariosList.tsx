import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Copy,
  Shuffle,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { supabaseService, Usuario, Aluno } from '../../../services/supabaseService';

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    papel: '',
    temAluno: '',
    temProfessor: '',
  });

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    papel: '',
    alunoId: '',
    senha: '',
    confirmarSenha: '',
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const usuariosData = await supabaseService.getUsuarios();
      const alunosData = await supabaseService.getAlunos();
      setUsuarios(usuariosData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsuarios = useMemo(() => {
    if (!searchTerm && !Object.values(filters).some((v) => v && v !== 'all')) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      if (
        searchTerm &&
        !usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (filters.papel && filters.papel !== 'all' && usuario.papel !== filters.papel) {
        return false;
      }

      if (filters.temAluno && filters.temAluno !== 'all') {
        if (filters.temAluno === 'sim' && !usuario.alunoId) return false;
        if (filters.temAluno === 'nao' && usuario.alunoId) return false;
      }

      if (filters.temProfessor && filters.temProfessor !== 'all') {
        if (filters.temProfessor === 'sim' && !usuario.professorId) return false;
        if (filters.temProfessor === 'nao' && usuario.professorId) return false;
      }

      return true;
    });
  }, [usuarios, searchTerm, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      papel: '',
      temAluno: '',
      temProfessor: '',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== '' && value !== 'all');
  }, [filters]);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      senha: password,
      confirmarSenha: password,
    }));
  }, []);

  const copyPassword = useCallback(() => {
    if (formData.senha) {
      navigator.clipboard.writeText(formData.senha);
    }
  }, [formData.senha]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (formData.senha !== formData.confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
      }

      // VALIDAÇÃO DO PAPEL
      if (!formData.papel || formData.papel.trim() === '') {
        alert('Por favor, selecione um papel para o usuário!');
        return;
      }

      try {
        setIsLoading(true);
        const data = {
          nome: formData.nome,
          email: formData.email,
          papel: formData.papel as 'COORDENADOR' | 'PROFESSOR' | 'ALUNO',
          aluno_id: formData.alunoId ? Number(formData.alunoId) : undefined,
        };

        if (editingUsuario) {
          // Se tem senha nova, atualiza também
          if (formData.senha) {
            await supabaseService.updateUsuario(editingUsuario.id, {
              ...data,
              senha: formData.senha
            });
          } else {
            await supabaseService.updateUsuario(editingUsuario.id, data);
          }
        } else {
          if (!formData.senha) {
            alert('Senha é obrigatória para novos usuários!');
            return;
          }
          await supabaseService.createUsuario(data, formData.senha);
        }

        await loadData();
        setIsDialogOpen(false);
        resetForm();
        alert(editingUsuario ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro ao salvar usuário. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    },
    [formData, editingUsuario, loadData]
  );

  const handleEdit = useCallback((usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      alunoId: usuario.alunoId?.toString() || '',
      senha: '',
      confirmarSenha: '',
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
          setIsLoading(true);
          await supabaseService.deleteUsuario(id);
          await loadData();
          alert('Usuário excluído com sucesso!');
        } catch (error) {
          console.error('Erro ao excluir usuário:', error);
          alert('Erro ao excluir usuário. Tente novamente.');
        } finally {
          setIsLoading(false);
        }
      }
    },
    [loadData]
  );

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      email: '',
      papel: '',
      alunoId: '',
      senha: '',
      confirmarSenha: '',
    });
    setEditingUsuario(null);
    setShowPassword(false);
  }, []);

  const getRoleBadgeColor = useCallback((role: string) => {
    switch (role) {
      case 'COORDENADOR':
        return 'bg-purple-100 text-purple-800';
      case 'PROFESSOR':
        return 'bg-blue-100 text-blue-800';
      case 'ALUNO':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getAlunoNome = useCallback(
    (alunoId?: number) => {
      if (!alunoId) return '';
      return alunos.find((a) => a.id === alunoId)?.nome || '';
    },
    [alunos]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="card-title">Usuários</h3>
            <p className="card-description">
              Gerencie os usuários do sistema
            </p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <style>{`
                [data-radix-popper-content-wrapper] {
                  z-index: 99999 !important;
                }
              `}</style>
              <DialogHeader>
                <DialogTitle>
                  {editingUsuario ? 'Editar usuário' : 'Novo usuário'}
                </DialogTitle>
                <DialogDescription>
                  {editingUsuario
                    ? 'Atualize os dados deste usuário.'
                    : 'Preencha os dados para criar um novo usuário.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label>Papel *</Label>
                  <Select
                    value={formData.papel}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, papel: value }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                      <SelectItem value="ALUNO">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.papel === 'ALUNO' && (
                  <div>
                    <Label htmlFor="alunoId">Aluno vinculado (opcional)</Label>
                    <Select
                      value={formData.alunoId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, alunoId: value }))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {alunos.map((aluno) => (
                          <SelectItem key={aluno.id} value={String(aluno.id)}>
                            {aluno.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="senha">
                      {editingUsuario ? 'Nova senha (opcional)' : 'Senha *'}
                    </Label>
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          senha: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                    <Input
                      id="confirmarSenha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmarSenha}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmarSenha: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    disabled={isLoading}
                  >
                    <Shuffle className="h-4 w-4 mr-1" />
                    Gerar senha
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                    disabled={!formData.senha || isLoading}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : editingUsuario ? 'Salvar alterações' : 'Criar usuário'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={`flex items-center gap-2 whitespace-nowrap ${
                  hasActiveFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : ''
                }`}
                disabled={isLoading}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {
                      Object.values(filters).filter(
                        (v) => v !== '' && v !== 'all'
                      ).length
                    }
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <style>{`
                [data-radix-popper-content-wrapper] {
                  z-index: 99999 !important;
                }
              `}</style>
              <DialogHeader>
                <DialogTitle>Filtrar Usuários</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Papel</Label>
                  <Select
                    value={filters.papel}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, papel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                      <SelectItem value="ALUNO">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tem Aluno?</Label>
                  <Select
                    value={filters.temAluno}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, temAluno: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer um" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer um</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{usuario.nome}</h3>
                  <Badge className={getRoleBadgeColor(usuario.papel)}>
                    {usuario.papel}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  <p>Email: {usuario.email}</p>
                  {usuario.alunoId && (
                    <p>Aluno vinculado: {getAlunoNome(usuario.alunoId)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="none"
                  className="h-8 w-8 p-0 inline-flex items-center justify-center"
                  onClick={() => handleEdit(usuario)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="none"
                  className="h-8 w-8 p-0 inline-flex items-center justify-center"
                  onClick={() => handleDelete(usuario.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredUsuarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UsuariosList;
