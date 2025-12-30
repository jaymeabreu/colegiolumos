import { supabase } from '@/lib/supabaseClient';

// =============================================
// TIPOS ATUALIZADOS
// =============================================

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
  foto?: string;
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
  foto?: string;
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
  bimestre?: number;
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
  alunoId: number;
  data: string;
  tipo: string;
  descricao: string;
  acaoTomada: string;
  createdAt: string;
  updatedAt: string;
}

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
  alunoId?: number;
  alunoNome?: string;
  dataEnvio: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// SERVIÇO SUPABASE COM FALLBACK PARA LOCALSTORAGE
// =============================================

class SupabaseService {
  private storageKey = 'gestao_escolar_data';
  private senhasStorageKey = 'gestao_escolar_senhas';
  private static initialized = false;

  private defaultData = {
    usuarios: [
      {
        id: 1,
        nome: 'Coordenador Sistema',
        email: 'coordenador@demo.com',
        papel: 'COORDENADOR' as const,
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
    this.clearOldData();
  }

  private clearOldData() {
    try {
      const data = this.getData();
      localStorage.removeItem(this.storageKey + '_recados_cache');
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
          return validData;
        }
      }
    } catch (error) {
      console.error('Erro ao ler dados do localStorage:', error);
      localStorage.removeItem(this.storageKey);
    }

    if (!SupabaseService.initialized) {
      this.saveData(this.defaultData);
      SupabaseService.initialized = true;
    }
    return this.defaultData;
  }

  private saveData(data: any) {
    try {
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

      const jsonString = JSON.stringify(dataToSave);
      localStorage.setItem(this.storageKey, jsonString);
      localStorage.setItem(this.storageKey + '_timestamp', Date.now().toString());

      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: {
          type: 'all',
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  private getNextId(collection: any[]): number {
    if (!Array.isArray(collection) || collection.length === 0) {
      return 1;
    }
    return Math.max(...collection.map(item => item?.id || 0), 0) + 1;
  }

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

  private removerTodosVinculosDoDiario(diarioId: number): void {
    const data = this.getData();
    data.diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.diarioId !== diarioId);
    this.saveData(data);
  }

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

  private vincularAlunosDaTurmaAoDiario(turmaId: number, diarioId: number): void {
    const data = this.getData();
    const alunosDaTurma = data.alunos.filter((a: Aluno) => a.turmaId === turmaId);

    alunosDaTurma.forEach((aluno: Aluno) => {
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
      }
    });

    this.saveData(data);
  }

  private vincularAlunoAosDiariosDaTurma(alunoId: number, turmaId: number): void {
    const data = this.getData();
    const diariosDaTurma = data.diarios.filter((d: Diario) => d.turmaId === turmaId);

    diariosDaTurma.forEach((diario: Diario) => {
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
      }
    });

    this.saveData(data);
  }

  // =============================================
  // MÉTODOS PÚBLICOS - USUÁRIOS
  // =============================================

  async getUsuarios(): Promise<Usuario[]> {
    return this.getData().usuarios;
  }

  async createUsuario(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>, senha?: string): Promise<Usuario> {
    const data = this.getData();
    const newUsuario: Usuario = {
      ...usuario,
      id: this.getNextId(data.usuarios),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.usuarios.push(newUsuario);
    this.saveData(data);

    if (senha) {
      const senhas = this.getSenhas();
      senhas[newUsuario.id] = senha;
      this.saveSenhas(senhas);
    }

    return newUsuario;
  }

  async updateUsuario(id: number, updates: Partial<Usuario>, novaSenha?: string): Promise<Usuario | null> {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index === -1) return null;

    data.usuarios[index] = { ...data.usuarios[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);

    if (novaSenha) {
      const senhas = this.getSenhas();
      senhas[id] = novaSenha;
      this.saveSenhas(senhas);
    }

    return data.usuarios[index];
  }

  async deleteUsuario(id: number): Promise<void> {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index !== -1) {
      data.usuarios.splice(index, 1);
      this.saveData(data);

      const senhas = this.getSenhas();
      delete senhas[id];
      this.saveSenhas(senhas);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - TURMAS
  // =============================================

  async getTurmas(): Promise<Turma[]> {
    return this.getData().turmas;
  }

  async getTurmaById(id: number): Promise<Turma | null> {
    const data = this.getData();
    return data.turmas.find((t: Turma) => t.id === id) || null;
  }

  async createTurma(turma: Omit<Turma, 'id' | 'createdAt' | 'updatedAt'>): Promise<Turma> {
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

  async updateTurma(id: number, updates: Partial<Turma>): Promise<Turma | null> {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index === -1) return null;

    data.turmas[index] = { ...data.turmas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.turmas[index];
  }

  async deleteTurma(id: number): Promise<void> {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index !== -1) {
      data.turmas.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - DISCIPLINAS
  // =============================================

  async getDisciplinas(): Promise<Disciplina[]> {
    return this.getData().disciplinas;
  }

  async getDisciplinaById(id: number): Promise<Disciplina | null> {
    const data = this.getData();
    return data.disciplinas.find((d: Disciplina) => d.id === id) || null;
  }

  async createDisciplina(disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'updatedAt'>): Promise<Disciplina> {
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

  async updateDisciplina(id: number, updates: Partial<Disciplina>): Promise<Disciplina | null> {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index === -1) return null;

    data.disciplinas[index] = { ...data.disciplinas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.disciplinas[index];
  }

  async deleteDisciplina(id: number): Promise<void> {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index !== -1) {
      data.disciplinas.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - PROFESSORES
  // =============================================

  async getProfessores(): Promise<Professor[]> {
    return this.getData().professores;
  }

  async createProfessor(professor: Omit<Professor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Professor> {
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

  async updateProfessor(id: number, updates: Partial<Professor>): Promise<Professor | null> {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index === -1) return null;

    data.professores[index] = { ...data.professores[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.professores[index];
  }

  async deleteProfessor(id: number): Promise<void> {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index !== -1) {
      data.professores.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - ALUNOS
  // =============================================

  async getAlunos(): Promise<Aluno[]> {
    return this.getData().alunos;
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    return this.getData().alunos.filter((a: Aluno) => a.turmaId === turmaId);
  }

  async getAlunosByDiario(diarioId: number): Promise<Aluno[]> {
    const data = this.getData();
    const diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.diarioId === diarioId);
    return data.alunos.filter((a: Aluno) => diarioAlunos.some((da: DiarioAluno) => da.alunoId === a.id));
  }

  async createAluno(aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>): Promise<Aluno> {
    const data = this.getData();
    const newAluno: Aluno = {
      ...aluno,
      id: this.getNextId(data.alunos),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.alunos.push(newAluno);
    this.saveData(data);

    if (newAluno.turmaId) {
      this.vincularAlunoAosDiariosDaTurma(newAluno.id, newAluno.turmaId);
    }

    return newAluno;
  }

  async updateAluno(id: number, updates: Partial<Aluno>): Promise<Aluno | null> {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index === -1) return null;

    const oldAluno = data.alunos[index];
    const updatedAluno = {
      ...data.alunos[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      foto: updates.foto !== undefined ? updates.foto : data.alunos[index].foto
    };
    data.alunos[index] = updatedAluno;

    this.saveData(data);

    if (updates.turmaId !== undefined && updates.turmaId !== oldAluno.turmaId) {
      if (oldAluno.turmaId) {
        this.removerVinculosAlunoTurma(id, oldAluno.turmaId);
      }
      if (updates.turmaId) {
        this.vincularAlunoAosDiariosDaTurma(id, updates.turmaId);
      }
    }

    return updatedAluno;
  }

  async deleteAluno(id: number): Promise<void> {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index !== -1) {
      data.diarioAlunos = data.diarioAlunos.filter((da: DiarioAluno) => da.alunoId !== id);
      data.alunos.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - DIÁRIOS
  // =============================================

  async getDiarios(): Promise<Diario[]> {
    return this.getData().diarios;
  }

  async getDiariosByProfessor(professorId: number): Promise<Diario[]> {
    return this.getData().diarios.filter((d: Diario) => d.professorId === professorId);
  }

  async createDiario(diario: Omit<Diario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Diario> {
    const data = this.getData();
    const newDiario: Diario = {
      ...diario,
      id: this.getNextId(data.diarios),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.diarios.push(newDiario);
    this.saveData(data);

    this.vincularAlunosDaTurmaAoDiario(newDiario.turmaId, newDiario.id);

    return newDiario;
  }

  async updateDiario(id: number, updates: Partial<Diario>): Promise<Diario | null> {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index === -1) return null;

    const oldDiario = data.diarios[index];
    data.diarios[index] = { ...data.diarios[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);

    if (updates.turmaId && updates.turmaId !== oldDiario.turmaId) {
      this.removerTodosVinculosDoDiario(id);
      this.vincularAlunosDaTurmaAoDiario(updates.turmaId, id);
    }

    return data.diarios[index];
  }

  async deleteDiario(id: number): Promise<void> {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index !== -1) {
      this.removerTodosVinculosDoDiario(id);
      data.diarios.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - DIÁRIO CONTROLE
  // =============================================

  async entregarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);

    if (!diario || !usuario) return false;
    if (diario.status !== 'PENDENTE' && diario.status !== 'DEVOLVIDO') return false;

    diario.status = 'ENTREGUE';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined;

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

  async devolverDiario(diarioId: number, usuarioId: number, observacao?: string): Promise<boolean> {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);

    if (!diario || !usuario) return false;
    if (diario.status !== 'ENTREGUE') return false;
    if (usuario.papel !== 'COORDENADOR') return false;

    diario.status = 'DEVOLVIDO';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined;

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

  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);
    const usuario = data.usuarios.find((u: Usuario) => u.id === usuarioId);

    if (!diario || !usuario) return false;
    if (diario.status !== 'ENTREGUE') return false;
    if (usuario.papel !== 'COORDENADOR') return false;

    diario.status = 'FINALIZADO';
    diario.updatedAt = new Date().toISOString();
    diario.solicitacaoDevolucao = undefined;

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

  async solicitarDevolucaoDiario(diarioId: number, usuarioId: number, comentario: string): Promise<boolean> {
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

  professorPodeEditarDiario(diarioId: number, professorId: number): boolean {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);

    if (!diario) return false;
    if (diario.professorId !== professorId) return false;

    return diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO';
  }

  coordenadorPodeGerenciarDiario(diarioId: number): { canDevolver: boolean; canFinalizar: boolean } {
    const data = this.getData();
    const diario = data.diarios.find((d: Diario) => d.id === diarioId);

    if (!diario) return { canDevolver: false, canFinalizar: false };

    return {
      canDevolver: diario.status === 'ENTREGUE',
      canFinalizar: diario.status === 'ENTREGUE'
    };
  }

  // =============================================
  // MÉTODOS PÚBLICOS - AULAS
  // =============================================

  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    return this.getData().aulas.filter((a: Aula) => a.diarioId === diarioId);
  }

  async createAula(aula: Omit<Aula, 'id' | 'createdAt' | 'updatedAt'>): Promise<Aula> {
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

  async updateAula(id: number, updates: Partial<Aula>): Promise<Aula | null> {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index === -1) return null;

    data.aulas[index] = { ...data.aulas[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.aulas[index];
  }

  async deleteAula(id: number): Promise<void> {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index !== -1) {
      data.aulas.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - PRESENÇAS
  // =============================================

  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    return this.getData().presencas.filter((p: Presenca) => p.aulaId === aulaId);
  }

  async getPresencasByAluno(alunoId: number): Promise<Presenca[]> {
    return this.getData().presencas.filter((p: Presenca) => p.alunoId === alunoId);
  }

  async savePresencas(presencas: Omit<Presenca, 'id'>[]): Promise<Presenca[]> {
    const data = this.getData();

    const aulaId = presencas[0]?.aulaId;
    if (aulaId) {
      data.presencas = data.presencas.filter((p: Presenca) => p.aulaId !== aulaId);
    }

    const newPresencas = presencas.map(p => ({
      ...p,
      id: this.getNextId(data.presencas)
    }));

    data.presencas.push(...newPresencas);
    this.saveData(data);
    return newPresencas;
  }

  // =============================================
  // MÉTODOS PÚBLICOS - AVALIAÇÕES
  // =============================================

  async getAvaliacoesByDiario(diarioId: number): Promise<Avaliacao[]> {
    return this.getData().avaliacoes.filter((a: Avaliacao) => a.diarioId === diarioId);
  }

  async createAvaliacao(avaliacao: Omit<Avaliacao, 'id' | 'createdAt' | 'updatedAt'>): Promise<Avaliacao> {
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

  async updateAvaliacao(id: number, updates: Partial<Avaliacao>): Promise<Avaliacao | null> {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index === -1) return null;

    data.avaliacoes[index] = { ...data.avaliacoes[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.avaliacoes[index];
  }

  async deleteAvaliacao(id: number): Promise<void> {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index !== -1) {
      data.avaliacoes.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - NOTAS
  // =============================================

  async getNotasByAvaliacao(avaliacaoId: number): Promise<Nota[]> {
    return this.getData().notas.filter((n: Nota) => n.avaliacaoId === avaliacaoId);
  }

  async getNotasByAluno(alunoId: number): Promise<Nota[]> {
    return this.getData().notas.filter((n: Nota) => n.alunoId === alunoId);
  }

  async saveNotas(notas: Omit<Nota, 'id'>[]): Promise<Nota[]> {
    const data = this.getData();

    const avaliacaoId = notas[0]?.avaliacaoId;
    if (avaliacaoId) {
      data.notas = data.notas.filter((n: Nota) => n.avaliacaoId !== avaliacaoId);
    }

    const newNotas = notas.map(n => ({
      ...n,
      id: this.getNextId(data.notas)
    }));

    data.notas.push(...newNotas);
    this.saveData(data);
    return newNotas;
  }

  // =============================================
  // MÉTODOS PÚBLICOS - OCORRÊNCIAS
  // =============================================

  async getOcorrenciasByAluno(alunoId: number): Promise<Ocorrencia[]> {
    return this.getData().ocorrencias.filter((o: Ocorrencia) => o.alunoId === alunoId);
  }

  async getOcorrencias(): Promise<Ocorrencia[]> {
    return this.getData().ocorrencias;
  }

  async createOcorrencia(ocorrencia: Omit<Ocorrencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ocorrencia> {
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

  async updateOcorrencia(id: number, updates: Partial<Ocorrencia>): Promise<Ocorrencia | null> {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index === -1) return null;

    data.ocorrencias[index] = { ...data.ocorrencias[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.ocorrencias[index];
  }

  async deleteOcorrencia(id: number): Promise<void> {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index !== -1) {
      data.ocorrencias.splice(index, 1);
      this.saveData(data);
    }
  }

  // =============================================
  // MÉTODOS PÚBLICOS - COMUNICADOS
  // =============================================

  async getComunicados(): Promise<Comunicado[]> {
    return this.getData().comunicados;
  }

  async createComunicado(comunicado: Omit<Comunicado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comunicado> {
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

  async updateComunicado(id: number, updates: Partial<Comunicado>): Promise<Comunicado | null> {
    const data = this.getData();
    const index = data.comunicados.findIndex((c: Comunicado) => c.id === id);
    if (index === -1) return null;

    data.comunicados[index] = { ...data.comunicados[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);
    return data.comunicados[index];
  }

  async deleteComunicado(id: number): Promise<boolean> {
    const data = this.getData();
    const index = data.comunicados.findIndex((c: Comunicado) => c.id === id);
    if (index === -1) return false;

    data.comunicados.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // =============================================
  // MÉTODOS PÚBLICOS - RECADOS
  // =============================================

  async getRecados(): Promise<Recado[]> {
    const data = this.getData();
    return data.recados || [];
  }

  async createRecado(recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recado> {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
    }

    const newRecado: Recado = {
      ...recado,
      id: this.getNextId(data.recados),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.recados.push(newRecado);
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoCreated', {
      detail: newRecado
    }));

    return newRecado;
  }

  async updateRecado(id: number, updates: Partial<Recado>): Promise<Recado | null> {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
      return null;
    }

    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) return null;

    data.recados[index] = { ...data.recados[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoUpdated', {
      detail: data.recados[index]
    }));

    return data.recados[index];
  }

  async deleteRecado(id: number): Promise<boolean> {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
      return false;
    }

    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) return false;

    data.recados.splice(index, 1);
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoDeleted', {
      detail: { id }
    }));

    return true;
  }

  // =============================================
  // MÉTODOS PÚBLICOS - CÁLCULOS
  // =============================================

  async calcularMediaAluno(alunoId: number, diarioId: number): Promise<number> {
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

  // =============================================
  // MÉTODOS PÚBLICOS - VÍNCULOS
  // =============================================

  async vincularAlunoAoDiario(diarioId: number, alunoId: number): Promise<void> {
    const data = this.getData();
    const newVinculo: DiarioAluno = {
      id: this.getNextId(data.diarioAlunos),
      diarioId,
      alunoId
    };
    data.diarioAlunos.push(newVinculo);
    this.saveData(data);
  }

  async desvincularAlunoDoDiario(diarioId: number, alunoId: number): Promise<void> {
    const data = this.getData();
    const index = data.diarioAlunos.findIndex((da: DiarioAluno) => da.diarioId === diarioId && da.alunoId === alunoId);
    if (index !== -1) {
      data.diarioAlunos.splice(index, 1);
      this.saveData(data);
    }
  }

  async getDiarioAlunos(): Promise<DiarioAluno[]> {
    return this.getData().diarioAlunos;
  }

  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    // Stub - retorna vazio por enquanto
    return [];
  }

  async getProfessorById(id: number): Promise<Professor | null> {
    const data = this.getData();
    return data.professores.find((p: Professor) => p.id === id) || null;
  }
}

export const supabaseService = new SupabaseService();
