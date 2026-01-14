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

export type TurnoTurma = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';

export interface Turma {
  id: number;
  nome: string;
  ano: number;
  turno: TurnoTurma;
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
  contato?: string;
  data_nascimento?: string;
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
  data_admissao?: string;
  situacao?: string;
  observacoes?: string;
  foto?: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: number;
  nome: string;
  email?: string;
  turma_id: number;
  turmaId?: number;
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
  diarioId?: number;
  aluno_id: number;
  alunoId?: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface Ocorrencia {
  id: number;
  aluno_id: number;
  alunoId?: number;
  professor_id?: number;
  professorId?: number;
  data: string;
  tipo: string;
  descricao: string;
  created_at: string;
  updated_at: string;
}

export interface Comunicado {
  id: number;
  titulo: string;
  mensagem: string;
  data_envio: string;
  dataEnvio?: string;
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

const nowIso = () => new Date().toISOString();

function withCamel<T extends Record<string, any>>(row: T): T {
  const r: any = { ...row };

  if (r.turma_id !== undefined) r.turmaId = r.turma_id;
  if (r.disciplina_id !== undefined) r.disciplinaId = r.disciplina_id;
  if (r.professor_id !== undefined) r.professorId = r.professor_id;
  if (r.aluno_id !== undefined) r.alunoId = r.aluno_id;
  if (r.diario_id !== undefined) r.diarioId = r.diario_id;
  if (r.avaliacao_id !== undefined) r.avaliacaoId = r.avaliacao_id;
  if (r.aula_id !== undefined) r.aulaId = r.aula_id;

  if (r.data_inicio !== undefined) r.dataInicio = r.data_inicio;
  if (r.data_termino !== undefined) r.dataTermino = r.data_termino;

  if (r.data_envio !== undefined) r.dataEnvio = r.data_envio;

  if (r.professor_nome !== undefined) r.professorNome = r.professor_nome;
  if (r.turma_nome !== undefined) r.turmaNome = r.turma_nome;
  if (r.aluno_nome !== undefined) r.alunoNome = r.aluno_nome;

  if (r.carga_horaria !== undefined) r.cargaHoraria = r.carga_horaria;

  return r;
}

class SupabaseService {
  private dispatchDataUpdated(type: string) {
    window.dispatchEvent(
      new CustomEvent('dataUpdated', { detail: { type, timestamp: Date.now() } })
    );
  }

  // USUÁRIOS
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Usuario[];
  }

  async createUsuario(
    usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>,
    senha?: string
  ): Promise<Usuario> {
    try {
      // Se não passou senha, gera uma aleatória
      if (!senha) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
        senha = '';
        for (let i = 0; i < 12; i++) {
          senha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }

      // Criar registro na tabela usuarios
      const payload: any = {
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        senha: senha,
        aluno_id: usuario.aluno_id ?? undefined,
        professor_id: usuario.professor_id ?? undefined,
        ativo: usuario.ativo ?? true
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      this.dispatchDataUpdated('usuarios');
      return data as Usuario;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(`Falha ao criar usuário: ${error.message}`);
    }
  }

  async updateUsuario(id: number, updates: Partial<Usuario>): Promise<Usuario | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.papel !== undefined) payload.papel = updates.papel;
    if (updates.aluno_id !== undefined) payload.aluno_id = updates.aluno_id;
    if (updates.professor_id !== undefined) payload.professor_id = updates.professor_id;
    if (updates.ativo !== undefined) payload.ativo = updates.ativo;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('usuarios');
    return (data ?? null) as Usuario | null;
  }

  async deleteUsuario(id: number): Promise<void> {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
  }

  // TURMAS
  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Turma[];
  }

  async getTurmaById(id: number): Promise<Turma | null> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? (withCamel(data) as Turma) : null;
  }

  async createTurma(
    turma: Omit<Turma, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Turma> {
    const payload: any = {
      nome: turma.nome,
      ano: turma.ano,
      turno: turma.turno
    };

    const { data, error } = await supabase
      .from('turmas')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('turmas');
    return withCamel(data) as Turma;
  }

  async updateTurma(id: number, updates: Partial<Turma>): Promise<Turma | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.ano !== undefined) payload.ano = updates.ano;
    if (updates.turno !== undefined) payload.turno = updates.turno;
    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('turmas')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('turmas');
    return data ? (withCamel(data) as Turma) : null;
  }

  async deleteTurma(id: number): Promise<void> {
    const { error } = await supabase.from('turmas').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('turmas');
  }

  // DISCIPLINAS
  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Disciplina[];
  }

  async getDisciplinaById(id: number): Promise<Disciplina | null> {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? (withCamel(data) as Disciplina) : null;
  }

  async createDisciplina(
    disciplina: Omit<Disciplina, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Disciplina> {
    const payload: any = {
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      carga_horaria: disciplina.carga_horaria ?? disciplina.cargaHoraria ?? 0
    };

    const { data, error } = await supabase
      .from('disciplinas')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('disciplinas');
    return withCamel(data) as Disciplina;
  }

  async updateDisciplina(id: number, updates: Partial<Disciplina>): Promise<Disciplina | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.codigo !== undefined) payload.codigo = updates.codigo;
    if (updates.carga_horaria !== undefined) payload.carga_horaria = updates.carga_horaria;
    if (updates.cargaHoraria !== undefined) payload.carga_horaria = updates.cargaHoraria;
    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('disciplinas')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('disciplinas');
    return data ? (withCamel(data) as Disciplina) : null;
  }

  async deleteDisciplina(id: number): Promise<void> {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('disciplinas');
  }

  // PROFESSORES
  async getProfessores(): Promise<Professor[]> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Professor[];
  }

  async getProfessorById(id: number): Promise<Professor | null> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Professor | null;
  }

  async createProfessor(
    professor: Omit<Professor, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Professor> {
    const payload: any = {
      nome: professor.nome,
      email: professor.email,
      contato: professor.contato ?? null,
      data_nascimento: professor.data_nascimento ?? null,
      cpf: professor.cpf ?? null,
      rg: professor.rg ?? null,
      sexo: professor.sexo ?? null,
      endereco: professor.endereco ?? null,
      bairro: professor.bairro ?? null,
      cidade: professor.cidade ?? null,
      cep: professor.cep ?? null,
      estado: professor.estado ?? null,
      formacao: professor.formacao ?? null,
      especializacao: professor.especializacao ?? null,
      registro: professor.registro ?? null,
      data_admissao: professor.data_admissao ?? null,
      situacao: professor.situacao ?? null,
      observacoes: professor.observacoes ?? null,
      foto: professor.foto ?? null,
    };

    const { data, error } = await supabase
      .from('professores')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('professores');
    return data as Professor;
  }

  async updateProfessor(id: number, updates: Partial<Professor>): Promise<Professor | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.contato !== undefined) payload.contato = updates.contato;
    if (updates.data_nascimento !== undefined) payload.data_nascimento = updates.data_nascimento;
    if (updates.cpf !== undefined) payload.cpf = updates.cpf;
    if (updates.rg !== undefined) payload.rg = updates.rg;
    if (updates.sexo !== undefined) payload.sexo = updates.sexo;
    if (updates.endereco !== undefined) payload.endereco = updates.endereco;
    if (updates.bairro !== undefined) payload.bairro = updates.bairro;
    if (updates.cidade !== undefined) payload.cidade = updates.cidade;
    if (updates.cep !== undefined) payload.cep = updates.cep;
    if (updates.estado !== undefined) payload.estado = updates.estado;
    if (updates.formacao !== undefined) payload.formacao = updates.formacao;
    if (updates.especializacao !== undefined) payload.especializacao = updates.especializacao;
    if (updates.registro !== undefined) payload.registro = updates.registro;
    if (updates.data_admissao !== undefined) payload.data_admissao = updates.data_admissao;
    if (updates.situacao !== undefined) payload.situacao = updates.situacao;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;
    if (updates.foto !== undefined) payload.foto = updates.foto;
    
    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('professores')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('professores');
    return (data ?? null) as Professor | null;
  }

  async deleteProfessor(id: number): Promise<void> {
    const { error } = await supabase.from('professores').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('professores');
  }

  // ALUNOS
  async getAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Aluno[];
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Aluno[];
  }

  async getAlunosByDiario(diarioId: number): Promise<Aluno[]> {
    const { data: vinculos, error: e1 } = await supabase
      .from('diario_alunos')
      .select('aluno_id')
      .eq('diario_id', diarioId);

    if (e1) throw e1;

    console.log('🔍 DEBUG getAlunosByDiario:');
console.log('  vinculos:', vinculos);
console.log('  ids extraídos:', ids);
    if (ids.length === 0) return [];

    const { data: alunos, error: e2 } = await supabase
      .from('alunos')
      .select('*')
      .in('id', ids)
      .order('id', { ascending: true });

    if (e2) throw e2;

    return (alunos ?? []).map(withCamel) as Aluno[];
  }

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Promise<Aluno> {
    const payload: any = {
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email ?? null,
      turma_id: aluno.turma_id ?? aluno.turmaId
    };

    const { data, error } = await supabase
      .from('alunos')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('alunos');
    return withCamel(data) as Aluno;
  }

  async updateAluno(id: number, updates: Partial<Aluno>): Promise<Aluno | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.turma_id !== undefined) payload.turma_id = updates.turma_id;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId;
    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('alunos')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('alunos');
    return data ? (withCamel(data) as Aluno) : null;
  }

  async deleteAluno(id: number): Promise<void> {
    const { error } = await supabase.from('alunos').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('alunos');
  }

  // DIÁRIOS
  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase
      .from('diarios')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Diario[];
  }

  async getDiariosByProfessor(professorId: number): Promise<Diario[]> {
    const { data, error } = await supabase
      .from('diarios')
      .select('*')
      .eq('professor_id', professorId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Diario[];
  }

  async getDiarioById(id: number): Promise<Diario | null> {
    const { data, error } = await supabase
      .from('diarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? (withCamel(data) as Diario) : null;
  }

  async createDiario(diario: Omit<Diario, 'id' | 'created_at' | 'updated_at'>): Promise<Diario> {
    const payload: any = {
      nome: diario.nome,
      disciplina_id: diario.disciplina_id ?? diario.disciplinaId,
      turma_id: diario.turma_id ?? diario.turmaId,
      professor_id: diario.professor_id ?? diario.professorId,
      bimestre: diario.bimestre,
      data_inicio: diario.data_inicio ?? diario.dataInicio,
      data_termino: diario.data_termino ?? diario.dataTermino,
      status: diario.status ?? 'PENDENTE',
      solicitacao_devolucao: diario.solicitacao_devolucao ?? null,
      historico_status: diario.historico_status ?? null
    };

    const { data, error } = await supabase
      .from('diarios')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('diarios');
    return withCamel(data) as Diario;
  }

  async updateDiario(id: number, updates: Partial<Diario>): Promise<Diario | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.disciplina_id !== undefined) payload.disciplina_id = updates.disciplina_id;
    if (updates.disciplinaId !== undefined) payload.disciplina_id = updates.disciplinaId;
    if (updates.turma_id !== undefined) payload.turma_id = updates.turma_id;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId;
    if (updates.professor_id !== undefined) payload.professor_id = updates.professor_id;
    if (updates.professorId !== undefined) payload.professor_id = updates.professorId;
    if (updates.bimestre !== undefined) payload.bimestre = updates.bimestre;
    if (updates.data_inicio !== undefined) payload.data_inicio = updates.data_inicio;
    if (updates.dataInicio !== undefined) payload.data_inicio = updates.dataInicio;
    if (updates.data_termino !== undefined) payload.data_termino = updates.data_termino;
    if (updates.dataTermino !== undefined) payload.data_termino = updates.dataTermino;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.solicitacao_devolucao !== undefined) payload.solicitacao_devolucao = updates.solicitacao_devolucao;
    if (updates.historico_status !== undefined) payload.historico_status = updates.historico_status;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('diarios')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('diarios');
    return data ? (withCamel(data) as Diario) : null;
  }

  async deleteDiario(id: number): Promise<void> {
    const { error } = await supabase.from('diarios').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
  }

  // AULAS
  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('diario_id', diarioId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Aula[];
  }

  async createAula(aula: Omit<Aula, 'id' | 'created_at' | 'updated_at'>): Promise<Aula> {
    const payload: any = {
      diario_id: aula.diario_id ?? aula.diarioId,
      data: aula.data,
      horario: aula.horario ?? null,
      conteudo: aula.conteudo ?? null,
      observacoes: aula.observacoes ?? null
    };

    const { data, error } = await supabase
      .from('aulas')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('aulas');
    return withCamel(data) as Aula;
  }

  async updateAula(id: number, updates: Partial<Aula>): Promise<Aula | null> {
    const payload: any = {};
    if (updates.diario_id !== undefined) payload.diario_id = updates.diario_id;
    if (updates.diarioId !== undefined) payload.diario_id = updates.diarioId;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.horario !== undefined) payload.horario = updates.horario;
    if (updates.conteudo !== undefined) payload.conteudo = updates.conteudo;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('aulas')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('aulas');
    return data ? (withCamel(data) as Aula) : null;
  }

  async deleteAula(id: number): Promise<void> {
    const { error } = await supabase.from('aulas').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('aulas');
  }

  // PRESENÇAS
  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('aula_id', aulaId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Presenca[];
  }

  async getPresencasByAluno(alunoId: number): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Presenca[];
  }

  async savePresencas(presencas: Omit<Presenca, 'id'>[]): Promise<void> {
    if (!presencas || presencas.length === 0) return;

    const aulaIds = Array.from(new Set(presencas.map(p => p.aula_id ?? p.aulaId).filter(Boolean)));

    if (aulaIds.length > 0) {
      const { error: delError } = await supabase
        .from('presencas')
        .delete()
        .in('aula_id', aulaIds as number[]);

      if (delError) throw delError;
    }

    const payload = presencas.map(p => ({
      aula_id: p.aula_id ?? p.aulaId,
      aluno_id: p.aluno_id ?? p.alunoId,
      status: p.status
    }));

    const { error } = await supabase.from('presencas').insert(payload);
    if (error) throw error;

    this.dispatchDataUpdated('presencas');
  }

  // AVALIAÇÕES
  async getAvaliacoesByDiario(diarioId: number): Promise<Avaliacao[]> {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('diario_id', diarioId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Avaliacao[];
  }

  async createAvaliacao(
    avaliacao: Omit<Avaliacao, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Avaliacao> {
    const payload: any = {
      diario_id: avaliacao.diario_id ?? avaliacao.diarioId,
      titulo: avaliacao.titulo,
      data: avaliacao.data,
      tipo: avaliacao.tipo,
      peso: avaliacao.peso,
      bimestre: avaliacao.bimestre ?? null
    };

    const { data, error } = await supabase
      .from('avaliacoes')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('avaliacoes');
    return withCamel(data) as Avaliacao;
  }

  async updateAvaliacao(id: number, updates: Partial<Avaliacao>): Promise<Avaliacao | null> {
    const payload: any = {};
    if (updates.diario_id !== undefined) payload.diario_id = updates.diario_id;
    if (updates.diarioId !== undefined) payload.diario_id = updates.diarioId;
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.peso !== undefined) payload.peso = updates.peso;
    if (updates.bimestre !== undefined) payload.bimestre = updates.bimestre;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('avaliacoes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('avaliacoes');
    return data ? (withCamel(data) as Avaliacao) : null;
  }

  async deleteAvaliacao(id: number): Promise<void> {
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('avaliacoes');
  }

  // NOTAS
  async getNotasByAvaliacao(avaliacaoId: number): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('avaliacao_id', avaliacaoId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Nota[];
  }

  async getNotasByAluno(alunoId: number): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Nota[];
  }

  async saveNotas(notas: Omit<Nota, 'id'>[]): Promise<void> {
    if (!notas || notas.length === 0) return;

    const avaliacaoIds = Array.from(
      new Set(notas.map(n => n.avaliacao_id ?? n.avaliacaoId).filter(Boolean))
    );

    if (avaliacaoIds.length > 0) {
      const { error: delError } = await supabase
        .from('notas')
        .delete()
        .in('avaliacao_id', avaliacaoIds as number[]);

      if (delError) throw delError;
    }

    const payload = notas.map(n => ({
      avaliacao_id: n.avaliacao_id ?? n.avaliacaoId,
      aluno_id: n.aluno_id ?? n.alunoId,
      valor: n.valor
    }));

    const { error } = await supabase.from('notas').insert(payload);
    if (error) throw error;

    this.dispatchDataUpdated('notas');
  }

  // OCORRÊNCIAS
  async getOcorrencias(): Promise<Ocorrencia[]> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Ocorrencia[];
  }

  async getOcorrenciasByAluno(alunoId: number): Promise<Ocorrencia[]> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Ocorrencia[];
  }

  async createOcorrencia(
    ocorrencia: Omit<Ocorrencia, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Ocorrencia> {
    const payload: any = {
      aluno_id: ocorrencia.aluno_id ?? ocorrencia.alunoId,
      professor_id: ocorrencia.professor_id ?? ocorrencia.professorId ?? null,
      data: ocorrencia.data,
      tipo: ocorrencia.tipo,
      descricao: ocorrencia.descricao
    };

    const { data, error } = await supabase
      .from('ocorrencias')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('ocorrencias');
    return withCamel(data) as Ocorrencia;
  }

  async updateOcorrencia(id: number, updates: Partial<Ocorrencia>): Promise<Ocorrencia | null> {
    const payload: any = {};
    if (updates.aluno_id !== undefined) payload.aluno_id = updates.aluno_id;
    if (updates.alunoId !== undefined) payload.aluno_id = updates.alunoId;
    if (updates.professor_id !== undefined) payload.professor_id = updates.professor_id;
    if (updates.professorId !== undefined) payload.professor_id = updates.professorId;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.descricao !== undefined) payload.descricao = updates.descricao;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('ocorrencias')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('ocorrencias');
    return data ? (withCamel(data) as Ocorrencia) : null;
  }

  async deleteOcorrencia(id: number): Promise<void> {
    const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('ocorrencias');
  }

  // COMUNICADOS
  async getComunicados(): Promise<Comunicado[]> {
    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Comunicado[];
  }

  async createComunicado(
    comunicado: Omit<Comunicado, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Comunicado> {
    const payload: any = {
      titulo: comunicado.titulo,
      mensagem: comunicado.mensagem,
      data_envio: comunicado.data_envio ?? comunicado.dataEnvio ?? nowIso()
    };

    const { data, error } = await supabase
      .from('comunicados')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('comunicados');
    return withCamel(data) as Comunicado;
  }

  async updateComunicado(id: number, updates: Partial<Comunicado>): Promise<Comunicado | null> {
    const payload: any = {};
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.mensagem !== undefined) payload.mensagem = updates.mensagem;
    if (updates.data_envio !== undefined) payload.data_envio = updates.data_envio;
    if (updates.dataEnvio !== undefined) payload.data_envio = updates.dataEnvio;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('comunicados')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    this.dispatchDataUpdated('comunicados');
    return data ? (withCamel(data) as Comunicado) : null;
  }

  async deleteComunicado(id: number): Promise<void> {
    const { error } = await supabase.from('comunicados').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('comunicados');
  }

  // RECADOS
  async getRecados(): Promise<Recado[]> {
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Recado[];
  }

  async getRecadosByProfessor(professorId: number): Promise<Recado[]> {
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .eq('professor_id', professorId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Recado[];
  }

  async getRecadosByTurma(turmaId: number): Promise<Recado[]> {
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .eq('turma_id', turmaId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Recado[];
  }

  async getRecadosByAluno(alunoId: number): Promise<Recado[]> {
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Recado[];
  }

  async createRecado(
    recado: Omit<Recado, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Recado> {
    const payload: any = {
      titulo: recado.titulo,
      mensagem: recado.mensagem,
      professor_id: recado.professor_id ?? recado.professorId,
      professor_nome: recado.professor_nome ?? recado.professorNome ?? '',
      turma_id: recado.turma_id ?? recado.turmaId,
      turma_nome: recado.turma_nome ?? recado.turmaNome ?? '',
      aluno_id: recado.aluno_id ?? recado.alunoId ?? null,
      aluno_nome: recado.aluno_nome ?? recado.alunoNome ?? null,
      data_envio: recado.data_envio ?? recado.dataEnvio ?? new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('recados')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    window.dispatchEvent(new CustomEvent('recadoCreated', { detail: withCamel(data) }));
    this.dispatchDataUpdated('recados');
    return withCamel(data) as Recado;
  }

  async updateRecado(id: number, updates: Partial<Recado>): Promise<Recado | null> {
    const payload: any = {};
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.mensagem !== undefined) payload.mensagem = updates.mensagem;

    if (updates.professor_id !== undefined) payload.professor_id = updates.professor_id;
    if (updates.professorId !== undefined) payload.professor_id = updates.professorId;

    if (updates.professor_nome !== undefined) payload.professor_nome = updates.professor_nome;
    if (updates.professorNome !== undefined) payload.professor_nome = updates.professorNome;

    if (updates.turma_id !== undefined) payload.turma_id = updates.turma_id;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId;

    if (updates.turma_nome !== undefined) payload.turma_nome = updates.turma_nome;
    if (updates.turmaNome !== undefined) payload.turma_nome = updates.turmaNome;

    if (updates.aluno_id !== undefined) payload.aluno_id = updates.aluno_id;
    if (updates.alunoId !== undefined) payload.aluno_id = updates.alunoId;

    if (updates.aluno_nome !== undefined) payload.aluno_nome = updates.aluno_nome;
    if (updates.alunoNome !== undefined) payload.aluno_nome = updates.alunoNome;

    if (updates.data_envio !== undefined) payload.data_envio = updates.data_envio;
    if (updates.dataEnvio !== undefined) payload.data_envio = updates.dataEnvio;

    payload.updated_at = nowIso();

    const { data, error } = await supabase
      .from('recados')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    if (data) {
      window.dispatchEvent(new CustomEvent('recadoUpdated', { detail: withCamel(data) }));
    }

    this.dispatchDataUpdated('recados');
    return data ? (withCamel(data) as Recado) : null;
  }

  async deleteRecado(id: number): Promise<boolean> {
    const { error } = await supabase.from('recados').delete().eq('id', id);
    if (error) throw error;

    window.dispatchEvent(new CustomEvent('recadoDeleted', { detail: { id } }));
    this.dispatchDataUpdated('recados');
    return true;
  }

  // MÉDIA
  async calcularMediaAluno(diarioId: number, alunoId: number): Promise<number> {
    const avaliacoes = await this.getAvaliacoesByDiario(diarioId);
    if (!avaliacoes.length) return 0;

    const notasAluno = await this.getNotasByAluno(alunoId);

    let somaPesos = 0;
    let somaPonderada = 0;

    for (const av of avaliacoes) {
      const nota = notasAluno.find(n => (n.avaliacao_id ?? n.avaliacaoId) === av.id);
      if (!nota) continue;

      const peso = av.peso ?? 1;
      somaPesos += peso;
      somaPonderada += (nota.valor ?? 0) * peso;
    }

    if (somaPesos === 0) return 0;
    return Number((somaPonderada / somaPesos).toFixed(2));
  }

  // VÍNCULOS DIÁRIO-ALUNO
  async vincularAlunoAoDiario(diarioId: number, alunoId: number): Promise<DiarioAluno> {
    const payload = { diario_id: diarioId, aluno_id: alunoId };

    const { data, error } = await supabase
      .from('diario_alunos')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    this.dispatchDataUpdated('diario_alunos');
    return withCamel(data) as DiarioAluno;
  }

  async desvincularAlunoDoDiario(diarioId: number, alunoId: number): Promise<void> {
    const { error } = await supabase
      .from('diario_alunos')
      .delete()
      .eq('diario_id', diarioId)
      .eq('aluno_id', alunoId);

    if (error) throw error;

    this.dispatchDataUpdated('diario_alunos');
  }

  async getDiarioAlunos(): Promise<DiarioAluno[]> {
    const { data, error } = await supabase
      .from('diario_alunos')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as DiarioAluno[];
  }

  // PROFESSORES POR DISCIPLINA (tabela professor_disciplinas) - CORRIGIDO PARA RETORNAR IDs
  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('professor_id')
      .eq('disciplina_id', disciplinaId);

    if (error) throw error;

    const ids = (data ?? []).map((row: any) => row.professor_id).filter((id: any) => id !== null && id !== undefined);
    console.log('getProfessoresByDisciplina - disciplinaId:', disciplinaId);
    console.log('getProfessoresByDisciplina - resultado bruto:', data);
    console.log('getProfessoresByDisciplina - IDs extraídos:', ids);
    return ids as number[];
  }

  // STATUS DIÁRIO
  private pushHistoricoStatus(diario: Diario, novoStatus: Diario['status'], motivo?: string) {
    const historico = Array.isArray(diario.historico_status) ? [...diario.historico_status] : [];
    historico.push({
      status: novoStatus,
      motivo: motivo ?? null,
      at: nowIso()
    });
    return historico;
  }

  async entregarDiario(diarioId: number): Promise<Diario | null> {
    const diario = await this.getDiarioById(diarioId);
    if (!diario) return null;

    const historico_status = this.pushHistoricoStatus(diario, 'ENTREGUE');
    return await this.updateDiario(diarioId, { status: 'ENTREGUE', historico_status });
  }

  async devolverDiario(diarioId: number, usuarioId: number, motivo?: string): Promise<boolean> {
    const diario = await this.getDiarioById(diarioId);
    if (!diario) return false;

    const historico_status = this.pushHistoricoStatus(diario, 'DEVOLVIDO', motivo);
    const resultado = await this.updateDiario(diarioId, {
      status: 'DEVOLVIDO',
      historico_status,
      solicitacao_devolucao: { comentario: motivo ?? 'Devolvido para revisão', dataSolicitacao: nowIso() }
    });
    return resultado !== null;
  }

  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    const diario = await this.getDiarioById(diarioId);
    if (!diario) return false;

    const historico_status = this.pushHistoricoStatus(diario, 'FINALIZADO');
    const resultado = await this.updateDiario(diarioId, { status: 'FINALIZADO', historico_status });
    return resultado !== null;
  }

  async solicitarDevolucaoDiario(diarioId: number, motivo: string): Promise<Diario | null> {
    const diario = await this.getDiarioById(diarioId);
    if (!diario) return null;

    return await this.updateDiario(diarioId, {
      solicitacao_devolucao: { motivo, at: nowIso() }
    });
  }

  professorPodeEditarDiario(diario: Diario, professorId: number): boolean {
    const pid = diario.professor_id ?? diario.professorId;
    if (pid !== professorId) return false;
    return diario.status === 'PENDENTE' || diario.status === 'DEVOLVIDO';
  }

  coordenadorPodeGerenciarDiario(diario: Diario): boolean {
    return true;
  }

  // PROFESSOR-DISCIPLINA
  async getVinculosProfessorDisciplina(): Promise<Array<{ professor_id: number; disciplina_id: number }>> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('professor_id, disciplina_id')
      .order('professor_id', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Array<{ professor_id: number; disciplina_id: number }>;
  }

  async vincularProfessorDisciplina(professorId: number, disciplinaId: number): Promise<void> {
    const payload = {
      professor_id: professorId,
      disciplina_id: disciplinaId
    };

    const { error } = await supabase
      .from('professor_disciplinas')
      .insert(payload);

    if (error) throw error;
    this.dispatchDataUpdated('professor_disciplinas');
  }

  async desvincularProfessorDisciplina(professorId: number, disciplinaId: number): Promise<void> {
    const { error } = await supabase
      .from('professor_disciplinas')
      .delete()
      .eq('professor_id', professorId)
      .eq('disciplina_id', disciplinaId);

    if (error) throw error;
    this.dispatchDataUpdated('professor_disciplinas');
  }

  async getDisciplinasByProfessor(professorId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('disciplina_id')
      .eq('professor_id', professorId);

    if (error) throw error;
    return (data ?? []).map((row: any) => row.disciplina_id);
  }
}

export const supabaseService = new SupabaseService();
