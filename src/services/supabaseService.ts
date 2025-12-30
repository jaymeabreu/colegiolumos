import { supabase } from '@/lib/supabaseClient';

// =============================================
// TIPOS
// =============================================

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
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  carga_horaria: number;
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
  created_at: string;
  updated_at: string;
}

export interface Diario {
  id: number;
  nome: string;
  disciplina_id: number;
  turma_id: number;
  professor_id: number;
  bimestre: number;
  data_inicio: string;
  data_termino: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO';
  solicitacao_devolucao?: {
    comentario: string;
    data_solicitacao: string;
  };
  historico_status?: {
    status: string;
    data: string;
    usuario: string;
    observacao?: string;
  }[];
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
  data: string;
  conteudo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Presenca {
  id: number;
  aula_id: number;
  aluno_id: number;
  status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA';
  observacao?: string;
}

export interface Avaliacao {
  id: number;
  diario_id: number;
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
  aluno_id: number;
  valor: number;
}

export interface Ocorrencia {
  id: number;
  aluno_id: number;
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
  data_publicacao: string;
  created_at: string;
  updated_at: string;
}

export interface Recado {
  id: number;
  titulo: string;
  mensagem: string;
  professor_id: number;
  professor_nome: string;
  turma_id: number;
  turma_nome: string;
  aluno_id?: number;
  aluno_nome?: string;
  data_envio: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// SERVIÇO SUPABASE
// =============================================

class SupabaseService {
  // =============================================
  // USUÁRIOS
  // =============================================

  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }

    return data || [];
  }

  async createUsuario(
    usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>,
    senha?: string
  ): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select()
      .single();

    if (error) throw error;

    if (senha) {
      await supabase
        .from('senhas')
        .insert([{ usuario_id: data.id, senha_hash: senha }]);
    }

    return data;
  }

  async updateUsuario(
    id: number,
    usuario: Partial<Usuario>,
    novaSenha?: string
  ): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .update(usuario)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (novaSenha) {
      await supabase
        .from('senhas')
        .upsert([{ usuario_id: id, senha_hash: novaSenha }]);
    }

    return data;
  }

  async deleteUsuario(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // TURMAS
  // =============================================

  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data || [];
  }

  async getTurmaById(id: number): Promise<Turma | null> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createTurma(turma: Omit<Turma, 'id' | 'created_at' | 'updated_at'>): Promise<Turma> {
    const { data, error } = await supabase
      .from('turmas')
      .insert([turma])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTurma(id: number, turma: Partial<Turma>): Promise<Turma | null> {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTurma(id: number): Promise<void> {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // DISCIPLINAS
  // =============================================

  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data || [];
  }

  async getDisciplinaById(id: number): Promise<Disciplina | null> {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createDisciplina(
    disciplina: Omit<Disciplina, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Disciplina> {
    const { data, error } = await supabase
      .from('disciplinas')
      .insert([disciplina])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDisciplina(id: number, disciplina: Partial<Disciplina>): Promise<Disciplina | null> {
    const { data, error } = await supabase
      .from('disciplinas')
      .update(disciplina)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDisciplina(id: number): Promise<void> {
    const { error } = await supabase
      .from('disciplinas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // PROFESSORES
  // =============================================

  async getProfessores(): Promise<Professor[]> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data || [];
  }

  async getProfessorById(id: number): Promise<Professor | null> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createProfessor(
    professor: Omit<Professor, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Professor> {
    const { data, error } = await supabase
      .from('professores')
      .insert([professor])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfessor(id: number, professor: Partial<Professor>): Promise<Professor | null> {
    const { data, error } = await supabase
      .from('professores')
      .update(professor)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProfessor(id: number): Promise<void> {
    const { error } = await supabase
      .from('professores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // ALUNOS
  // =============================================

  async getAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data || [];
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('nome');

    if (error) throw error;
    return data || [];
  }

  async getAlunosByDiario(diarioId: number): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('diario_alunos')
      .select('aluno_id')
      .eq('diario_id', diarioId);

    if (error) throw error;

    const alunoIds = data?.map(d => d.aluno_id) || [];
    if (alunoIds.length === 0) return [];

    const { data: alunos } = await supabase
      .from('alunos')
      .select('*')
      .in('id', alunoIds);

    return alunos || [];
  }

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Promise<Aluno> {
    const { data, error } = await supabase
      .from('alunos')
      .insert([aluno])
      .select()
      .single();

    if (error) throw error;

    // Vincular automaticamente aos diários da turma
    if (data.turma_id) {
      await this.vincularAlunoAosDiariosDaTurma(data.id, data.turma_id);
    }

    return data;
  }

  async updateAluno(id: number, aluno: Partial<Aluno>): Promise<Aluno | null> {
    const { data: oldData } = await supabase
      .from('alunos')
      .select('turma_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Se turma mudou, atualizar vínculos
    if (aluno.turma_id !== undefined && aluno.turma_id !== oldData?.turma_id) {
      if (oldData?.turma_id) {
        await this.removerVinculosAlunoTurma(id, oldData.turma_id);
      }
      if (aluno.turma_id) {
        await this.vincularAlunoAosDiariosDaTurma(id, aluno.turma_id);
      }
    }

    return data;
  }

  async deleteAluno(id: number): Promise<void> {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // DIÁRIOS
  // =============================================

  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase
      .from('diarios')
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  }

  async getDiariosByProfessor(professorId: number): Promise<Diario[]> {
    const { data, error } = await supabase
      .from('diarios')
      .select('*')
      .eq('professor_id', professorId);

    if (error) throw error;
    return data || [];
  }

  async createDiario(
    diario: Omit<Diario, 'id' | 'created_at' | 'updated_at' | 'solicitacao_devolucao' | 'historico_status'>
  ): Promise<Diario> {
    const { data, error } = await supabase
      .from('diarios')
      .insert([diario])
      .select()
      .single();

    if (error) throw error;

    // Vincular automaticamente todos os alunos da turma
    await this.vincularAlunosDaTurmaAoDiario(diario.turma_id, data.id);

    return data;
  }

  async updateDiario(
    id: number,
    diario: Partial<Omit<Diario, 'solicitacao_devolucao' | 'historico_status'>>
  ): Promise<Diario | null> {
    const { data: oldData } = await supabase
      .from('diarios')
      .select('turma_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('diarios')
      .update(diario)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Se turma mudou, atualizar vínculos
    if (diario.turma_id && diario.turma_id !== oldData?.turma_id) {
      await this.removerTodosVinculosDoDiario(id);
      await this.vincularAlunosDaTurmaAoDiario(diario.turma_id, id);
    }

    return data;
  }

  async deleteDiario(id: number): Promise<void> {
    await this.removerTodosVinculosDoDiario(id);

    const { error } = await supabase
      .from('diarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // DIÁRIO CONTROLE
  // =============================================

  async entregarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    const { data: diario, error: diarioError } = await supabase
      .from('diarios')
      .select('status')
      .eq('id', diarioId)
      .single();

    if (diarioError || !diario) return false;
    if (diario.status !== 'PENDENTE' && diario.status !== 'DEVOLVIDO') return false;

    const { error } = await supabase
      .from('diarios')
      .update({ status: 'ENTREGUE' })
      .eq('id', diarioId);

    return !error;
  }

  async devolverDiario(diarioId: number, usuarioId: number, observacao?: string): Promise<boolean> {
    const { data: diario, error: diarioError } = await supabase
      .from('diarios')
      .select('status')
      .eq('id', diarioId)
      .single();

    if (diarioError || !diario) return false;
    if (diario.status !== 'ENTREGUE') return false;

    const { error } = await supabase
      .from('diarios')
      .update({ status: 'DEVOLVIDO' })
      .eq('id', diarioId);

    return !error;
  }

  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    const { data: diario, error: diarioError } = await supabase
      .from('diarios')
      .select('status')
      .eq('id', diarioId)
      .single();

    if (diarioError || !diario) return false;
    if (diario.status !== 'ENTREGUE') return false;

    const { error } = await supabase
      .from('diarios')
      .update({ status: 'FINALIZADO' })
      .eq('id', diarioId);

    return !error;
  }

  async solicitarDevolucaoDiario(diarioId: number, usuarioId: number, comentario: string): Promise<boolean> {
    return true; // Implementar conforme necessário
  }

  professorPodeEditarDiario(diarioId: number, professorId: number): boolean {
    // Implementar verificação real do Supabase conforme necessário
    return true;
  }

  coordenadorPodeGerenciarDiario(diarioId: number): { canDevolver: boolean; canFinalizar: boolean } {
    return { canDevolver: true, canFinalizar: true };
  }

  // =============================================
  // AULAS
  // =============================================

  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('diario_id', diarioId)
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAula(aula: Omit<Aula, 'id' | 'created_at' | 'updated_at'>): Promise<Aula> {
    const { data, error } = await supabase
      .from('aulas')
      .insert([aula])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAula(id: number, aula: Partial<Aula>): Promise<Aula | null> {
    const { data, error } = await supabase
      .from('aulas')
      .update(aula)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAula(id: number): Promise<void> {
    const { error } = await supabase
      .from('aulas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // PRESENÇAS
  // =============================================

  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('aula_id', aulaId);

    if (error) throw error;
    return data || [];
  }

  async getPresencasByAluno(alunoId: number): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('aluno_id', alunoId);

    if (error) throw error;
    return data || [];
  }

  async savePresencas(presencas: Omit<Presenca, 'id'>[]): Promise<Presenca[]> {
    const aulaId = presencas[0]?.aula_id;

    if (aulaId) {
      await supabase
        .from('presencas')
        .delete()
        .eq('aula_id', aulaId);
    }

    const { data, error } = await supabase
      .from('presencas')
      .insert(presencas)
      .select();

    if (error) throw error;
    return data || [];
  }

  // =============================================
  // AVALIAÇÕES
  // =============================================

  async getAvaliacoesByDiario(diarioId: number): Promise<Avaliacao[]> {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('diario_id', diarioId)
      .order('data');

    if (error) throw error;
    return data || [];
  }

  async createAvaliacao(
    avaliacao: Omit<Avaliacao, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Avaliacao> {
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert([avaliacao])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAvaliacao(id: number, avaliacao: Partial<Avaliacao>): Promise<Avaliacao | null> {
    const { data, error } = await supabase
      .from('avaliacoes')
      .update(avaliacao)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAvaliacao(id: number): Promise<void> {
    const { error } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // NOTAS
  // =============================================

  async getNotasByAvaliacao(avaliacaoId: number): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('avaliacao_id', avaliacaoId);

    if (error) throw error;
    return data || [];
  }

  async getNotasByAluno(alunoId: number): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('aluno_id', alunoId);

    if (error) throw error;
    return data || [];
  }

  async saveNotas(notas: Omit<Nota, 'id'>[]): Promise<Nota[]> {
    const avaliacaoId = notas[0]?.avaliacao_id;

    if (avaliacaoId) {
      await supabase
        .from('notas')
        .delete()
        .eq('avaliacao_id', avaliacaoId);
    }

    const { data, error } = await supabase
      .from('notas')
      .insert(notas)
      .select();

    if (error) throw error;
    return data || [];
  }

  // =============================================
  // OCORRÊNCIAS
  // =============================================

  async getOcorrenciasByAluno(alunoId: number): Promise<Ocorrencia[]> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getOcorrencias(): Promise<Ocorrencia[]> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createOcorrencia(
    ocorrencia: Omit<Ocorrencia, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Ocorrencia> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .insert([ocorrencia])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOcorrencia(id: number, ocorrencia: Partial<Ocorrencia>): Promise<Ocorrencia | null> {
    const { data, error } = await supabase
      .from('ocorrencias')
      .update(ocorrencia)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteOcorrencia(id: number): Promise<void> {
    const { error } = await supabase
      .from('ocorrencias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =============================================
  // COMUNICADOS
  // =============================================

  async getComunicados(): Promise<Comunicado[]> {
    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .order('data_publicacao', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createComunicado(
    comunicado: Omit<Comunicado, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Comunicado> {
    const { data, error } = await supabase
      .from('comunicados')
      .insert([comunicado])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateComunicado(id: number, comunicado: Partial<Comunicado>): Promise<Comunicado | null> {
    const { data, error } = await supabase
      .from('comunicados')
      .update(comunicado)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteComunicado(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('comunicados')
      .delete()
      .eq('id', id);

    return !error;
  }

  // =============================================
  // RECADOS
  // =============================================

  async getRecados(): Promise<Recado[]> {
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .order('data_envio', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createRecado(recado: Omit<Recado, 'id' | 'created_at' | 'updated_at'>): Promise<Recado> {
    const { data, error } = await supabase
      .from('recados')
      .insert([recado])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRecado(id: number, updates: Partial<Recado>): Promise<Recado | null> {
    const { data, error } = await supabase
      .from('recados')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRecado(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('recados')
      .delete()
      .eq('id', id);

    return !error;
  }

  // =============================================
  // CÁLCULOS
  // =============================================

  async calcularMediaAluno(alunoId: number, diarioId: number): Promise<number> {
    const { data: avaliacoes, error: avalError } = await supabase
      .from('avaliacoes')
      .select('id, peso')
      .eq('diario_id', diarioId);

    if (avalError) return 0;

    const { data: notas, error: notasError } = await supabase
      .from('notas')
      .select('avaliacao_id, valor')
      .eq('aluno_id', alunoId)
      .in('avaliacao_id', avaliacoes?.map(a => a.id) || []);

    if (notasError) return 0;

    let somaNotas = 0;
    let somaPesos = 0;

    avaliacoes?.forEach((avaliacao) => {
      const nota = notas?.find(n => n.avaliacao_id === avaliacao.id);
      if (nota) {
        somaNotas += nota.valor * avaliacao.peso;
        somaPesos += avaliacao.peso;
      }
    });

    return somaPesos > 0 ? somaNotas / somaPesos : 0;
  }

  // =============================================
  // VÍNCULOS PRIVADOS
  // =============================================

  private async removerTodosVinculosDoDiario(diarioId: number): Promise<void> {
    await supabase
      .from('diario_alunos')
      .delete()
      .eq('diario_id', diarioId);
  }

  private async removerVinculosAlunoTurma(alunoId: number, turmaId: number): Promise<void> {
    const { data: diarios } = await supabase
      .from('diarios')
      .select('id')
      .eq('turma_id', turmaId);

    if (diarios) {
      const diarioIds = diarios.map(d => d.id);
      await supabase
        .from('diario_alunos')
        .delete()
        .eq('aluno_id', alunoId)
        .in('diario_id', diarioIds);
    }
  }

  private async vincularAlunosDaTurmaAoDiario(turmaId: number, diarioId: number): Promise<void> {
    const { data: alunos } = await supabase
      .from('alunos')
      .select('id')
      .eq('turma_id', turmaId);

    if (!alunos || alunos.length === 0) return;

    const vinculos = alunos.map(aluno => ({
      diario_id: diarioId,
      aluno_id: aluno.id
    }));

    await supabase
      .from('diario_alunos')
      .insert(vinculos);
  }

  private async vincularAlunoAosDiariosDaTurma(alunoId: number, turmaId: number): Promise<void> {
    const { data: diarios } = await supabase
      .from('diarios')
      .select('id')
      .eq('turma_id', turmaId);

    if (!diarios || diarios.length === 0) return;

    const vinculos = diarios.map(diario => ({
      diario_id: diario.id,
      aluno_id: alunoId
    }));

    await supabase
      .from('diario_alunos')
      .insert(vinculos);
  }

  // =============================================
  // PROFESSOR-DISCIPLINAS
  // =============================================

  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    const { data } = await supabase
      .from('professor_disciplinas')
      .select('professor_id')
      .eq('disciplina_id', disciplinaId);

    return data?.map(d => d.professor_id) || [];
  }

  async getDiarioAlunos(): Promise<DiarioAluno[]> {
    const { data, error } = await supabase
      .from('diario_alunos')
      .select('*');

    if (error) throw error;
    return data || [];
  }
}

export const supabaseService = new SupabaseService();
