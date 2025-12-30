import { supabase } from '@/lib/supabaseClient';

// Tipos
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  aluno_id?: number;
  professor_id?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Turma {
  id: number;
  nome: string;
  ano: number;
  turno: string;
  anoLetivo?: string;
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  carga_horaria: number;
  cargaHoraria?: number;
  created_at: string;
  updated_at: string;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  turma_id?: number;
  turmaId?: number;
  contato?: string;
  created_at: string;
  updated_at: string;
}

export interface Diario {
  id: number;
  nome: string;
  disciplina_id: number;
  disciplinaId?: number;
  turma_id: number;
  turmaId?: number;
  professor_id: number;
  professorId?: number;
  bimestre: number;
  data_inicio: string;
  dataInicio?: string;
  data_termino: string;
  dataTermino?: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO';
  solicitacao_devolucao?: any;
  historico_status?: any;
  created_at: string;
  updated_at: string;
}

export interface DiarioAluno {
  id: number;
  diario_id: number;
  aluno_id: number;
}

export interface Aula {
  id: number;
  diario_id: number;
  diarioId?: number;
  data: string;
  horario?: string;
  conteudo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Presenca {
  id: number;
  aula_id: number;
  aulaId?: number;
  aluno_id: number;
  alunoId?: number;
  status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  observacao?: string;
}

export interface Avaliacao {
  id: number;
  diario_id: number;
  diarioId?: number;
  titulo: string;
  data: string;
  tipo: string;
  peso: number;
  bimestre?: number;
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: number;
  avaliacao_id: number;
  avaliacaoId?: number;
  aluno_id: number;
  alunoId?: number;
  valor: number;
}

export interface Ocorrencia {
  id: number;
  aluno_id: number;
  alunoId?: number;
  diario_id?: number;
  tipo: 'disciplinar' | 'pedagogica' | 'elogio';
  data: string;
  descricao: string;
  acao_tomada?: string;
  created_at: string;
  updated_at: string;
}

export interface Comunicado {
  id: number;
  titulo: string;
  mensagem: string;
  autor: string;
  autor_id: number;
  autorId?: number;
  data_publicacao: string;
  dataPublicacao?: string;
  created_at: string;
  updated_at: string;
}

export interface Recado {
  id: number;
  titulo: string;
  mensagem: string;
  professor_id: number;
  professorId?: number;
  professor_nome: string;
  professorNome?: string;
  turma_id: number;
  turmaId?: number;
  turma_nome: string;
  turmaNome?: string;
  aluno_id?: number;
  alunoId?: number;
  aluno_nome?: string;
  alunoNome?: string;
  data_envio: string;
  dataEnvio?: string;
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  private storageKey = 'gestao_escolar_data';
  private static initialized = false;

  private defaultData = {
    usuarios: [] as Usuario[],
    turmas: [] as Turma[],
    disciplinas: [] as Disciplina[],
    professores: [] as Professor[],
    diarios: [] as Diario[],
    alunos: [] as Aluno[],
    diario_alunos: [] as DiarioAluno[],
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
          return {
            usuarios: Array.isArray(parsed.usuarios) ? parsed.usuarios : [],
            turmas: Array.isArray(parsed.turmas) ? parsed.turmas : [],
            disciplinas: Array.isArray(parsed.disciplinas) ? parsed.disciplinas : [],
            professores: Array.isArray(parsed.professores) ? parsed.professores : [],
            diarios: Array.isArray(parsed.diarios) ? parsed.diarios : [],
            alunos: Array.isArray(parsed.alunos) ? parsed.alunos : [],
            diario_alunos: Array.isArray(parsed.diario_alunos) ? parsed.diario_alunos : [],
            aulas: Array.isArray(parsed.aulas) ? parsed.aulas : [],
            presencas: Array.isArray(parsed.presencas) ? parsed.presencas : [],
            avaliacoes: Array.isArray(parsed.avaliacoes) ? parsed.avaliacoes : [],
            notas: Array.isArray(parsed.notas) ? parsed.notas : [],
            ocorrencias: Array.isArray(parsed.ocorrencias) ? parsed.ocorrencias : [],
            comunicados: Array.isArray(parsed.comunicados) ? parsed.comunicados : [],
            recados: Array.isArray(parsed.recados) ? parsed.recados : []
          };
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
        diario_alunos: Array.isArray(data.diario_alunos) ? data.diario_alunos : [],
        aulas: Array.isArray(data.aulas) ? data.aulas : [],
        presencas: Array.isArray(data.presencas) ? data.presencas : [],
        avaliacoes: Array.isArray(data.avaliacoes) ? data.avaliacoes : [],
        notas: Array.isArray(data.notas) ? data.notas : [],
        ocorrencias: Array.isArray(data.ocorrencias) ? data.ocorrencias : [],
        comunicados: Array.isArray(data.comunicados) ? data.comunicados : [],
        recados: Array.isArray(data.recados) ? data.recados : []
      };

      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
      localStorage.setItem(this.storageKey + '_timestamp', Date.now().toString());

      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { type: 'all', timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  private getNextId(collection: any[]): number {
    if (!Array.isArray(collection) || collection.length === 0) return 1;
    return Math.max(...collection.map((item: any) => item?.id || 0), 0) + 1;
  }

  // USUÁRIOS
  getUsuarios(): Usuario[] {
    return this.getData().usuarios;
  }

  createUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Usuario {
    const data = this.getData();
    const newUsuario: Usuario = {
      ...usuario,
      id: this.getNextId(data.usuarios),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.usuarios.push(newUsuario);
    this.saveData(data);
    return newUsuario;
  }

  updateUsuario(id: number, updates: Partial<Usuario>): Usuario | null {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index === -1) return null;
    data.usuarios[index] = { ...data.usuarios[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.usuarios[index];
  }

  deleteUsuario(id: number): void {
    const data = this.getData();
    const index = data.usuarios.findIndex((u: Usuario) => u.id === id);
    if (index !== -1) {
      data.usuarios.splice(index, 1);
      this.saveData(data);
    }
  }

  // TURMAS
  getTurmas(): Turma[] {
    return this.getData().turmas;
  }

  getTurmaById(id: number): Turma | null {
    const data = this.getData();
    return data.turmas.find((t: Turma) => t.id === id) || null;
  }

  createTurma(turma: Omit<Turma, 'id' | 'created_at' | 'updated_at'>): Turma {
    const data = this.getData();
    const newTurma: Turma = {
      ...turma,
      id: this.getNextId(data.turmas),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.turmas.push(newTurma);
    this.saveData(data);
    return newTurma;
  }

  updateTurma(id: number, updates: Partial<Turma>): Turma | null {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index === -1) return null;
    data.turmas[index] = { ...data.turmas[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.turmas[index];
  }

  deleteTurma(id: number): void {
    const data = this.getData();
    const index = data.turmas.findIndex((t: Turma) => t.id === id);
    if (index !== -1) {
      data.turmas.splice(index, 1);
      this.saveData(data);
    }
  }

  // DISCIPLINAS
  getDisciplinas(): Disciplina[] {
    return this.getData().disciplinas;
  }

  getDisciplinaById(id: number): Disciplina | null {
    const data = this.getData();
    return data.disciplinas.find((d: Disciplina) => d.id === id) || null;
  }

  createDisciplina(disciplina: Omit<Disciplina, 'id' | 'created_at' | 'updated_at'>): Disciplina {
    const data = this.getData();
    const newDisciplina: Disciplina = {
      ...disciplina,
      id: this.getNextId(data.disciplinas),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.disciplinas.push(newDisciplina);
    this.saveData(data);
    return newDisciplina;
  }

  updateDisciplina(id: number, updates: Partial<Disciplina>): Disciplina | null {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index === -1) return null;
    data.disciplinas[index] = { ...data.disciplinas[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.disciplinas[index];
  }

  deleteDisciplina(id: number): void {
    const data = this.getData();
    const index = data.disciplinas.findIndex((d: Disciplina) => d.id === id);
    if (index !== -1) {
      data.disciplinas.splice(index, 1);
      this.saveData(data);
    }
  }

  // PROFESSORES
  getProfessores(): Professor[] {
    return this.getData().professores;
  }

  getProfessorById(id: number): Professor | null {
    const data = this.getData();
    return data.professores.find((p: Professor) => p.id === id) || null;
  }

  createProfessor(professor: Omit<Professor, 'id' | 'created_at' | 'updated_at'>): Professor {
    const data = this.getData();
    const newProfessor: Professor = {
      ...professor,
      id: this.getNextId(data.professores),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.professores.push(newProfessor);
    this.saveData(data);
    return newProfessor;
  }

  updateProfessor(id: number, updates: Partial<Professor>): Professor | null {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index === -1) return null;
    data.professores[index] = { ...data.professores[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.professores[index];
  }

  deleteProfessor(id: number): void {
    const data = this.getData();
    const index = data.professores.findIndex((p: Professor) => p.id === id);
    if (index !== -1) {
      data.professores.splice(index, 1);
      this.saveData(data);
    }
  }

  // ALUNOS
  getAlunos(): Aluno[] {
    return this.getData().alunos;
  }

  getAlunosByTurma(turmaId: number): Aluno[] {
    return this.getData().alunos.filter((a: Aluno) => a.turma_id === turmaId || a.turmaId === turmaId);
  }

  getAlunosByDiario(diarioId: number): Aluno[] {
    const data = this.getData();
    const diarioAlunos = data.diario_alunos.filter((da: DiarioAluno) => da.diario_id === diarioId);
    return data.alunos.filter((a: Aluno) => diarioAlunos.some((da: DiarioAluno) => da.aluno_id === a.id));
  }

  createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Aluno {
    const data = this.getData();
    const newAluno: Aluno = {
      ...aluno,
      id: this.getNextId(data.alunos),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.alunos.push(newAluno);
    this.saveData(data);
    return newAluno;
  }

  updateAluno(id: number, updates: Partial<Aluno>): Aluno | null {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index === -1) return null;
    data.alunos[index] = { ...data.alunos[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.alunos[index];
  }

  deleteAluno(id: number): void {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index !== -1) {
      data.diario_alunos = data.diario_alunos.filter((da: DiarioAluno) => da.aluno_id !== id);
      data.alunos.splice(index, 1);
      this.saveData(data);
    }
  }

  // DIÁRIOS
  getDiarios(): Diario[] {
    return this.getData().diarios;
  }

  getDiariosByProfessor(professorId: number): Diario[] {
    return this.getData().diarios.filter((d: Diario) => d.professor_id === professorId || d.professorId === professorId);
  }

  createDiario(diario: Omit<Diario, 'id' | 'created_at' | 'updated_at'>): Diario {
    const data = this.getData();
    const newDiario: Diario = {
      ...diario,
      id: this.getNextId(data.diarios),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.diarios.push(newDiario);
    this.saveData(data);
    return newDiario;
  }

  updateDiario(id: number, updates: Partial<Diario>): Diario | null {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index === -1) return null;
    data.diarios[index] = { ...data.diarios[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.diarios[index];
  }

  deleteDiario(id: number): void {
    const data = this.getData();
    const index = data.diarios.findIndex((d: Diario) => d.id === id);
    if (index !== -1) {
      data.diario_alunos = data.diario_alunos.filter((da: DiarioAluno) => da.diario_id !== id);
      data.diarios.splice(index, 1);
      this.saveData(data);
    }
  }

  // AULAS
  getAulasByDiario(diarioId: number): Aula[] {
    return this.getData().aulas.filter((a: Aula) => a.diario_id === diarioId || a.diarioId === diarioId);
  }

  createAula(aula: Omit<Aula, 'id' | 'created_at' | 'updated_at'>): Aula {
    const data = this.getData();
    const newAula: Aula = {
      ...aula,
      id: this.getNextId(data.aulas),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.aulas.push(newAula);
    this.saveData(data);
    return newAula;
  }

  updateAula(id: number, updates: Partial<Aula>): Aula | null {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index === -1) return null;
    data.aulas[index] = { ...data.aulas[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.aulas[index];
  }

  deleteAula(id: number): void {
    const data = this.getData();
    const index = data.aulas.findIndex((a: Aula) => a.id === id);
    if (index !== -1) {
      data.aulas.splice(index, 1);
      this.saveData(data);
    }
  }

  // PRESENÇAS
  getPresencasByAula(aulaId: number): Presenca[] {
    return this.getData().presencas.filter((p: Presenca) => p.aula_id === aulaId || p.aulaId === aulaId);
  }

  getPresencasByAluno(alunoId: number): Presenca[] {
    return this.getData().presencas.filter((p: Presenca) => p.aluno_id === alunoId || p.alunoId === alunoId);
  }

  savePresencas(presencas: Omit<Presenca, 'id'>[]): Presenca[] {
    const data = this.getData();
    const aulaId = presencas[0]?.aula_id || presencas[0]?.aulaId;

    if (aulaId) {
      data.presencas = data.presencas.filter((p: Presenca) => (p.aula_id !== aulaId && p.aulaId !== aulaId));
    }

    const newPresencas = presencas.map((p: any) => ({
      ...p,
      id: this.getNextId(data.presencas),
      aula_id: p.aula_id || p.aulaId
    }));

    data.presencas.push(...newPresencas);
    this.saveData(data);
    return newPresencas;
  }

  // AVALIAÇÕES
  getAvaliacoesByDiario(diarioId: number): Avaliacao[] {
    return this.getData().avaliacoes.filter((a: Avaliacao) => a.diario_id === diarioId || a.diarioId === diarioId);
  }

  createAvaliacao(avaliacao: Omit<Avaliacao, 'id' | 'created_at' | 'updated_at'>): Avaliacao {
    const data = this.getData();
    const newAvaliacao: Avaliacao = {
      ...avaliacao,
      id: this.getNextId(data.avaliacoes),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.avaliacoes.push(newAvaliacao);
    this.saveData(data);
    return newAvaliacao;
  }

  updateAvaliacao(id: number, updates: Partial<Avaliacao>): Avaliacao | null {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index === -1) return null;
    data.avaliacoes[index] = { ...data.avaliacoes[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.avaliacoes[index];
  }

  deleteAvaliacao(id: number): void {
    const data = this.getData();
    const index = data.avaliacoes.findIndex((a: Avaliacao) => a.id === id);
    if (index !== -1) {
      data.avaliacoes.splice(index, 1);
      this.saveData(data);
    }
  }

  // NOTAS
  getNotasByAvaliacao(avaliacaoId: number): Nota[] {
    return this.getData().notas.filter((n: Nota) => n.avaliacao_id === avaliacaoId || n.avaliacaoId === avaliacaoId);
  }

  getNotasByAluno(alunoId: number): Nota[] {
    return this.getData().notas.filter((n: Nota) => n.aluno_id === alunoId || n.alunoId === alunoId);
  }

  saveNotas(notas: Omit<Nota, 'id'>[]): Nota[] {
    const data = this.getData();
    const avaliacaoId = notas[0]?.avaliacao_id || notas[0]?.avaliacaoId;

    if (avaliacaoId) {
      data.notas = data.notas.filter((n: Nota) => (n.avaliacao_id !== avaliacaoId && n.avaliacaoId !== avaliacaoId));
    }

    const newNotas = notas.map((n: any) => ({
      ...n,
      id: this.getNextId(data.notas),
      avaliacao_id: n.avaliacao_id || n.avaliacaoId,
      aluno_id: n.aluno_id || n.alunoId
    }));

    data.notas.push(...newNotas);
    this.saveData(data);
    return newNotas;
  }

  // OCORRÊNCIAS
  getOcorrenciasByAluno(alunoId: number): Ocorrencia[] {
    return this.getData().ocorrencias.filter((o: Ocorrencia) => o.aluno_id === alunoId || o.alunoId === alunoId);
  }

  getOcorrencias(): Ocorrencia[] {
    return this.getData().ocorrencias;
  }

  createOcorrencia(ocorrencia: Omit<Ocorrencia, 'id' | 'created_at' | 'updated_at'>): Ocorrencia {
    const data = this.getData();
    const newOcorrencia: Ocorrencia = {
      ...ocorrencia,
      id: this.getNextId(data.ocorrencias),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.ocorrencias.push(newOcorrencia);
    this.saveData(data);
    return newOcorrencia;
  }

  updateOcorrencia(id: number, updates: Partial<Ocorrencia>): Ocorrencia | null {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index === -1) return null;
    data.ocorrencias[index] = { ...data.ocorrencias[index], ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.ocorrencias[index];
  }

  deleteOcorrencia(id: number): void {
    const data = this.getData();
    const index = data.ocorrencias.findIndex((o: Ocorrencia) => o.id === id);
    if (index !== -1) {
      data.ocorrencias.splice(index, 1);
      this.saveData(data);
    }
  }

  // COMUNICADOS
  getComunicados(): Comunicado[] {
    return this.getData().comunicados;
  }

  createComunicado(comunicado: Omit<Comunicado, 'id' | 'created_at' | 'updated_at'>): Comunicado {
    const data = this.getData();
    const newComunicado: Comunicado = {
      ...comunicado,
      id: this.getNextId(data.comunicados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.comunicados.push(newComunicado);
    this.saveData(data);
    return newComunicado;
  }

  updateComunicado(id: number, updates: Partial<Comunicado>): Comunicado | null {
    const data = this.getData();
    const index = data.comunicados.findIndex((c: Comunicado) => c.id === id);
    if (index === -1) return null;
    data.comunicados[index] = { ...data.comunicados[index], ...updates, updated_at: new Date().toISOString() };
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

  // RECADOS
  getRecados(): Recado[] {
    return this.getData().recados || [];
  }

  getRecadosByProfessor(professorId: number): Recado[] {
    const data = this.getData();
    return (data.recados || []).filter((r: Recado) => r.professor_id === professorId || r.professorId === professorId);
  }

  getRecadosByTurma(turmaId: number): Recado[] {
    const data = this.getData();
    return (data.recados || []).filter((r: Recado) => (r.turma_id === turmaId || r.turmaId === turmaId) && !r.aluno_id && !r.alunoId);
  }

  getRecadosByAluno(alunoId: number): Recado[] {
    const data = this.getData();
    return (data.recados || []).filter((r: Recado) => r.aluno_id === alunoId || r.alunoId === alunoId);
  }

  createRecado(recado: Omit<Recado, 'id' | 'created_at' | 'updated_at'>): Recado {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
    }

    const newRecado: Recado = {
      ...recado,
      id: this.getNextId(data.recados),
      professor_id: recado.professor_id || recado.professorId || 0,
      professor_nome: recado.professor_nome || recado.professorNome || '',
      turma_id: recado.turma_id || recado.turmaId || 0,
      turma_nome: recado.turma_nome || recado.turmaNome || '',
      aluno_id: recado.aluno_id || recado.alunoId,
      aluno_nome: recado.aluno_nome || recado.alunoNome,
      data_envio: recado.data_envio || recado.dataEnvio || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.recados.push(newRecado);
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoCreated', { detail: newRecado }));

    return newRecado;
  }

  updateRecado(id: number, updates: Partial<Recado>): Recado | null {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
      return null;
    }

    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) return null;

    data.recados[index] = { 
      ...data.recados[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoUpdated', { detail: data.recados[index] }));

    return data.recados[index];
  }

  deleteRecado(id: number): boolean {
    const data = this.getData();

    if (!Array.isArray(data.recados)) {
      data.recados = [];
      return false;
    }

    const index = data.recados.findIndex((r: Recado) => r.id === id);
    if (index === -1) return false;

    data.recados.splice(index, 1);
    this.saveData(data);

    window.dispatchEvent(new CustomEvent('recadoDeleted', { detail: { id } }));

    return true;
  }

  // CÁLCULOS
  calcularMediaAluno(alunoId: number, diarioId: number): number {
    const data = this.getData();
    const avaliacoes = data.avaliacoes.filter((a: Avaliacao) => a.diario_id === diarioId || a.diarioId === diarioId);
    const notas = data.notas.filter((n: Nota) => n.aluno_id === alunoId || n.alunoId === alunoId);

    let somaNotas = 0;
    let somaPesos = 0;

    avaliacoes.forEach((avaliacao: Avaliacao) => {
      const nota = notas.find((n: Nota) => n.avaliacao_id === avaliacao.id || n.avaliacaoId === avaliacao.id);
      if (nota) {
        somaNotas += nota.valor * avaliacao.peso;
        somaPesos += avaliacao.peso;
      }
    });

    return somaPesos > 0 ? somaNotas / somaPesos : 0;
  }

  // VÍNCULOS
  vincularAlunoAoDiario(diarioId: number, alunoId: number): void {
    const data = this.getData();
    const newVinculo: DiarioAluno = {
      id: this.getNextId(data.diario_alunos),
      diario_id: diarioId,
      aluno_id: alunoId
    };
    data.diario_alunos.push(newVinculo);
    this.saveData(data);
  }

  desvincularAlunoDoDiario(diarioId: number, alunoId: number): void {
    const data = this.getData();
    const index = data.diario_alunos.findIndex((da: DiarioAluno) => da.diario_id === diarioId && da.aluno_id === alunoId);
    if (index !== -1) {
      data.diario_alunos.splice(index, 1);
      this.saveData(data);
    }
  }

  getDiarioAlunos(): DiarioAluno[] {
    return this.getData().diario_alunos;
  }

  getProfessoresByDisciplina(disciplinaId: number): number[] {
    return [];
  }

  entregarDiario(diarioId: number, usuarioId: number): boolean {
    return true;
  }

  devolverDiario(diarioId: number, usuarioId: number, observacao?: string): boolean {
    return true;
  }

  finalizarDiario(diarioId: number, usuarioId: number): boolean {
    return true;
  }

  solicitarDevolucaoDiario(diarioId: number, usuarioId: number, comentario: string): boolean {
    return true;
  }

  professorPodeEditarDiario(diarioId: number, professorId: number): boolean {
    return true;
  }

  coordenadorPodeGerenciarDiario(diarioId: number): { canDevolver: boolean; canFinalizar: boolean } {
    return { canDevolver: true, canFinalizar: true };
  }
}

export const supabaseService = new SupabaseService();
