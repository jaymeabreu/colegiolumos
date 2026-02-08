import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Eye, EyeOff, Copy, Filter, FileText, Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { supabaseService } from '../../../services/supabaseService';
import type { Aluno, Usuario, Turma } from '../../../services/supabaseService';
import { BoletimModal } from '../../../components/shared/BoletimModal';

// Componente otimizado para avatar do aluno
const AlunoAvatar = ({ aluno }: { aluno: Aluno }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  if (imageError) {
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
        src="https://via.placeholder.com/150"
        alt={aluno.nome}
        className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};

export function AlunosList() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para o boletim - otimizado
  const [isBoletimModalOpen, setIsBoletimModalOpen] = useState(false);
  const [selectedAlunoBoletim, setSelectedAlunoBoletim] = useState<Aluno | null>(null);
  
  // Estados dos filtros - simplificados
  const [filters, setFilters] = useState({
    turmaId: '',
    turno: '',
    anoLetivo: '',
    situacao: '',
    temUsuario: ''
  });

  // Estados para upload de imagem
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para matrícula sugerida
  const [suggestedMatricula, setSuggestedMatricula] = useState<string>('');

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    contato: '',
    email: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    sexo: '',
    endereco: '',
    bairro: '',
    cidade: '',
    cep: '',
    estado: '',
    nomeResponsavel: '',
    contatoResponsavel: '',
    emailResponsavel: '',
    parentesco: '',
    turmaId: '',
    anoLetivo: '2025',
    situacao: 'Ativo',
    observacoes: '',
    criarUsuario: true,
    senhaUsuario: '',
    foto: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [alunosData, usuariosData, turmasData] = await Promise.all([
        supabaseService.getAlunos(),
        supabaseService.getUsuarios(),
        supabaseService.getTurmas()
      ]);
      setAlunos(alunosData);
      setUsuarios(usuariosData);
      setTurmas(turmasData);
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

  // Função para carregar a matrícula sugerida quando abre o modal
  const loadSuggestedMatricula = useCallback(async () => {
    try {
      const suggested = await supabaseService.getSuggestedMatricula();
      setSuggestedMatricula(suggested);
      // Pré-preenche no formulário
      setFormData(prev => ({ ...prev, matricula: suggested }));
    } catch (error) {
      console.error('Erro ao carregar matrícula sugerida:', error);
      setSuggestedMatricula('01');
      setFormData(prev => ({ ...prev, matricula: '01' }));
    }
  }, []);

  // Filtros otimizados com cache mais eficiente
  const filteredAlunos = useMemo(() => {
    if (!searchTerm && !Object.values(filters).some(v => v && v !== 'all')) {
      return alunos;
    }

    return alunos.filter(aluno => {
      if (searchTerm && !aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !aluno.matricula.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.turmaId && filters.turmaId !== 'all' && 
          aluno.turma_id?.toString() !== filters.turmaId) return false;
      
      if (filters.turno && filters.turno !== 'all') {
        const turmaAluno = turmas.find(t => t.id === aluno.turma_id);
        if (!turmaAluno || turmaAluno.turno !== filters.turno) return false;
      }

      if (filters.temUsuario && filters.temUsuario !== 'all') {
        const usuarioVinculado = usuarios.some(u => u.aluno_id === aluno.id);
        if (filters.temUsuario === 'sim' && !usuarioVinculado) return false;
        if (filters.temUsuario === 'nao' && usuarioVinculado) return false;
      }

      return true;
    });
  }, [alunos, searchTerm, filters, turmas, usuarios]);

  const clearFilters = useCallback(() => {
    setFilters({
      turmaId: '',
      turno: '',
      anoLetivo: '',
      situacao: '',
      temUsuario: ''
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '' && value !== 'all');
  }, [filters]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.matricula.trim()) {
      alert('Nome e matrícula são obrigatórios!');
      return;
    }

    if (formData.criarUsuario && !editingAluno && !formData.senhaUsuario) {
      alert('Senha é obrigatória para criar usuário!');
      return;
    }

    const alunoData: any = {
      nome: formData.nome.trim(),
      matricula: formData.matricula.trim(),
      email: formData.email.trim() || null,
      turma_id: formData.turmaId ? Number(formData.turmaId) : null,
      dataNascimento: formData.dataNascimento || null,
      cpf: formData.cpf || null,
      rg: formData.rg || null,
      sexo: formData.sexo || null,
      contato: formData.contato || null,
      observacoes: formData.observacoes || null,
      endereco: formData.endereco || null,
      bairro: formData.bairro || null,
      cidade: formData.cidade || null,
      estado: formData.estado || null,
      cep: formData.cep || null,
      nomeResponsavel: formData.nomeResponsavel || null,
      contatoResponsavel: formData.contatoResponsavel || null,
      emailResponsavel: formData.emailResponsavel || null,
      parentesco: formData.parentesco || null,
      anoLetivo: formData.anoLetivo || null,
      situacao: formData.situacao || null
    };
    
    console.log('📤 Enviando dados do aluno:', alunoData);

    try {
      setLoading(true);
      let aluno;
      if (editingAluno) {
        aluno = await supabaseService.updateAluno(editingAluno.id, alunoData);
      } else {
        aluno = await supabaseService.createAluno(alunoData);
      }

      if (formData.criarUsuario && aluno && formData.senhaUsuario && !editingAluno) {
        const usuarioData = {
          nome: formData.nome,
          email: formData.email || `aluno${aluno.id}@colegio.com`,
          papel: 'ALUNO' as const,
          aluno_id: aluno.id,
          ativo: true
        };
        
        await supabaseService.createUsuario(usuarioData, formData.senhaUsuario);
      }

      await loadData();
      
      setIsDialogOpen(false);
      resetForm();
      
      alert(editingAluno ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      alert('Erro ao salvar aluno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingAluno, selectedImage, loadData]);

  const handleEdit = useCallback((aluno: any) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome || '',
      matricula: aluno.matricula || '',
      contato: aluno.contato || aluno.telefone || '',
      email: aluno.email || '',
      dataNascimento: aluno.data_nascimento || '',
      cpf: aluno.cpf || '',
      rg: aluno.rg || '',
      sexo: aluno.sexo || '',
      endereco: aluno.endereco || '',
      bairro: aluno.bairro || '',
      cidade: aluno.cidade || '',
      cep: aluno.cep || '',
      estado: aluno.estado || '',
      nomeResponsavel: aluno.nome_responsavel || '',
      contatoResponsavel: aluno.telefone_responsavel || '',
      emailResponsavel: aluno.email_responsavel || '',
      parentesco: aluno.parentesco || '',
      turmaId: aluno.turma_id?.toString() || '',
      anoLetivo: '2025',
      situacao: 'Ativo',
      observacoes: aluno.observacoes || '',
      criarUsuario: false,
      senhaUsuario: '',
      foto: aluno.foto || ''
    });
    setSelectedImage(aluno.foto || null);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        setLoading(true);
        const usuarioVinculado = usuarios.find(u => u.aluno_id === id);
        if (usuarioVinculado) {
          await supabaseService.deleteUsuario(usuarioVinculado.id);
        }
        await supabaseService.deleteAluno(id);
        await loadData();
        alert('Aluno excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        alert('Erro ao excluir aluno. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }, [usuarios, loadData]);

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      matricula: '',
      contato: '',
      email: '',
      dataNascimento: '',
      cpf: '',
      rg: '',
      sexo: '',
      endereco: '',
      bairro: '',
      cidade: '',
      cep: '',
      estado: '',
      nomeResponsavel: '',
      contatoResponsavel: '',
      emailResponsavel: '',
      parentesco: '',
      turmaId: '',
      anoLetivo: '',
      situacao: '',
      observacoes: '',
      criarUsuario: true,
      senhaUsuario: '',
      foto: ''
    });
    setSelectedImage(null);
    setEditingAluno(null);
    setShowPassword(false);
    setSuggestedMatricula('');
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

  const getUsuarioVinculado = useCallback((alunoId: number) => {
    return usuarios.find(u => u.aluno_id === alunoId);
  }, [usuarios]);

  const getTurmaNome = useCallback((turmaId?: number) => {
    if (!turmaId) return '';
    return turmas.find(t => t.id === turmaId)?.nome || '';
  }, [turmas]);

  const handleViewBoletim = useCallback((aluno: Aluno) => {
    setSelectedAlunoBoletim(aluno);
    setIsBoletimModalOpen(true);
  }, []);

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
            <h3 className="card-title">Alunos</h3>
            <p className="card-description">Gerencie os alunos da escola</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open && !editingAluno) {
              // Quando abre modal para NOVO aluno, carrega matrícula sugerida
              loadSuggestedMatricula();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="btn btn-primary btn-md flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Aluno</span>
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
                  {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações completas do aluno
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  

                  {/* Foto do Perfil */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Foto do Perfil</h4>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                        {selectedImage ? (
                          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="h-16 w-16 text-gray-400" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Fazer upload de foto
                        </Button>
                        {selectedImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={removeImage}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Formatos aceitos: JPG, PNG, WEBP. Máximo 5MB.<br />
                        A imagem será automaticamente otimizada.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Dados Básicos */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Dados Básicos</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div>
                        <Label>Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome Completo"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Matrícula * {suggestedMatricula && !editingAluno && <span className="text-xs text-blue-600">(Sugerida: {suggestedMatricula})</span>}</Label>
                        <Input
                          id="matricula"
                          value={formData.matricula}
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          placeholder="Matrícula"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="E-mail"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Data de Nascimento</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.dataNascimento}
                          onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                          placeholder="Data de Nascimento"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>CPF</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="CPF"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>RG</Label>
                        <Input
                          id="rg"
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
                          id="contato"
                          value={formData.contato}
                          onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                          placeholder="Telefone"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Acadêmicos */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Dados Acadêmicos</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Turma</Label>
                        <Select value={formData.turmaId} onValueChange={(value) => setFormData({ ...formData, turmaId: value })} disabled={loading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((turma) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                {turma.nome} - {turma.turno}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ano Letivo</Label>
                        <Input
                          id="anoLetivo"
                          value={formData.anoLetivo}
                          onChange={(e) => setFormData({ ...formData, anoLetivo: e.target.value })}
                          placeholder="Ano Letivo"
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
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                            <SelectItem value="Transferido">Transferido</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        placeholder="Observações gerais sobre o aluno..."
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Endereço</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="lg:col-span-2">
                        <Label>Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Rua, número"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                          placeholder="Bairro"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          id="cidade"
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
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                          placeholder="CEP"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Responsável */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Dados do Responsável</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Responsável</Label>
                        <Input
                          id="nomeResponsavel"
                          value={formData.nomeResponsavel}
                          onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                          placeholder="Nome do Responsável"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Parentesco</Label>
                        <Select value={formData.parentesco} onValueChange={(value) => setFormData({ ...formData, parentesco: value })} disabled={loading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pai">Pai</SelectItem>
                            <SelectItem value="Mãe">Mãe</SelectItem>
                            <SelectItem value="Avó">Avó</SelectItem>
                            <SelectItem value="Avô">Avô</SelectItem>
                            <SelectItem value="Tio">Tio</SelectItem>
                            <SelectItem value="Tia">Tia</SelectItem>
                            <SelectItem value="Primo">Primo</SelectItem>
                            <SelectItem value="Prima">Prima</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Telefone do Responsável</Label>
                        <Input
                          id="contatoResponsavel"
                          value={formData.contatoResponsavel}
                          onChange={(e) => setFormData({ ...formData, contatoResponsavel: e.target.value })}
                          placeholder="Telefone do Responsável"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>E-mail do Responsável</Label>
                        <Input
                          id="emailResponsavel"
                          type="email"
                          value={formData.emailResponsavel}
                          onChange={(e) => setFormData({ ...formData, emailResponsavel: e.target.value })}
                          placeholder="E-mail do Responsável"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Criar Usuário */}
                  {!editingAluno && (
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
                                value={formData.email || `aluno@colegio.com`}
                                disabled
                                placeholder="Email de Login"
                              />
                            </div>
                            <div>
                              <Label>Senha Inicial</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="senhaUsuario"
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
                </div>
                <DialogFooter className="mt-6">
                  <Button 
  type="button" 
  variant="outline" 
  onClick={() => {
    resetForm();
    setIsDialogOpen(false);
  }} 
  disabled={loading}
>
  Cancelar
</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingAluno ? 'Salvar Alterações' : 'Cadastrar Aluno')}
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
              placeholder="Buscar alunos..."
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
                <DialogTitle>Filtrar Alunos</DialogTitle>
                <DialogDescription>
                  Use os filtros abaixo para refinar a lista de alunos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filterTurma">Turma</Label>
                  <select 
                    id="filterTurma"
                    value={filters.turmaId} 
                    onChange={(e) => setFilters({ ...filters, turmaId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Todas as turmas</option>
                    {turmas.map((turma) => (
                      <option key={turma.id} value={turma.id.toString()}>
                        {turma.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="filterTurno">Turno</Label>
                  <select 
                    id="filterTurno"
                    value={filters.turno} 
                    onChange={(e) => setFilters({ ...filters, turno: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Todos os turnos</option>
                    <option value="MANHA">Matutino</option>
                    <option value="TARDE">Vespertino</option>
                    <option value="NOITE">Noturno</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="filterSituacao">Situação</Label>
                  <select 
                    id="filterSituacao"
                    value={filters.situacao} 
                    onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Todas as situações</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Transferido">Transferido</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="filterUsuario">Acesso ao Sistema</Label>
                  <select 
                    id="filterUsuario"
                    value={filters.temUsuario} 
                    onChange={(e) => setFilters({ ...filters, temUsuario: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Todos</option>
                    <option value="sim">Com usuário</option>
                    <option value="nao">Sem usuário</option>
                  </select>
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
            {filteredAlunos.map((aluno) => {
              const usuarioVinculado = getUsuarioVinculado(aluno.id);
              const turmaNome = getTurmaNome(aluno.turma_id);
              return (
                <div key={aluno.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <AlunoAvatar aluno={aluno} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{aluno.nome}</h3>
                        {usuarioVinculado && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Usuário Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                        <span>Matrícula: {aluno.matricula}</span>
                        {aluno.email && <span>Email: {aluno.email}</span>}
                        {turmaNome && <span>Turma: {turmaNome}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleViewBoletim(aluno)}
                      title="Ver Boletim"
                      disabled={loading}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleEdit(aluno)}
                      title="Editar"
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="none"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                      onClick={() => handleDelete(aluno.id)}
                      title="Excluir"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredAlunos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Modal do Boletim */}
        {isBoletimModalOpen && selectedAlunoBoletim && (
          <BoletimModal 
            aluno={selectedAlunoBoletim} 
            onClose={() => setIsBoletimModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default AlunosList;
