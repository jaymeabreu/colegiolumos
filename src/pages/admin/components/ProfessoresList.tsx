import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Copy,
  Filter,
  Upload,
  X,
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
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../components/ui/avatar';
import {
  mockDataService,
  Professor,
  Usuario,
  Disciplina,
} from '../../../services/mockData';

export function ProfessoresList() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estados dos filtros - simplificados
  const [filters, setFilters] = useState({
    disciplinaId: '',
    situacao: '',
    temUsuario: '',
    formacao: '',
  });

  // Estados para upload de imagem
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    contato: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    sexo: '',
    endereco: '',
    bairro: '',
    cidade: '',
    cep: '',
    estado: '',
    formacao: '',
    especializacao: '',
    registro: '',
    dataAdmissao: '',
    situacao: 'Ativo',
    observacoes: '',
    disciplinasIds: [] as string[],
    criarUsuario: true,
    senhaUsuario: '',
    foto: '',
  });

  const loadData = useCallback(() => {
    setProfessores(mockDataService.getProfessores());
    setUsuarios(mockDataService.getUsuarios());
    setDisciplinas(mockDataService.getDisciplinas());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtros ultra-otimizados
  const filteredProfessores = useMemo(() => {
    if (
      !searchTerm &&
      !Object.values(filters).some((v) => v && v !== 'all')
    ) {
      return professores; // Retorna lista completa sem processamento
    }

    return professores.filter((professor) => {
      // Filtro de busca simples primeiro
      if (
        searchTerm &&
        !professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !professor.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtros básicos
      if (
        filters.situacao &&
        filters.situacao !== 'all' &&
        (professor as any).situacao !== filters.situacao
      )
        return false;

      if (
        filters.formacao &&
        filters.formacao !== 'all' &&
        (professor as any).formacao !== filters.formacao
      )
        return false;

      // Filtros mais pesados apenas se necessário
      if (filters.disciplinaId && filters.disciplinaId !== 'all') {
        const professorDisciplinas = (professor as any).disciplinasIds || [];
        if (!professorDisciplinas.includes(Number(filters.disciplinaId)))
          return false;
      }

      if (filters.temUsuario && filters.temUsuario !== 'all') {
        const usuarioVinculado = usuarios.some(
          (u) => u.professorId === professor.id
        );
        if (filters.temUsuario === 'sim' && !usuarioVinculado) return false;
        if (filters.temUsuario === 'nao' && usuarioVinculado) return false;
      }

      return true;
    });
  }, [professores, searchTerm, filters, usuarios]);

  const clearFilters = useCallback(() => {
    setFilters({
      disciplinaId: '',
      situacao: '',
      temUsuario: '',
      formacao: '',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      (value) => value !== '' && value !== 'all'
    );
  }, [filters]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (formData.criarUsuario && !editingProfessor && !formData.senhaUsuario) {
        alert('Senha é obrigatória para criar usuário!');
        return;
      }

      if (formData.disciplinasIds.length === 0) {
        alert('Selecione pelo menos uma disciplina!');
        return;
      }

      const professorData = {
        nome: formData.nome,
        email: formData.email,
        contato: formData.contato,
        dataNascimento: formData.dataNascimento,
        cpf: formData.cpf,
        rg: formData.rg,
        sexo: formData.sexo,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cidade: formData.cidade,
        cep: formData.cep,
        estado: formData.estado,
        formacao: formData.formacao,
        especializacao: formData.especializacao,
        registro: formData.registro,
        dataAdmissao: formData.dataAdmissao,
        situacao: formData.situacao,
        observacoes: formData.observacoes,
        disciplinasIds: formData.disciplinasIds.map((id) => Number(id)),
        foto: selectedImage || formData.foto || '',
      };

      let professor;
      if (editingProfessor) {
        professor = mockDataService.updateProfessor(
          editingProfessor.id,
          professorData
        );
      } else {
        professor = mockDataService.createProfessor(professorData);
      }

      if (
        formData.criarUsuario &&
        professor &&
        formData.senhaUsuario &&
        !editingProfessor
      ) {
        const usuarioData = {
          nome: formData.nome,
          email: formData.email,
          papel: 'PROFESSOR' as const,
          professorId: professor.id,
        };

        mockDataService.createUsuario(usuarioData, formData.senhaUsuario);
      }

      loadData();
      resetForm();
    },
    [formData, editingProfessor, selectedImage, loadData]
  );

  const handleEdit = useCallback((professor: Professor) => {
    setEditingProfessor(professor);
    setSelectedImage((professor as any).foto || null);
    setFormData({
      nome: professor.nome,
      email: professor.email,
      contato: (professor as any).contato || '',
      dataNascimento: (professor as any).dataNascimento || '',
      cpf: (professor as any).cpf || '',
      rg: (professor as any).rg || '',
      sexo: (professor as any).sexo || '',
      endereco: (professor as any).endereco || '',
      bairro: (professor as any).bairro || '',
      cidade: (professor as any).cidade || '',
      cep: (professor as any).cep || '',
      estado: (professor as any).estado || '',
      formacao: (professor as any).formacao || '',
      especializacao: (professor as any).especializacao || '',
      registro: (professor as any).registro || '',
      dataAdmissao: (professor as any).dataAdmissao || '',
      situacao: (professor as any).situacao || 'Ativo',
      observacoes: (professor as any).observacoes || '',
      disciplinasIds: ((professor as any).disciplinasIds || [])
        .map((id: number) => id.toString()),
      criarUsuario: false,
      senhaUsuario: '',
      foto: (professor as any).foto || '',
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (confirm('Tem certeza que deseja excluir este professor?')) {
        const usuarioVinculado = usuarios.find((u) => u.professorId === id);
        if (usuarioVinculado) {
          mockDataService.deleteUsuario(usuarioVinculado.id);
        }
        mockDataService.deleteProfessor(id);
        loadData();
      }
    },
    [usuarios, loadData]
  );

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      email: '',
      contato: '',
      dataNascimento: '',
      cpf: '',
      rg: '',
      sexo: '',
      endereco: '',
      bairro: '',
      cidade: '',
      cep: '',
      estado: '',
      formacao: '',
      especializacao: '',
      registro: '',
      dataAdmissao: '',
      situacao: '',
      observacoes: '',
      disciplinasIds: [],
      criarUsuario: true,
      senhaUsuario: '',
      foto: '',
    });
    setSelectedImage(null);
    setEditingProfessor(null);
    setIsDialogOpen(false);
    setShowPassword(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const gerarSenha = useCallback(() => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, senhaUsuario: senha }));
  }, []);

  const copiarSenha = useCallback(async () => {
    if (formData.senhaUsuario) {
      try {
        await navigator.clipboard.writeText(formData.senhaUsuario);
      } catch (err) {
        console.error('Erro ao copiar senha:', err);
      }
    }
  }, [formData.senhaUsuario]);

  // Funções otimizadas
  const getUsuarioVinculado = useCallback(
    (professorId: number) => {
      return usuarios.find((u) => u.professorId === professorId);
    },
    [usuarios]
  );

  const getDisciplinasNomes = useCallback(
    (disciplinasIds?: number[]) => {
      if (!disciplinasIds || disciplinasIds.length === 0) return '';
      return disciplinasIds
        .map((id) => disciplinas.find((d) => d.id === id)?.nome)
        .filter(Boolean)
        .join(', ');
    },
    [disciplinas]
  );

  const handleDisciplinaChange = useCallback(
    (disciplinaId: string, checked: boolean) => {
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          disciplinasIds: [...prev.disciplinasIds, disciplinaId],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          disciplinasIds: prev.disciplinasIds.filter((id) => id !== disciplinaId),
        }));
      }
    },
    []
  );

  // Funções para upload de imagem
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;
          setSelectedImage(imageSrc);
          setFormData((prev) => ({ ...prev, foto: imageSrc }));
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setFormData((prev) => ({ ...prev, foto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="space-y-2">
            <h3 className="card-title">Professores</h3>
            <p className="card-description">
              Gerencie os professores da escola
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Professor</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] lg:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações completas do professor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">

                  {/* Dados Básicos */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Dados Básicos</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) =>
                            setFormData({ ...formData, nome: e.target.value })
                          }
                          placeholder="Nome Completo"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="E-mail"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="contato"
                          value={formData.contato}
                          onChange={(e) =>
                            setFormData({ ...formData, contato: e.target.value })
                          }
                          placeholder="Telefone"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.dataNascimento}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dataNascimento: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) =>
                            setFormData({ ...formData, cpf: e.target.value })
                          }
                          placeholder="CPF"
                        />
                      </div>
                      <div>
                        <Input
                          id="rg"
                          value={formData.rg}
                          onChange={(e) =>
                            setFormData({ ...formData, rg: e.target.value })
                          }
                          placeholder="RG"
                        />
                      </div>
                      <div>
                        <Select
                          value={formData.sexo}
                          onValueChange={(value) =>
                            setFormData({ ...formData, sexo: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Endereço</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco: e.target.value })
                          }
                          placeholder="Endereço"
                        />
                      </div>
                      <div>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) =>
                            setFormData({ ...formData, bairro: e.target.value })
                          }
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) =>
                            setFormData({ ...formData, cidade: e.target.value })
                          }
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <Select
                          value={formData.estado}
                          onValueChange={(value) =>
                            setFormData({ ...formData, estado: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">AC</SelectItem>
<SelectItem value="AL">AL</SelectItem>
<SelectItem value="AP">AP</SelectItem>
<SelectItem value="AM">AM</SelectItem>
<SelectItem value="BA">BA</SelectItem>
<SelectItem value="CE">CE</SelectItem>
<SelectItem value="DF">DF</SelectItem>
<SelectItem value="ES">ES</SelectItem>
<SelectItem value="GO">GO</SelectItem>
<SelectItem value="MA">MA</SelectItem>
<SelectItem value="MT">MT</SelectItem>
<SelectItem value="MS">MS</SelectItem>
<SelectItem value="MG">MG</SelectItem>
<SelectItem value="PA">PA</SelectItem>
<SelectItem value="PB">PB</SelectItem>
<SelectItem value="PR">PR</SelectItem>
<SelectItem value="PE">PE</SelectItem>
<SelectItem value="PI">PI</SelectItem>
<SelectItem value="RJ">RJ</SelectItem>
<SelectItem value="RN">RN</SelectItem>
<SelectItem value="RS">RS</SelectItem>
<SelectItem value="RO">RO</SelectItem>
<SelectItem value="RR">RR</SelectItem>
<SelectItem value="SC">SC</SelectItem>
<SelectItem value="SP">SP</SelectItem>
<SelectItem value="SE">SE</SelectItem>
<SelectItem value="TO">TO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) =>
                            setFormData({ ...formData, cep: e.target.value })
                          }
                          placeholder="CEP"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Dados Profissionais
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div>
                        <Input
                          id="formacao"
                          value={formData.formacao}
                          onChange={(e) =>
                            setFormData({ ...formData, formacao: e.target.value })
                          }
                          placeholder="Formação"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="especializacao"
                          value={formData.especializacao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              especializacao: e.target.value,
                            })
                          }
                          placeholder="Especialização"
                        />
                      </div>
                      <div>
                        <Input
                          id="registro"
                          value={formData.registro}
                          onChange={(e) =>
                            setFormData({ ...formData, registro: e.target.value })
                          }
                          placeholder="Registro Profissional"
                        />
                      </div>
                      
                      <div>
                        <Select
                          value={formData.situacao}
                          onValueChange={(value) =>
                            setFormData({ ...formData, situacao: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Situação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                            <SelectItem value="Licença">Em Licença</SelectItem>
                            <SelectItem value="Afastado">Afastado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                        <Input
                          id="dataAdmissao"
                          type="date"
                          value={formData.dataAdmissao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dataAdmissao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disciplinas */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Disciplinas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {disciplinas.map((disciplina) => (
                        <div
                          key={disciplina.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`disciplina-${disciplina.id}`}
                            checked={formData.disciplinasIds.includes(
                              disciplina.id.toString()
                            )}
                            onCheckedChange={(checked) =>
                              handleDisciplinaChange(
                                disciplina.id.toString(),
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`disciplina-${disciplina.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {disciplina.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({ ...formData, observacoes: e.target.value })
                      }
                      placeholder="Observações gerais sobre o professor..."
                      rows={3}
                    />
                  </div>

                  {/* Criar Usuário */}
                  {!editingProfessor && (
                    <div>
                      <h4 className="text-lg font-medium mb-4">
                        Acesso ao Sistema
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="criarUsuario"
                            checked={formData.criarUsuario}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                criarUsuario: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="criarUsuario">
                            Criar usuário de acesso ao sistema
                          </Label>
                        </div>
                        {formData.criarUsuario && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <Input
                                value={formData.email}
                                disabled
                                placeholder="E-mail de Login"
                              />
                            </div>
                            <div>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="senhaUsuario"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.senhaUsuario}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        senhaUsuario: e.target.value,
                                      })
                                    }
                                    placeholder="Senha Inicial"
                                    className="pr-20"
                                    required
                                  />
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="none"
                                      className="h-6 w-6 p-0"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="none"
                                      className="h-6 w-6 p-0"
                                      onClick={copiarSenha}
                                      disabled={!formData.senhaUsuario}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={gerarSenha}
                                >
                                  Gerar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Foto do Perfil */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Foto do Perfil</h4>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {selectedImage ? (
                          <div className="relative">
                            <img
                              src={selectedImage}
                              alt="Foto do professor"
                              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={removeImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                            <Users className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Fazer upload de foto
                        </Button>
                        {selectedImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removeImage}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remover foto
                          </Button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProfessor
                      ? 'Salvar Alterações'
                      : 'Cadastrar Professor'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="card-content">
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar professores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <DialogHeader>
                <DialogTitle>Filtrar Professores</DialogTitle>
                <DialogDescription>
                  Use os filtros abaixo para refinar a lista de professores
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="filterDisciplina">Disciplina</Label>
                  <Select
                    value={filters.disciplinaId}
                    onValueChange={(value) =>
                      setFilters({ ...filters, disciplinaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {disciplinas.map((disciplina) => (
                        <SelectItem
                          key={disciplina.id}
                          value={disciplina.id.toString()}
                        >
                          {disciplina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filterSituacao">Situação</Label>
                  <Select
                    value={filters.situacao}
                    onValueChange={(value) =>
                      setFilters({ ...filters, situacao: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as situações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as situações</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Licença">Em Licença</SelectItem>
                      <SelectItem value="Afastado">Afastado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filterFormacao">Formação</Label>
                  <Select
                    value={filters.formacao}
                    onValueChange={(value) =>
                      setFilters({ ...filters, formacao: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as formações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as formações</SelectItem>
                      <SelectItem value="Licenciatura">
                        Licenciatura
                      </SelectItem>
                      <SelectItem value="Bacharelado">
                        Bacharelado
                      </SelectItem>
                      <SelectItem value="Especialização">
                        Especialização
                      </SelectItem>
                      <SelectItem value="Mestrado">Mestrado</SelectItem>
                      <SelectItem value="Doutorado">Doutorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filterUsuario">Acesso ao Sistema</Label>
                  <Select
                    value={filters.temUsuario}
                    onValueChange={(value) =>
                      setFilters({ ...filters, temUsuario: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sim">Com usuário</SelectItem>
                      <SelectItem value="nao">Sem usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Limpar Filtros
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
          {filteredProfessores.map((professor) => {
            const usuarioVinculado = getUsuarioVinculado(professor.id);
            const disciplinasNomes = getDisciplinasNomes(
              (professor as any).disciplinasIds
            );
            return (
              <div
                key={professor.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {(professor as any).foto ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={(professor as any).foto}
                          alt={professor.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 border-1 border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{professor.nome}</h3>
                      {usuarioVinculado && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Usuário Ativo
                        </span>
                      )}
                      {(professor as any).situacao &&
                        (professor as any).situacao !== 'Ativo' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            {(professor as any).situacao}
                          </span>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                      <span>Email: {professor.email}</span>
                      {(professor as any).contato && (
                        <span>Contato: {(professor as any).contato}</span>
                      )}
                      {(professor as any).formacao && (
                        <span>Formação: {(professor as any).formacao}</span>
                      )}
                    </div>

                    {disciplinasNomes && (
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Disciplinas:</span>{' '}
                        {disciplinasNomes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="none"
                  className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleEdit(professor)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="none"
                   className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    onClick={() => handleDelete(professor.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredProfessores.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum professor encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
