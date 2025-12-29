import { supabase } from '@/lib/supabaseClient';

// =============================================
// TIPOS ATUALIZADOS CONFORME BANCO DE DADOS
// =============================================

export interface Turma {
  id: number;
  nome: string;
  ano: number;
  turno: string;
  created_at?: string;
  updated_at?: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  carga_horaria: number;
  created_at?: string;
  updated_at?: string;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Aluno {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  matricula: string;
  turma_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  aluno_id?: number;
  professor_id?: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Diario {
  id: number;
  nome?: string;
  turma_id?: number;
  disciplina_id?: number;
  professor_id?: number;
  ano: number;
  bimestre?: number;
  dataInicio?: string;
  dataTermino?: string;
  status?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Aula {
  id: number;
  diario_id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  conteudo?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Presenca {
  id: number;
  aula_id: number;
  aluno_id: number;
  status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Avaliacao {
  id: number;
  diario_id: number;
  titulo: string;
  descricao?: string;
  data: string;
  tipo: string;
  peso: number;
  bimestre: number;
  created_at?: string;
  updated_at?: string;
}

export interface Nota {
  id: number;
  avaliacao_id: number;
  aluno_id: number;
  valor: number;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ocorrencia {
  id: number;
  aluno_id: number;
  diario_id?: number;
  tipo: 'disciplinar' | 'pedagogica' | 'elogio';
  data: string;
  descricao: string;
  acao_tomada?: string;
  created_at?: string;
  updated_at?: string;
}

// =============================================
// SERVIÇO SUPABASE
// =============================================

class SupabaseService {
  // TURMAS
  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase.from('turmas').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar turmas:', error);
      throw error;
    }
    return data || [];
  }

  async createTurma(turma: Omit<Turma, 'id' | 'created_at' | 'updated_at'>): Promise<Turma> {
    const { data, error } = await supabase.from('turmas').insert([turma]).select().single();
    if (error) throw error;
    return data;
  }

  async updateTurma(id: number, turma: Partial<Turma>): Promise<Turma> {
    const { data, error } = await supabase.from('turmas').update(turma).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteTurma(id: number): Promise<void> {
    const { error } = await supabase.from('turmas').delete().eq('id', id);
    if (error) throw error;
  }

  async getTurmaById(id: number): Promise<Turma | null> {
    const { data, error } = await supabase.from('turmas').select('*').eq('id', id).single();
    if (error) {
      console.error('Erro ao buscar turma:', error);
      return null;
    }
    return data;
  }

  // DISCIPLINAS
  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase.from('disciplinas').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar disciplinas:', error);
      throw error;
    }
    return data || [];
  }

  async createDisciplina(disciplina: Omit<Disciplina, 'id' | 'created_at' | 'updated_at'>): Promise<Disciplina> {
    const { data, error } = await supabase.from('disciplinas').insert([disciplina]).select().single();
    if (error) throw error;
    return data;
  }

  async updateDisciplina(id: number, disciplina: Partial<Disciplina>): Promise<Disciplina> {
    const { data, error } = await supabase.from('disciplinas').update(disciplina).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteDisciplina(id: number): Promise<void> {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) throw error;
  }

  async getDisciplinaById(id: number): Promise<Disciplina | null> {
    const { data, error } = await supabase.from('disciplinas').select('*').eq('id', id).single();
    if (error) {
      console.error('Erro ao buscar disciplina:', error);
      return null;
    }
    return data;
  }

  // PROFESSORES
  async getProfessores(): Promise<Professor[]> {
    const { data, error } = await supabase.from('professores').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar professores:', error);
      throw error;
    }
    return data || [];
  }

  async createProfessor(professor: Omit<Professor, 'id' | 'created_at' | 'updated_at'>): Promise<Professor> {
    const { data, error } = await supabase.from('professores').insert([professor]).select().single();
    if (error) throw error;
    return data;
  }

  async updateProfessor(id: number, professor: Partial<Professor>): Promise<Professor> {
    const { data, error } = await supabase.from('professores').update(professor).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteProfessor(id: number): Promise<void> {
    const { error } = await supabase.from('professores').delete().eq('id', id);
    if (error) throw error;
  }

  async getProfessorById(id: number): Promise<Professor | null> {
    const { data, error } = await supabase.from('professores').select('*').eq('id', id).single();
    if (error) {
      console.error('Erro ao buscar professor:', error);
      return null;
    }
    return data;
  }

  // ALUNOS
  async getAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase.from('alunos').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar alunos:', error);
      throw error;
    }
    return data || [];
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    const { data, error } = await supabase.from('alunos').select('*').eq('turma_id', turmaId).order('nome');
    if (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      throw error;
    }
    return data || [];
  }

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Promise<Aluno> {
    const { data, error } = await supabase.from('alunos').insert([aluno]).select().single();
    if (error) throw error;
    return data;
  }

  async updateAluno(id: number, aluno: Partial<Aluno>): Promise<Aluno> {
    const { data, error } = await supabase.from('alunos').update(aluno).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteAluno(id: number): Promise<void> {
    const { error } = await supabase.from('alunos').delete().eq('id', id);
    if (error) throw error;
  }

  // USUÁRIOS
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
    return data || [];
  }

  async createUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>, senha: string): Promise<Usuario> {
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select()
      .single();
    
    if (usuarioError) throw usuarioError;

    // Inserir senha
    const { error: senhaError } = await supabase
      .from('senhas')
      .insert([{ usuario_id: usuarioData.id, senha_hash: senha }]);
    
    if (senhaError) throw senhaError;

    return usuarioData;
  }

  async updateUsuario(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const { data, error } = await supabase.from('usuarios').update(usuario).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteUsuario(id: number): Promise<void> {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
  }

  // DIÁRIOS
  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase.from('diarios').select('*').order('id');
    if (error) {
      console.error('Erro ao buscar diários:', error);
      throw error;
    }
    return data || [];
  }

  async getDiariosByProfessor(professorId: number): Promise<Diario[]> {
    const { data, error } = await supabase.from('diarios').select('*').eq('professor_id', professorId);
    if (error) {
      console.error('Erro ao buscar diários do professor:', error);
      throw error;
    }
    return data || [];
  }

  async createDiario(diario: any): Promise<Diario> {
    const { data, error } = await supabase.from('diarios').insert([diario]).select().single();
    if (error) throw error;
    return data;
  }

  async updateDiario(id: number, diario: any): Promise<Diario> {
    const { data, error } = await supabase.from('diarios').update(diario).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteDiario(id: number): Promise<void> {
    const { error } = await supabase.from('diarios').delete().eq('id', id);
    if (error) throw error;
  }

  // Funções de controle de diário (BÁSICAS - só mudam status)
  async devolverDiario(diarioId: number, usuarioId: number, observacao?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('diarios')
        .update({ status: 'DEVOLVIDO' })
        .eq('id', diarioId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao devolver diário:', error);
      return false;
    }
  }

  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('diarios')
        .update({ status: 'FINALIZADO' })
        .eq('id', diarioId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao finalizar diário:', error);
      return false;
    }
  }

  coordenadorPodeGerenciarDiario(diarioId: number): { canDevolver: boolean; canFinalizar: boolean } {
    // Por enquanto retorna sempre true - implementação básica
    return { canDevolver: true, canFinalizar: true };
  }

  // DIÁRIO ALUNOS (Vincular alunos ao diário)
  async vincularAlunoAoDiario(diarioId: number, alunoId: number): Promise<void> {
    const { error } = await supabase
      .from('diario_alunos')
      .insert([{ diario_id: diarioId, aluno_id: alunoId }]);
    if (error) throw error;
  }

  async desvincularAlunoDoDiario(diarioId: number, alunoId: number): Promise<void> {
    const { error } = await supabase
      .from('diario_alunos')
      .delete()
      .eq('diario_id', diarioId)
      .eq('aluno_id', alunoId);
    if (error) throw error;
  }

  async getAlunosByDiario(diarioId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('diario_alunos')
      .select('aluno_id')
      .eq('diario_id', diarioId);
    if (error) {
      console.error('Erro ao buscar alunos do diário:', error);
      throw error;
    }
    return data?.map(d => d.aluno_id) || [];
  }

  // AULAS
  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('diario_id', diarioId)
      .order('data', { ascending: false });
    if (error) {
      console.error('Erro ao buscar aulas:', error);
      throw error;
    }
    return data || [];
  }

  async createAula(aula: Omit<Aula, 'id' | 'created_at' | 'updated_at'>): Promise<Aula> {
    const { data, error } = await supabase.from('aulas').insert([aula]).select().single();
    if (error) throw error;
    return data;
  }

  async updateAula(id: number, aula: Partial<Aula>): Promise<Aula> {
    const { data, error } = await supabase.from('aulas').update(aula).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteAula(id: number): Promise<void> {
    const { error } = await supabase.from('aulas').delete().eq('id', id);
    if (error) throw error;
  }

  // PRESENÇAS
  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    const { data, error } = await supabase.from('presencas').select('*').eq('aula_id', aulaId);
    if (error) {
      console.error('Erro ao buscar presenças:', error);
      throw error;
    }
    return data || [];
  }

  async getPresencasByAluno(alunoId: number): Promise<Presenca[]> {
    const { data, error } = await supabase.from('presencas').select('*').eq('aluno_id', alunoId);
    if (error) {
      console.error('Erro ao buscar presenças do aluno:', error);
      throw error;
    }
    return data || [];
  }

  async registrarPresenca(presenca: Omit<Presenca, 'id' | 'created_at' | 'updated_at'>): Promise<Presenca> {
    const { data, error } = await supabase.from('presencas').insert([presenca]).select().single();
    if (error) throw error;
    return data;
  }

  async updatePresenca(id: number, presenca: Partial<Presenca>): Promise<Presenca> {
    const { data, error } = await supabase.from('presencas').update(presenca).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // AVALIAÇÕES
  async getAvaliacoesByDiario(diarioId: number): Promise<Avaliacao[]> {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('diario_id', diarioId)
      .order('data');
    if (error) {
      console.error('Erro ao buscar avaliações:', error);
      throw error;
    }
    return data || [];
  }

  async createAvaliacao(avaliacao: Omit<Avaliacao, 'id' | 'created_at' | 'updated_at'>): Promise<Avaliacao> {
    const { data, error } = await supabase.from('avaliacoes').insert([avaliacao]).select().single();
    if (error) throw error;
    return data;
  }

  async updateAvaliacao(id: number, avaliacao: Partial<Avaliacao>): Promise<Avaliacao> {
    const { data, error } = await supabase.from('avaliacoes').update(avaliacao).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteAvaliacao(id: number): Promise<void> {
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
    if (error) throw error;
  }

  // NOTAS
  async getNotasByAvaliacao(avaliacaoId: number): Promise<Nota[]> {
    const { data, error } = await supabase.from('notas').select('*').eq('avaliacao_id', avaliacaoId);
    if (error) {
      console.error('Erro ao buscar notas:', error);
      throw error;
    }
    return data || [];
  }

  async getNotasByAluno(alunoId: number): Promise<Nota[]> {
    const { data, error } = await supabase.from('notas').select('*').eq('aluno_id', alunoId);
    if (error) {
      console.error('Erro ao buscar notas do aluno:', error);
      throw error;
    }
    return data || [];
  }

  async lancarNota(nota: Omit<Nota, 'id' | 'created_at' | 'updated_at'>): Promise<Nota> {
    const { data, error } = await supabase.from('notas').insert([nota]).select().single();
    if (error) throw error;
    return data;
  }

  async updateNota(id: number, nota: Partial<Nota>): Promise<Nota> {
    const { data, error } = await supabase.from('notas').update(nota).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // OCORRÊNCIAS
  async getOcorrenciasByAluno(alunoId: number): Promise<Ocorrencia[]> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false });
    if (error) {
      console.error('Erro ao buscar ocorrências:', error);
      throw error;
    }
    return data || [];
  }

  async createOcorrencia(ocorrencia: Omit<Ocorrencia, 'id' | 'created_at' | 'updated_at'>): Promise<Ocorrencia> {
    const { data, error } = await supabase.from('ocorrencias').insert([ocorrencia]).select().single();
    if (error) throw error;
    return data;
  }

  async updateOcorrencia(id: number, ocorrencia: Partial<Ocorrencia>): Promise<Ocorrencia> {
    const { data, error} = await supabase.from('ocorrencias').update(ocorrencia).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteOcorrencia(id: number): Promise<void> {
    const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
    if (error) throw error;
  }

  // UTILITÁRIOS
  async calcularMediaAluno(alunoId: number, diarioId: number): Promise<number> {
    const avaliacoes = await this.getAvaliacoesByDiario(diarioId);
    const notas = await this.getNotasByAluno(alunoId);

    const notasDoDiario = notas.filter(nota =>
      avaliacoes.some(av => av.id === nota.avaliacao_id)
    );

    if (notasDoDiario.length === 0) return 0;

    const soma = notasDoDiario.reduce((acc, nota) => acc + nota.valor, 0);
    return soma / notasDoDiario.length;
  }

  // PROFESSOR-DISCIPLINA (Vínculos)
  async vincularProfessorDisciplina(professorId: number, disciplinaId: number): Promise<void> {
    const { error } = await supabase
      .from('professor_disciplinas')
      .insert([{ professor_id: professorId, disciplina_id: disciplinaId }]);
    if (error) throw error;
  }

  async desvincularProfessorDisciplina(professorId: number, disciplinaId: number): Promise<void> {
    const { error } = await supabase
      .from('professor_disciplinas')
      .delete()
      .eq('professor_id', professorId)
      .eq('disciplina_id', disciplinaId);
    if (error) throw error;
  }

  async getDisciplinasByProfessor(professorId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('disciplina_id')
      .eq('professor_id', professorId);
    if (error) {
      console.error('Erro ao buscar disciplinas do professor:', error);
      throw error;
    }
    return data?.map(d => d.disciplina_id) || [];
  }

  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('professor_id')
      .eq('disciplina_id', disciplinaId);
    if (error) {
      console.error('Erro ao buscar professores da disciplina:', error);
      throw error;
    }
    return data?.map(d => d.professor_id) || [];
  }

  async getVinculosProfessorDisciplina(): Promise<{ professor_id: number; disciplina_id: number }[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('professor_id, disciplina_id');
    if (error) {
      console.error('Erro ao buscar vínculos:', error);
      throw error;
    }
    return data || [];
  }
}

export const supabaseService = new SupabaseService();
