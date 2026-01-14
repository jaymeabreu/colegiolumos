import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Eye, EyeOff, Copy, Filter, Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import type { Professor, Usuario } from '../../../services/supabaseService';

// Componente otimizado para avatar do professor
const ProfessorAvatar = ({ professor }: { professor: Professor }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  if (imageError || !professor.foto) {
    return (
      <div className="w-12 h-12 rounded-full bg-gray-100 border-1 border-gray-200 flex items-center justify-center flex-shrink-0">
        <Users className="h-6 w-6 text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 relative">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
      )}
      <img
        src={professor.foto || 'https://via.placeholder.com/150'}
        alt={professor.nome}
        className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};

type FormState = {
  nome: string;
  email: string;
  contato: string;
  data_nascimento: string;
  cpf: string;
  rg: string;
  sexo: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  estado: string;
  formacao: string;
  especializacao: string;
  registro: string;
  data_admissao: string;
  situacao: string;
  observacoes: string;
  criarUsuario: boolean;
  senhaUsuario: string;
  foto: string;
};

const emptyForm: FormState = {
  nome: '',
  email: '',
  contato: '',
  data_nascimento: '',
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
  data_admissao: '',
  situacao: '',
  observacoes: '',
  criarUsuario: true,
  senhaUsuario: '',
  foto: '',
};

export function ProfessoresList() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [filters, setFilters] = useState({
    situacao: '',
    temUsuario: ''
  });

  const [formData, setFormData] = useState<FormState>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [professoresData, usuariosData] = await Promise.all([
        supabaseService.getProfessores(),
        supabaseService.getUsuarios()
      ]);
      setProfessores(professoresData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProfessores = useMemo(() => {
    if (!searchTerm && !Object.values(filters).some(v => v && v !== 'all')) {
      return professores;
    }

    return professores.filter(prof => {
      if (searchTerm && !prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !prof.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.situacao && filters.situacao !== 'all' && prof.situacao !== filters.situacao) {
        return false;
      }

      if (filters.temUsuario && filters.temUsuario !== 'all') {
        const usuarioVinculado = usuarios.some(u => u.professor_id === prof.id);
        if (filters.temUsuario === 'sim' && !usuarioVinculado) return false;
        if (filters.temUsuario === 'nao' && usuarioVinculado) return false;
      }

      return true;
    });
  }, [professores, searchTerm, filters, usuarios]);

  const clearFilters = useCallback(() => {
    setFilters({
      situacao: '',
      temUsuario: ''
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '' && value !== 'all');
  }, [filters]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Nome e e-mail são obrigatórios!');
      return;
    }

    if (formData.criarUsuario && !editingProfessor && !formData.senhaUsuario) {
      alert('Senha é obrigatória para criar usuário!');
      return;
    }

    const professorData: any = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      contato: formData.contato.trim() || null,
      data_nascimento: formData.data_nascimento || null,
      cpf: formData.cpf.trim() || null,
      rg: formData.rg.trim() || null,
      sexo: formData.sexo || null,
      endereco: formData.endereco.trim() || null,
      bairro: formData.bairro.trim() || null,
      cidade: formData.cidade.trim() || null,
      cep: formData.cep.trim() || null,
      estado: formData.estado || null,
      formacao: formData.formacao.trim() || null,
      especializacao: formData.especializacao.trim() || null,
      registro: formData.registro.trim() || null,
      data_admissao: formData.data_admissao || null,
      situacao: formData.situacao || null,
      observacoes: formData.observacoes.trim() || null,
      foto: selectedImage || null,
    };

    try {
      setLoading(true);
      let professor;
      
      if (editingProfessor) {
        professor = await supabaseService.updateProfessor(editingProfessor.id, professorData);
      } else {
        professor = await supabaseService.createProfessor(professorData);
      }

      if (formData.criarUsuario && professor && formData.senhaUsuario && !editingProfessor) {
        const usuarioData = {
          nome: formData.nome,
          email: formData.email,
          papel: 'PROFESSOR' as const,
          professor_id: professor.id,
          ativo: true
        };
        
        await supabaseService.createUsuario(usuarioData);
      }

      await loadData();
      resetForm();
      alert(editingProfessor ? 'Professor atualizado com sucesso!' : 'Professor cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar professor:', error);
      alert('Erro ao salvar professor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingProfessor, selectedImage, loadData]);

  const handleEdit = useCallback((professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nome: professor.nome || '',
      email: professor.email || '',
      contato: professor.contato || '',
      data_nascimento: professor.data_nascimento || '',
      cpf: professor.cpf || '',
      rg: professor.rg || '',
      sexo: professor.sexo || '',
      endereco: professor.endereco || '',
      bairro: professor.bairro || '',
      cidade: professor.cidade || '',
      cep: professor.cep || '',
      estado: professor.estado || '',
      formacao: professor.formacao || '',
      especializacao: professor.especializacao || '',
      registro: professor.registro || '',
      data_admissao: professor.data_admissao || '',
      situacao: professor.situacao || '',
      observacoes: professor.observacoes || '',
      criarUsuario: false,
      senhaUsuario: '',
      foto: professor.foto || '',
    });
    setSelectedImage(professor.foto || null);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este professor?')) {
      try {
        setLoading(true);
        const usuarioVinculado = usuarios.find(u => u.professor_id === id);
        if (usuarioVinculado) {
          await supabaseService.deleteUsuario(usuarioVinculado.id);
        }
        await supabaseService.deleteProfessor(id);
        await loadData();
        alert('Professor excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir professor:', error);
        alert('Erro ao excluir professor. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }, [usuarios, loadData]);

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setSelectedImage(null);
    setEditingProfessor(null);
    setIsDialogOpen(false);
    setShowPassword(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const gerarSenha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, senhaUsuario: senha }));
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

  const getUsuarioVinculado = useCallback((professorId: number) => {
    return usuarios.find(u => u.professor_id === professorId);
  }, [usuarios]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo permitido: 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Formato não suportado. Use JPG, PNG ou WEBP');
        return;
      }

      compressImage(file, 150, 0.8).then(compressedImage => {
        setSelectedImage(compressedImage);
        setFormData(prev => ({ ...prev, foto: compressedImage }));
      }).catch(error => {
        console.error('Erro ao processar imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
      });
    }
  }, []);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, foto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const compressImage = useCallback((file: File, maxWidth: number = 150, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h3 className="card-title">Professores</h3>
            <p className="card-description">Gerencie os professores da escola</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="btn btn-primary btn-md flex items-center gap-2">
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
                        <Label>Nome Completo *</Label>
                        <Input
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome Completo"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>E-mail *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="E-mail"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Data de Nascimento</Label>
                        <Input
                          type="date"
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>CPF</Label>
                        <Input
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="CPF"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>RG</Label>
                        <Input
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          placeholder="RG"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Sexo</Label>
                        <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })} disabled={loading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={formData.contato}
                          onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                          placeholder="Telefone"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Endereço</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <Label>Endereço</Label>
                        <Input
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Endereço"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                          placeholder="Bairro"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                          placeholder="Cidade"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })} disabled={loading}>
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
                        <Label>CEP</Label>
                        <Input
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                          placeholder="CEP"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Dados Profissionais</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label>Formação</Label>
                        <Input
                          value={formData.formacao}
                          onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                          placeholder="Ex: Licenciatura em Matemática"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Especialização</Label>
                        <Input
                          value={formData.especializacao}
                          onChange={(e) => setFormData({ ...formData, especializacao: e.target.value })}
                          placeholder="Ex: Mestrado em Educação"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Registro Profissional</Label>
                        <Input
                          value={formData.registro}
                          onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
                          placeholder="Ex: CREF, CRP, etc"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Data de Admissão</Label>
                        <Input
                          type="date"
                          value={formData.data_admissao}
                          onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Situação</Label>
                        <Select value={formData.situacao} onValueChange={(value) => setFormData({ ...formData, situacao: value })} disabled={loading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Situação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATIVO">Ativo</SelectItem>
                            <SelectItem value="INATIVO">Inativo</SelectItem>
                            <SelectItem value="AFASTADO">Afastado</SelectItem>
                            <SelectItem value="LICENCA">Licença</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        placeholder="Observações gerais sobre o professor..."
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Criar Usuário */}
                  {!editingProfessor && (
                    <div>
                      <h4 className="text-lg font-medium mb-4">Acesso ao Sistema</h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="criarUsuario"
                            checked={formData.criarUsuario}
                            onChange={(e) => setFormData({ ...formData, criarUsuario: e.target.checked })}
                            className="rounded border-gray-300"
                            disabled={loading}
                          />
                          <Label htmlFor="criarUsuario">Criar usuário de acesso ao sistema</Label>
                        </div>
                        {formData.criarUsuario && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <Label>Email de Login</Label>
                              <Input
                                value={formData.email}
                                disabled
                                placeholder="Email de Login"
                              />
                            </div>
                            <div>
                              <Label>Senha Inicial</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.senhaUsuario}
                                    onChange={(e) => setFormData({ ...formData, senhaUsuario: e.target.value })}
                                    placeholder="Senha inicial"
                                    className="pr-20"
                                    required
                                    disabled={loading}
                                  />
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="none"
                                      className="h-6 w-6 p-0"
                                      onClick={() => setShowPassword(!showPassword)}
                                      disabled={loading}
                                    >
                                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="none"
                                      className="h-6 w-6 p-0"
                                      onClick={copiarSenha}
                                      disabled={!formData.senhaUsuario || loading}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Button type="button" variant="outline" onClick={gerarSenha} disabled={loading}>
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
                              disabled={loading}
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
                          disabled={loading}
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
                            disabled={loading}
                          >
                            Remover foto
                          </Button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Formatos aceitos: JPG, PNG, WEBP. Máximo 5MB.<br/>
                        A imagem será automaticamente otimizada.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingProfessor ? 'Salvar Alterações' : 'Cadastrar Professor')}
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
              disabled={loading}
            />
          </div>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className={`flex items-center gap-2 whitespace-nowrap ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Object.values(filters).filter(v => v !== '' && v !== 'all').length}
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
                  <Label>Situação</Label>
                  <Select value={filters.situacao} onValueChange={(value) => setFilters({ ...filters, situacao: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as situações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as situações</SelectItem>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                      <SelectItem value="AFASTADO">Afastado</SelectItem>
                      <SelectItem value="LICENCA">Licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Acesso ao Sistema</Label>
                  <Select value={filters.temUsuario} onValueChange={(value) => setFilters({ ...filters, temUsuario: value })}>
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
                <Button type="button" onClick={() => setIsFilterOpen(false)}>
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">
            <p>Carregando...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {filteredProfessores.map((professor) => {
              const usuarioVinculado = getUsuarioVinculado(professor.id);
              return (
                <div key={professor.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <ProfessorAvatar professor={professor} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{professor.nome}</h3>
                        {usuarioVinculado && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Usuário Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                        <span>Email: {professor.email}</span>
                        {professor.contato && <span>Telefone: {professor.contato}</span>}
                        {professor.formacao && <span>Formação: {professor.formacao}</span>}
                        {professor.situacao && <span>Situação: {professor.situacao}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleEdit(professor)}
                      title="Editar"
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleDelete(professor.id)}
                      title="Excluir"
                      disabled={loading}
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
        )}
      </div>
    </div>
  );
}

export default ProfessoresList;
