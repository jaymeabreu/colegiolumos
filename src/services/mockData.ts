
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  alunoId?: number;
  professorId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Turma {
  id: number;
  nome: string;
  anoLetivo: string;
  turno: string;
  createdAt: string;
  updatedAt: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  cargaHoraria: number;
  createdAt: string;
  updatedAt: string;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  contato?: string;
  dataNascimento?: string;
  cpf?: string;
  rg?: string;
  sexo?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  formacao?: string;
  especializacao?: string;
  registro?: string;
  dataAdmissao?: string;
  situacao?: string;
  observacoes?: string;
  disciplinasIds?: number[];
  foto?: string; // Campo para armazenar a foto do professor
  createdAt: string;
  updatedAt: string;
}

export interface Diario {
  id: number;
  nome: string;
  disciplinaId: number;
  turmaId: number;
  professorId: number;
  bimestre: number;
  dataInicio: string;
  dataTermino: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO';
  solicitacaoDevolucao?: {
    comentario: string;
    dataSolicitacao: string;
  };
  historicoStatus?: {
    status: string;
    data: string;
    usuario: string;
    observacao?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  contato: string;
  email?: string;
  dataNascimento?: string;
  cpf?: string;
  rg?: string;
  sexo?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  nomeResponsavel?: string;
  contatoResponsavel?: string;
  emailResponsavel?: string;
  parentesco?: string;
  turmaId?: number;
  anoLetivo?: string;
  situacao?: string;
  observacoes?: string;
  foto?: string; // Campo para armazenar a foto do aluno
  createdAt: string;
  updatedAt: string;
}

export interface DiarioAluno {
  id: number;
  diarioId: number;
  alunoId: number;
}

export interface Aula {
  id: number;
  diarioId: number;
  data: string;
  conteudo: string;
  materiais?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Presenca {
  id: number;
  aulaId: number;
  alunoId: number;
  status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  observacao?: string;
}

export interface Avaliacao {
  id: number;
  diarioId: number;
  titulo: string;
  data: string;
  tipo: string;
  peso: number;
  createdAt: string;
  updatedAt: string;
}

export interface Nota {
  id: number;
  avaliacaoId: number;
  alunoId: number;
  valor: number;
}

export interface Ocorrencia {
  id: number;
  diarioId: number;
  alumnoId: number;
  data: string;
  tipo: string;
  descricao: string;
  acaoTomada: string;
  createdAt: string;
  updatedAt: string;
}

// New interfaces for Comunicados and Recados
export interface Comunicado {
  id: number;
  titulo: string;
  mensagem: string;
  autor: string;
  autorId: number;
  dataPublicacao: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recado {
  id: number;
  titulo: string;
  mensagem: string;
  professorId: number;
  professorNome: string;
  turmaId: number;
  turmaNome: string;
  alunoId?: number; // Opcional - se for recado individual
  alunoNome?: string;
  dataEnvio: string;
  createdAt: string;
  updatedAt: string;
}

class MockDataService {
  private storageKey = 'gestao_escolar_data';
  private senhasStorageKey = 'gestao_escolar_senhas';
  private static initialized = false; // Flag estática para evitar re-seed

  private defaultData = {
  usuarios: [
    {
      id: 1,
      nome: 'Coordenador Sistema',
      email: 'coordenador@demo.com',
      papel: 'COORDENADOR' as const,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      nome: 'Professor História',
      email: 'prof@demo.com',
      papel: 'PROFESSOR' as const,
      professorId: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 3,
      nome: 'Ana Clara Santos',
      email: 'aluno@demo.com',
      papel: 'ALUNO' as const,
      alunoId: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ] as Usuario[],
  turmas: [] as Turma[],
  disciplinas: [] as Disciplina[],
  professores: [] as Professor[],
  diarios: [] as Diario[],
  alunos: [] as Aluno[],
  diarioAlunos: [] as DiarioAluno[],
  aulas: [] as Aula[],
  presencas: [] as Presenca[],
  avaliacoes: [] as Avaliacao[],
  notas: [] as Nota[],
  ocorrencias: [] as Ocorrencia[],
  comunicados: [] as Comunicado[],
  recados: [] as Recado[]
};


  constructor() {
    // Limpar dados antigos na inicialização
    this.clearOldData();
  }

  // Método para limpar dados antigos e garantir estado limpo
  private clearOldData() {
  try {
    console.log('Verificando dados antigos...');

    const data = this.getData();
    console.log('Quantidade de recados na inicialização:', data.recados?.length || 0);

    // ⚠️ NÃO apagar mais os recados aqui.
    // Se algum dia precisar de uma migração, pode colocar uma flag em localStorage
    // e rodar isso apenas uma vez.

    // Se quiser, pode só limpar caches antigos:
    localStorage.removeItem(this.storageKey + '_recados_cache');
    // localStorage.removeItem(this.storageKey + '_timestamp'); // opcional

    console.log('Inicialização concluída sem apagar recados');
  } catch (error) {
    console.error('Erro ao limpar dados antigos:', error);
  }
}



  private getData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validação básica da estrutura
        if (parsed && typeof parsed === 'object') {
          const validData = {
            usuarios: Array.isArray(parsed.usuarios) ? parsed.usuarios : this.defaultData.usuarios,
            turmas: Array.isArray(parsed.turmas) ? parsed.turmas : this.defaultData.turmas,
            disciplinas: Array.isArray(parsed.disciplinas) ? parsed.disciplinas : this.defaultData.disciplinas,
            professores: Array.isArray(parsed.professores) ? parsed.professores : this.defaultData.professores,
            diarios: Array.isArray(parsed.diarios) ? parsed.diarios : this.defaultData.diarios,
            alunos: Array.isArray(parsed.alunos) ? parsed.alunos : this.defaultData.alunos,
            diarioAlunos: Array.isArray(parsed.diarioAlunos) ? parsed.diarioAlunos : this.defaultData.diarioAlunos,
            aulas: Array.isArray(parsed.aulas) ? parsed.aulas : this.defaultData.aulas,
            presencas: Array.isArray(parsed.presencas) ? parsed.presencas : this.defaultData.presencas,
            avaliacoes: Array.isArray(parsed.avaliacoes) ? parsed.avaliacoes : this.defaultData.avaliacoes,
            notas: Array.isArray(parsed.notas) ? parsed.notas : this.defaultData.notas,
            ocorrencias: Array.isArray(parsed.ocorrencias) ? parsed.ocorrencias : this.defaultData.ocorrencias,
            comunicados: Array.isArray(parsed.comunicados) ? parsed.comunicados : this.defaultData.comunicados,
            recados: Array.isArray(parsed.recados) ? parsed.recados : []
          };
          
          console.log('Dados carregados do localStorage:', {
            usuarios: validData.usuarios.length,
            alunos: validData.alunos.length,
            professores: validData.professores.length,
            turmas: validData.turmas.length,
            diarios: validData.diarios.length,
            diarioAlunos: validData.diarioAlunos.length,
            comunicados: validData.comunicados.length,
            recados: validData.recados.length
          });
          
          return validData;
        }
      }
    } catch (error) {
      console.error('Erro ao ler dados do localStorage:', error);
      localStorage.removeItem(this.storageKey);
    }
    
    // Se não há dados salvos, inicializar com dados padrão
    console.log('Inicializando com dados padrão');
    if (!MockDataService.initialized) {
      this.saveData(this.defaultData);
      MockDataService.initialized = true;
    }
    return this.defaultData;
  }

  private saveData(data: any) {
    try {
      // Garantir que todos os arrays existam
      const dataToSave = {
        usuarios: Array.isArray(data.usuarios) ? data.usuarios : [],
        turmas: Array.isArray(data.turmas) ? data.turmas : [],
        disciplinas: Array.isArray(data.disciplinas) ? data.disciplinas : [],
        professores: Array.isArray(data.professores) ? data.professores : [],
        diarios: Array.isArray(data.diarios) ? data.diarios : [],
        alunos: Array.isArray(data.alunos) ? data.alunos : [],
        diarioAlunos: Array.isArray(data.diarioAlunos) ? data.diarioAlunos : [],
        aulas: Array.isArray(data.aulas) ? data.aulas : [],
        presencas: Array.isArray(data.presencas) ? data.presencas : [],
        avaliacoes: Array.isArray(data.avaliacoes) ? data.avaliacoes : [],
        notas: Array.isArray(data.notas) ? data.notas : [],
        ocorrencias: Array.isArray(data.ocorrencias) ? data.ocorrencias : [],
        comunicados: Array.isArray(data.comunicados) ? data.comunicados : [],
        recados: Array.isArray(data.recados) ? data.recados : []
      };
      
      // Salvar no localStorage
      const jsonString = JSON.stringify(dataToSave);
      localStorage.setItem(this.storageKey, jsonString);
      
      // Força a sincronização
      localStorage.setItem(this.storageKey + '_timestamp', Date.now().toString());
      
      // Disparar evento customizado para notificar outras abas/componentes
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { 
          type: 'all',
          timestamp: Date.now()
        }
      }));
      
      console.log('Dados salvos com sucesso no localStorage:', {
        usuarios: dataToSave.usuarios.length,
        alunos: dataToSave.alunos.length,
        professores: dataToSave.professores.length,
        turmas: dataToSave.turmas.length,
        diarios: dataToSave.diarios.length,
        comunicados: dataToSave.comunicados.length,
        recados: dataToSave.recados.length
      });
      
      // Verificar se os dados foram realmente salvos
      const verification = localStorage.getItem(this.storageKey);
      if (verification) {
        const verificationData = JSON.parse(verification);
        console.log('Verificação de salvamento - recados:', verificationData.recados?.length || 0);
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    }
  }

  private initializeData() {
    try {
      const existing = localStorage.getItem(this.storageKey);
      if (!existing) {
        this.saveData(this.defaultData);
      }
    } catch (error) {
      console.error('Erro ao inicializar dados:', error);
    }
  }

  private getNextId(collection: any[]): number {
    if (!Array.isArray(collection) || collection.length === 0) {
      return 1;
    }
    return Math.max(...collection.map(item => item?.id || 0), 0) + 1;
  }

  // Métodos de gerenciamento de senhas
  private getSenhas() {
    try {
      const stored = localStorage.getItem(this.senhasStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao ler senhas do localStorage:', error);
    }
    return {};
  }

  private saveSenhas(senhas: any) {
    try {
      localStorage.setItem(this.senhasStorageKey, JSON.stringify(senhas));
    } catch (error) {
      console.error('Erro ao salvar senhas no localStorage:', error);
    }
  }

  // Novo método: remover todos os vínculos de um diário
  private removerTodosVinculosDoDiario(diarioId: number): void {
    const data = this.getData();
    data.diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.diarioId !== diarioId);
    this.saveData(data);
  }

  // Novo método: remover vínculos de um aluno a uma turma específica
  private removerVinculosAlunoTurma(alunoId: number, turmaId: number): void {
    const data = this.getData();
    const diariosDaTurma = data.diarios.filter((d: Diario) => d.turmaId === turmaId);
    diariosDaTurma.forEach((diario: Diario) => {
      data.diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => 
        !(da.diarioId === diario.id && da.alunoId === alunoId)
      );
    });
    this.saveData(data);
  }

  // Métodos para controle de status do diário
  entregarDiario(diarioId: number, usuarioId: number): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);
    
    if (!diario || !usuario) return false;
    if (diario.status !== 'PENDENTE' && diario.status !== 'DEVOLVIDO') return false;
    
    diario.status = 'ENTREGUE';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined; // Limpar solicitação anterior
    
    // Adicionar ao histórico
    if (!diario.historicoStatus) diario.historicoStatus = [];
    diario.historicoStatus.push({
      status: 'ENTREGUE',
      data: new Date().toISOString(),
      usuario: usuario.nome,
      observacao: 'Diário entregue pelo professor'
    });
    
    this.saveData(data);
    return true;
  }

  devolverDiario(diarioId: number, usuarioId: number, observacao?: string): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);
    
    if (!diario || !usuario) return false;
    if (diario.status !== 'ENTREGUE') return false;
    if (usuario.papel !== 'COORDENADOR') return false;
    
    diario.status = 'DEVOLVIDO';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined; // Limpar solicitação
    
    // Adicionar ao histórico
    if (!diario.historicoStatus) diario.historicoStatus = [];
    diario.historicoStatus.push({
      status: 'DEVOLVIDO',
      data: new Date().toISOString(),
      usuario: usuario.nome,
      observacao: observacao || 'Diário devolvido para ajustes'
    });
    
    this.saveData(data);
    return true;
  }

  finalizarDiario(diarioId: number, usuarioId: number): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);
    
    if (!diario || !usuario) return false;
    if (diario.status !== 'ENTREGUE') return false;
    if (usuario.papel !== 'COORDENADOR') return false;
    
    diario.status = 'FINALIZADO';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined; // Limpar solicitação
    
    // Adicionar ao histórico
    if (!diario.historicoStatus) diario.historicoStatus = [];
    diario.historicoStatus.push({
      status: 'FINALIZADO',
      data: new Date().toISOString(),
      usuario: usuario.nome,
      observacao: 'Diário finalizado pelo coordenador'
    });
    
    this.saveData(data);
    return true;
  }

  solicitarDevolucaoDiario(diarioId: number, usuarioId: number, comentario: string): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);
    
    if (!diario || !usuario) return false;
    if (diario.status !== 'ENTREGUE') return false;
    if (usuario.papel !== 'PROFESSOR') return false;
    
    diario.solicitacaoDevolucao = {
      comentario,
      dataSolicitacao: new Date().toISOString()
    };
    diario.updatedAt = new Date().toISOString();
    
    this.saveData(data);
    return true;
  }

  // Verificar se professor pode editar diário
  professorPodeEditarDiario(diarioId: number, professorId: number): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    
    if (!diario) return false;
    if (diario.professorId !== professorId) return false;
    
    return diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO';
  }

  // Verificar se coordenador pode gerenciar diário
  coordenadorPodeGerenciarDiario(diarioId: number): { podeDevolver: boolean; podeFinalizar: boolean } {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    
    if (!diario) return { podeDevolver: false, podeFinalizar: false };
    
    return {
      podeDevolver: diario.status === 'ENTREGUE',
      podeFinalizar: diario.status === 'ENTREGUE'
    };
  }

  // Métodos de gerenciamento de usuários
  getUsuarios(): Usuario[] {
    return this.getData().usuarios;
  }

  createUsuario(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>, senha?: string): Usuario {
    const data = this.getData();
    const newUsuario: Usuario = {
      ...usuario,
      id: this.getNextId(data.usuarios),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.usuarios.push(newUsuario);
    this.saveData(data);

    // Salvar senha se fornecida
    if (senha) {
      const senhas = this.getSenhas();
      senhas[newUsuario.id] = senha;
      this.saveSenhas(senhas);
    }

    return newUsuario;
  }

  updateUsuario(id: number, updates: Partial<Usuario>, novaSenha?: string): Usuario | null {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index === -1) return null;
    
    data.usuarios[index] = { ...data.usuarios[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);

    // Atualizar senha se fornecida
    if (novaSenha) {
      const senhas = this.getSenhas();
      senhas[id] = novaSenha;
      this.saveSenhas(senhas);
    }

    return data.usuarios[index];
  }

  deleteUsuario(id: number): boolean {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index === -1) return false;
    
    data.usuarios.splice(index, 1);
    this.saveData(data);

    // Remover senha também
    const senhas = this.getSenhas();
    delete senhas[id];
    this.saveSenhas(senhas);

    return true;
  }

  // Método para verificar se usuário tem senha definida
  usuarioTemSenha(id: number): boolean {
    const senhas = this.getSenhas();
    return !!senhas[id];
  }

  // Método para obter senha (apenas para debug - não usar em produção)
  getSenhaUsuario(id: number): string | null {
    const senhas = this.getSenhas();
    return senhas[id] || null;
  }

  // Turmas
  getTurmas(): Turma[] {
    return this.getData().turmas;
  }

  getTurmaById(id: number): Turma | null {
    const data = this.getData();
    return data.turmas.find((t: Turma) => t.id === id) || null;
  }

  createTurma(turma: Omit<Turma, 'id' | 'createdAt' | 'updatedAt'>): Turma {
    const data = this.getData();
    const newTurma: Turma = {
      ...turma,
      id: this.getNextId(data.turmas),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.turmas.push(newTurma);
    this.saveData(data);
    return newTurma;
  }

  updateTurma(id: number, updates: Partial<Turma>): Turma | null {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index === -1) return null;
    
    data.turmas[index] = { ...data.turmas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.turmas[index];
  }

  deleteTurma(id: number): boolean {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index === -1) return false;
    
    data.turmas.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Disciplinas
  getDisciplinas(): Disciplina[] {
    return this.getData().disciplinas;
  }

  getDisciplinaById(id: number): Disciplina | null {
    const data = this.getData();
    return data.disciplinas.find((d: Disciplina) => d.id === id) || null;
  }

  createDisciplina(disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'updatedAt'>): Disciplina {
    const data = this.getData();
    const newDisciplina: Disciplina = {
      ...disciplina,
      id: this.getNextId(data.disciplinas),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.disciplinas.push(newDisciplina);
    this.saveData(data);
    return newDisciplina;
  }

  updateDisciplina(id: number, updates: Partial<Disciplina>): Disciplina | null {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index === -1) return null;
    
    data.disciplinas[index] = { ...data.disciplinas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.disciplinas[index];
  }

  deleteDisciplina(id: number): boolean {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index === -1) return false;
    
    data.disciplinas.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Diários
  getDiarios(): Diario[] {
    return this.getData().diarios;
  }

  getDiariosByProfessor(professorId: number): Diario[] {
    return this.getData().diarios.filter((d: Diario) => d.professorId === professorId);
  }

  createDiario(diario: Omit<Diario, 'id' | 'createdAt' | 'updatedAt'>): Diario {
    const data = this.getData();
    const newDiario: Diario = {
      ...diario,
      id: this.getNextId(data.diarios),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.diarios.push(newDiario);
    this.saveData(data);

    // Vincular automaticamente todos os alunos da turma ao diário
    this.vincularAlunosDaTurmaAoDiario(newDiario.turmaId, newDiario.id);

    return newDiario;
  }

  updateDiario(id: number, updates: Partial<Diario>): Diario | null {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index === -1) return null;
    
    const oldDiario = data.diarios[index];
    data.diarios[index] = { ...data.diarios[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);

    // Se a turma mudou, atualizar vínculos
    if (updates.turmaId && updates.turmaId !== oldDiario.turmaId) {
      // Remover vínculos antigos
      this.removerTodosVinculosDoDiario(id);
      // Adicionar novos vínculos
      this.vincularAlunosDaTurmaAoDiario(updates.turmaId, id);
    }

    return data.diarios[index];
  }

  deleteDiario(id: number): boolean {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index === -1) return false;
    
    // Remover todos os vínculos do diário
    this.removerTodosVinculosDoDiario(id);
    
    data.diarios.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Alunos
  getAlunos(): Aluno[] {
    return this.getData().alunos;
  }

  getAlunosByDiario(diarioId: number): Aluno[] {
    const data = this.getData();
    const diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.diarioId === diarioId);
    return data.alunos.filter((a: Aluno) => diarioAlunos.some((da: DiarioAluno) => da.alunoId === a.id));
  }

  getAlunosByTurma(turmaId: number): Aluno[] {
    return this.getData().alunos.filter((a: Aluno) => a.turmaId === turmaId);
  }

  createAluno(aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>): Aluno {
    const data = this.getData();
    const newAluno: Aluno = {
      ...aluno,
      id: this.getNextId(data.alunos),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Criando aluno:', newAluno);
    
    data.alunos.push(newAluno);
    this.saveData(data);

    // Se o aluno tem turma, vincular automaticamente aos diários da turma
    if (newAluno.turmaId) {
      console.log('Vinculando aluno à turma:', newAluno.turmaId);
      this.vincularAlunoAosDiariosDaTurma(newAluno.id, newAluno.turmaId);
    }

    return newAluno;
  }

  updateAluno(id: number, updates: Partial<Aluno>): Aluno | null {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index === -1) {
      console.error('Aluno não encontrado:', id);
      return null;
    }
    
    const oldAluno = data.alunos[index];
    const updatedAluno = { 
      ...data.alunos[index], 
      ...updates, 
      updatedAt: new Date().toISOString(),
      foto: updates.foto !== undefined ? updates.foto : data.alunos[index].foto // Preservar foto se não for fornecida
    };
    data.alunos[index] = updatedAluno;
    
    console.log('Atualizando aluno:', { id, oldAluno, updatedAluno });
    
    this.saveData(data);

    // Se a turma mudou, atualizar vínculos
    if (updates.turmaId !== undefined && updates.turmaId !== oldAluno.turmaId) {
      console.log('Turma alterada, atualizando vínculos:', { 
        antiga: oldAluno.turmaId, 
        nova: updates.turmaId 
      });
      
      // Remover vínculos antigos
      if (oldAluno.turmaId) {
        this.removerVinculosAlunoTurma(id, oldAluno.turmaId);
      }
      // Adicionar novos vínculos
      if (updates.turmaId) {
        this.vincularAlunoAosDiariosDaTurma(id, updates.turmaId);
      }
    }

    return updatedAluno;
  }

  deleteAluno(id: number): boolean {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index === -1) return false;
    
    // Remover todos os vínculos do aluno
    data.diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.alunoId !== id);
    
    data.alunos.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Métodos auxiliares para vínculos automáticos
  private vincularAlunosDaTurmaAoDiario(turmaId: number, diarioId: number): void {
    const data = this.getData();
    const alunosDaTurma = data.alunos.filter((a: Aluno) => a.turmaId === turmaId);
    
    console.log('Vinculando alunos da turma ao diário:', { 
      turmaId, 
      diarioId, 
      alunos: alunosDaTurma.length 
    });
    
    alunosDaTurma.forEach((aluno: Aluno) => {
      // Verificar se já existe vínculo
      const vinculoExiste = data.diarioAlunos.some((da: DiarioAluno) => 
        da.diarioId === diarioId && da.alunoId === aluno.id
      );
      
      if (!vinculoExiste) {
        const newVinculo: DiarioAluno = {
          id: this.getNextId(data.diarioAlunos),
          diarioId,
          alunoId: aluno.id
        };
        data.diarioAlunos.push(newVinculo);
        console.log('Vínculo criado:', newVinculo);
      } else {
        console.log('Vínculo já existe:', { diarioId, alunoId: aluno.id });
      }
    });
    
    this.saveData(data);
  }

  private vincularAlunoAosDiariosDaTurma(alunoId: number, turmaId: number): void {
    const data = this.getData();
    const diariosDaTurma = data.diarios.filter((d: Diario) => d.turmaId === turmaId);
    
    console.log('Vinculando aluno aos diários da turma:', { 
      alunoId, 
      turmaId, 
      diarios: diariosDaTurma.length 
    });
    
    diariosDaTurma.forEach((diario: Diario) => {
      // Verificar se já existe vínculo
      const vinculoExiste = data.diarioAlunos.some((da: DiarioAluno) => 
        da.diarioId === diario.id && da.alunoId === alunoId
      );
      
      if (!vinculoExiste) {
        const newVinculo: DiarioAluno = {
          id: this.getNextId(data.diarioAlunos),
          diarioId: diario.id,
          alunoId
        };
        data.diarioAlunos.push(newVinculo);
        console.log('Vínculo criado:', newVinculo);
      } else {
        console.log('Vínculo já existe:', { diarioId: diario.id, alunoId });
      }
    });
    
    this.saveData(data);
  }

  // Aulas
  getAulasByDiario(diarioId: number): Aula[] {
    return this.getData().aulas.filter((a: Aula) => a.diarioId === diarioId);
  }

  createAula(aula: Omit<Aula, 'id' | 'createdAt' | 'updatedAt'>): Aula {
    const data = this.getData();
    const newAula: Aula = {
      ...aula,
      id: this.getNextId(data.aulas),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.aulas.push(newAula);
    this.saveData(data);
    return newAula;
  }

  updateAula(id: number, updates: Partial<Aula>): Aula | null {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index === -1) return null;
    
    data.aulas[index] = { ...data.aulas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.aulas[index];
  }

  deleteAula(id: number): boolean {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index === -1) return false;
    
    data.aulas.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Presenças
  getPresencasByAula(aulaId: number): Presenca[] {
    return this.getData().presencas.filter((p: Presenca) => p.aulaId === aulaId);
  }

  getPresencasByAluno(alunoId: number): Presenca[] {
    return this.getData().presencas.filter((p: Presenca) => p.alunoId === alunoId);
  }

  savePresencas(presencas: Omit<Presenca, 'id'>[]): Presenca[] {
    const data = this.getData();
    
    // Remove presenças existentes da aula
    const aulaId = presencas[0]?.aulaId;
    if (aulaId) {
      data.presencas = data.presencas.filter((p: Presenca) => p.aulaId !== aulaId);
    }
    
    // Adiciona novas presenças
    const newPresencas = presencas.map(p => ({
      ...p,
      id: this.getNextId(data.presencas)
    }));
    
    data.presencas.push(...newPresencas);
    this.saveData(data);
    return newPresencas;
  }

  // Avaliações
  getAvaliacoesByDiario(diarioId: number): Avaliacao[] {
    return this.getData().avaliacoes.filter((a: Avaliacao) => a.diarioId === diarioId);
  }

  createAvaliacao(avaliacao: Omit<Avaliacao, 'id' | 'createdAt' | 'updatedAt'>): Avaliacao {
    const data = this.getData();
    const newAvaliacao: Avaliacao = {
      ...avaliacao,
      id: this.getNextId(data.avaliacoes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.avaliacoes.push(newAvaliacao);
    this.saveData(data);
    return newAvaliacao;
  }

  updateAvaliacao(id: number, updates: Partial<Avaliacao>): Avaliacao | null {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index === -1) return null;
    
    data.avaliacoes[index] = { ...data.avaliacoes[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.avaliacoes[index];
  }

  deleteAvaliacao(id: number): boolean {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index === -1) return false;
    
    data.avaliacoes.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Notas
  getNotasByAvaliacao(avaliacaoId: number): Nota[] {
    return this.getData().notas.filter((n: Nota) => n.avaliacaoId === avaliacaoId);
  }

  getNotasByAluno(alunoId: number): Nota[] {
    return this.getData().notas.filter((n: Nota) => n.alunoId === alunoId);
  }

  saveNotas(notas: Omit<Nota, 'id'>[]): Nota[] {
    const data = this.getData();
    
    // Remove notas existentes da avaliação
    const avaliacaoId = notas[0]?.avaliacaoId;
    if (avaliacaoId) {
      data.notas = data.notas.filter((n: Nota) => n.avaliacaoId !== avaliacaoId);
    }
    
    // Adiciona novas notas
    const newNotas = notas.map(n => ({
      ...n,
      id: this.getNextId(data.notas)
    }));
    
    data.notas.push(...newNotas);
    this.saveData(data);
    return newNotas;
  }

  // Ocorrências
  getOcorrenciasByDiario(diarioId: number): Ocorrencia[] {
    return this.getData().ocorrencias.filter((o: Ocorrencia) => o.diarioId === diarioId);
  }

  createOcorrencia(ocorrencia: Omit<Ocorrencia, 'id' | 'createdAt' | 'updatedAt'>): Ocorrencia {
    const data = this.getData();
    const newOcorrencia: Ocorrencia = {
      ...ocorrencia,
      id: this.getNextId(data.ocorrencias),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.ocorrencias.push(newOcorrencia);
    this.saveData(data);
    return newOcorrencia;
  }

  updateOcorrencia(id: number, updates: Partial<Ocorrencia>): Ocorrencia | null {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index === -1) return null;
    
    data.ocorrencias[index] = { ...data.ocorrencias[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.ocorrencias[index];
  }

  deleteOcorrencia(id: number): boolean {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index === -1) return false;
    
    data.ocorrencias.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Vínculos
  vincularAlunoAoDiario(diarioId: number, alunoId: number): DiarioAluno {
    const data = this.getData();
    const newVinculo: DiarioAluno = {
      id: this.getNextId(data.diarioAlunos),
      diarioId,
      alunoId
    };
    data.diarioAlunos.push(newVinculo);
    this.saveData(data);
    return newVinculo;
  }

  desvincularAlunoDoDiario(diarioId: number, alunoId: number): boolean {
    const data = this.getData();
    const index = data.diarioAlunos.findIndex((da: DiarioAluno) => da.diarioId === diarioId && da.alunoId === alunoId);
    if (index === -1) return false;
    
    data.diarioAlunos.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Professores
  getProfessores(): Professor[] {
    return this.getData().professores;
  }

  createProfessor(professor: Omit<Professor, 'id' | 'createdAt' | 'updatedAt'>): Professor {
    const data = this.getData();
    const newProfessor: Professor = {
      ...professor,
      id: this.getNextId(data.professores),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.professores.push(newProfessor);
    this.saveData(data);
    return newProfessor;
  }

  updateProfessor(id: number, updates: Partial<Professor>): Professor | null {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index === -1) return null;
    
    data.professores[index] = { ...data.professores[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.professores[index];
  }

  deleteProfessor(id: number): boolean {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index === -1) return false;
    
    data.professores.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Cálculos
  calcularMediaAluno(alunoId: number, diarioId: number): number {
    const data = this.getData();
    const avaliacoes = data.avaliacoes.filter((a: Avaliacao) => a.diarioId === diarioId);
    const notas = data.notas.filter((n: Nota) => n.alunoId === alunoId);
    
    let somaNotas = 0;
    let somaPesos = 0;
    
    avaliacoes.forEach((avaliacao: Avaliacao) => {
      const nota = notas.find((n: Nota) => n.avaliacaoId === avaliacao.id);
      if (nota) {
        somaNotas += nota.valor * avaliacao.peso;
        somaPesos += avaliacao.peso;
      }
    });
    
    return somaPesos > 0 ? somaNotas / somaPesos : 0;
  }

  calcularFrequenciaAluno(alunoId: number, diarioId: number): number {
    const data = this.getData();
    const aulas = data.aulas.filter((a: Aula) => a.diarioId === diarioId);
    const presencas = data.presencas.filter((p: Presenca) => p.alunoId === alunoId);
    
    const totalAulas = aulas.length;
    const presentes = presencas.filter((p: Presenca) => p.status === 'PRESENTE').length;
    
    return totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;
  }

  // Métodos para Comunicados
  getComunicados(): Comunicado[] {
    return this.getData().comunicados;
  }

  createComunicado(comunicado: Omit<Comunicado, 'id' | 'createdAt' | 'updatedAt'>): Comunicado {
    const data = this.getData();
    const newComunicado: Comunicado = {
      ...comunicado,
      id: this.getNextId(data.comunicados),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.comunicados.push(newComunicado);
    this.saveData(data);
    return newComunicado;
  }

  updateComunicado(id: number, updates: Partial<Comunicado>): Comunicado | null {
    const data = this.getData();
    const index = data.comunicados.findIndex((c: Comunicado) => c.id === id);
    if (index === -1) return null;
    
    data.comunicados[index] = { ...data.comunicados[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.comunicados[index];
  }

  deleteComunicado(id: number): boolean {
    const data = this.getData();
    const index = data.comunicados.findIndex((c: Comunicado) => c.id === id);
    if (index === -1) return false;
    
    data.comunicados.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Métodos para Recados com persistência garantida
  getRecados(): Recado[] {
    const data = this.getData();
    console.log('Carregando todos os recados do localStorage:', data.recados);
    return data.recados || [];
  }

  getRecadosByProfessor(professorId: number): Recado[] {
    const data = this.getData();
    const recados = (data.recados || []).filter((r: Recado) => r.professorId === professorId);
    console.log(`Carregando recados do professor ${professorId} do localStorage:`, recados);
    return recados;
  }

  getRecadosByTurma(turmaId: number): Recado[] {
    const data = this.getData();
    const recados = (data.recados || []).filter((r: Recado) => r.turmaId === turmaId && !r.alunoId);
    console.log(`Carregando recados da turma ${turmaId} do localStorage:`, recados);
    return recados;
  }

  getRecadosByAluno(alunoId: number): Recado[] {
    const data = this.getData();
    const recados = (data.recados || []).filter((r: Recado) => r.alunoId === alunoId);
    console.log(`Carregando recados do aluno ${alunoId} do localStorage:`, recados);
    return recados;
  }

  getRecadosForAluno(alunoId: number, turmaId: number): Recado[] {
    const data = this.getData();
    const recados = (data.recados || []).filter((r: Recado) => 
      (r.turmaId === turmaId && !r.alunoId) || r.alunoId === alunoId
    );
    console.log(`Carregando recados para aluno ${alunoId} da turma ${turmaId} do localStorage:`, recados);
    return recados;
  }

  createRecado(recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt'>): Recado {
    const data = this.getData();
    
    // Garantir que o array de recados existe
    if (!Array.isArray(data.recados)) {
      data.recados = [];
    }
    
    const newRecado: Recado = {
      ...recado,
      id: this.getNextId(data.recados),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Criando novo recado:', newRecado);
    console.log('Array de recados antes:', data.recados.length);
    
    data.recados.push(newRecado);
    console.log('Array de recados depois:', data.recados.length);
    
    // Salvar dados imediatamente
    this.saveData(data);
    
    // Verificar se foi salvo corretamente
    const verification = this.getData();
    console.log('Verificação após salvamento - total de recados:', verification.recados.length);
    
    // Disparar evento específico para recados
    window.dispatchEvent(new CustomEvent('recadoCreated', { 
      detail: newRecado
    }));
    
    return newRecado;
  }

  updateRecado(id: number, updates: Partial<Recado>): Recado | null {
    const data = this.getData();
    
    // Garantir que o array de recados existe
    if (!Array.isArray(data.recados)) {
      data.recados = [];
      console.error('Array de recados não existe para atualização');
      return null;
    }
    
    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) {
      console.error('Recado não encontrado para atualização:', id);
      return null;
    }
    
    const oldRecado = data.recados[index];
    data.recados[index] = { ...data.recados[index], ...updates, updatedAt: new Date().toISOString() };
    
    console.log('Atualizando recado:', { id, oldRecado, newRecado: data.recados[index] });
    
    // Salvar dados imediatamente
    this.saveData(data);
    
    // Verificar se foi salvo corretamente
    const verification = this.getData();
    console.log('Verificação após atualização - total de recados:', verification.recados.length);
    
    // Disparar evento específico para recados
    window.dispatchEvent(new CustomEvent('recadoUpdated', { 
      detail: data.recados[index]
    }));
    
    return data.recados[index];
  }

  deleteRecado(id: number): boolean {
    const data = this.getData();
    
    // Garantir que o array de recados existe
    if (!Array.isArray(data.recados)) {
      data.recados = [];
      console.error('Array de recados não existe para exclusão');
      return false;
    }
    
    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) {
      console.error('Recado não encontrado para exclusão:', id);
      return false;
    }
    
    const deletedRecado = data.recados[index];
    console.log('Excluindo recado:', deletedRecado);
    console.log('Array de recados antes da exclusão:', data.recados.length);
    
    data.recados.splice(index, 1);
    console.log('Array de recados depois da exclusão:', data.recados.length);
    
    // Salvar dados imediatamente
    this.saveData(data);
    
    // Verificar se foi salvo corretamente
    const verification = this.getData();
    console.log('Verificação após exclusão - total de recados:', verification.recados.length);
    
    // Disparar evento específico para recados
    window.dispatchEvent(new CustomEvent('recadoDeleted', { 
      detail: { id, recado: deletedRecado }
    }));
    
    return true;
  }
}

export const mockDataService = new MockDataService();
