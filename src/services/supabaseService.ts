import { supabase } from '@/lib/supabaseClient';

// --- TIPOS ---
export interface Usuario { 
  id: number; nome: string; email: string; papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  aluno_id?: number; professor_id?: number; ativo: boolean; created_at: string; updated_at: string; ID?: number;
}
export type TurnoTurma = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';
export interface Turma { id: number; nome: string; ano: number; turno: TurnoTurma; created_at: string; updated_at: string; }
export interface Disciplina { id: number; nome: string; codigo: string; carga_horaria: number; created_at: string; updated_at: string; }
export interface Professor { id: number; nome: string; email: string; created_at: string; updated_at: string; }
export interface Aluno { id: number; nome: string; email?: string; turma_id: number; matricula: string; created_at: string; updated_at: string; }
export interface Diario { id: number; nome: string; disciplina_id: number; turma_id: number; professor_id: number; bimestre: number; data_inicio: string; data_termino: string; status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO'; solicitacao_devolucao?: any; historico_status?: any; created_at: string; updated_at: string; dataInicio?: string; dataTermino?: string; }
export interface Aula { id: number; diario_id: number; data: string; created_at: string; }
export interface Presenca { id: number; aula_id: number; aluno_id: number; status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA'; created_at: string; }
export interface Avaliacao { id: number; diario_id: number; titulo: string; data: string; tipo: string; peso: number; created_at: string; }
export interface Nota { id: number; avaliacao_id: number; aluno_id: number; valor: number; created_at: string; }
export interface Ocorrencia { id: number; aluno_id: number; tipo: string; data: string; descricao: string; created_at: string; }
export interface Comunicado { id: number; titulo: string; mensagem: string; created_at: string; }
export interface Recado { id: number; titulo: string; mensagem: string; created_at: string; }
export interface DiarioAluno { id: number; diario_id: number; aluno_id: number; created_at: string; }

const nowIso = () => new Date().toISOString();

function withCamel<T extends Record<string, any>>(row: T): T {
  const r: any = { ...row };
  if (r.turma_id !== undefined) r.turmaId = r.turma_id;
  if (r.disciplina_id !== undefined) r.disciplinaId = r.disciplina_id;
  if (r.professor_id !== undefined) r.professorId = r.professor_id;
  if (r.aluno_id !== undefined) r.alunoId = r.aluno_id;
  if (r.diario_id !== undefined) r.diarioId = r.diario_id;
  if (r.data_inicio !== undefined) r.dataInicio = r.data_inicio;
  if (r.data_termino !== undefined) r.dataTermino = r.data_termino;
  return r;
}

function sanitizeAlunoId(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

class SupabaseService {
  private dispatchDataUpdated(type: string) {
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type, timestamp: Date.now() } }));
  }

  // --- MATRÍCULA ---
  async getSuggestedMatricula(): Promise<string> {
    try {
      const { data: alunos, error } = await supabase.from('alunos').select('matricula');
      if (error) return '01';
      const existing = new Set((alunos ?? []).map(a => a.matricula));
      for (let i = 1; i <= 9999; i++) {
        const suggested = i.toString().padStart(2, '0');
        if (!existing.has(suggested)) return suggested;
      }
      return '9999';
    } catch { return '01'; }
  }

  // --- USUÁRIOS ---
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Usuario[];
  }

  async createUsuario(usuario: any, senha?: string): Promise<Usuario> {
    const payload = { ...usuario, senha: senha || '123456', ativo: true };
    const { data, error } = await supabase.from('usuarios').insert(payload).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
    return data as Usuario;
  }

  async updateUsuario(id: number, updates: Partial<Usuario>): Promise<Usuario | null> {
    const { data, error } = await supabase.from('usuarios').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
    return data as Usuario;
  }

  async deleteUsuario(id: number): Promise<void> {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
  }

  // --- TURMAS ---
  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase.from('turmas').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Turma[];
  }

  async getTurmaById(id: number): Promise<Turma | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('turmas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? withCamel(data) : null;
  }

  async createTurma(turma: any): Promise<Turma> {
    const { data, error } = await supabase.from('turmas').insert(turma).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('turmas');
    return withCamel(data) as Turma;
  }

  async updateTurma(id: number, updates: any): Promise<Turma | null> {
    const { data, error } = await supabase.from('turmas').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('turmas');
    return data ? withCamel(data) : null;
  }

  async deleteTurma(id: number): Promise<void> {
    const { error } = await supabase.from('turmas').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('turmas');
  }

  // --- DISCIPLINAS ---
  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase.from('disciplinas').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Disciplina[];
  }

  async getDisciplinaById(id: number): Promise<Disciplina | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('disciplinas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? withCamel(data) : null;
  }

  async createDisciplina(disciplina: any): Promise<Disciplina> {
    const { data, error } = await supabase.from('disciplinas').insert(disciplina).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('disciplinas');
    return withCamel(data) as Disciplina;
  }

  async updateDisciplina(id: number, updates: any): Promise<Disciplina | null> {
    const { data, error } = await supabase.from('disciplinas').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('disciplinas');
    return data ? withCamel(data) : null;
  }

  async deleteDisciplina(id: number): Promise<void> {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('disciplinas');
  }

  // --- PROFESSORES ---
  async getProfessores(): Promise<Professor[]> {
    const { data, error } = await supabase.from('professores').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data as Professor[];
  }

  async getProfessorById(id: number): Promise<Professor | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('professores').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async createProfessor(prof: any): Promise<Professor> {
    const { data, error } = await supabase.from('professores').insert(prof).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('professores');
    return data;
  }

  async updateProfessor(id: number, updates: any): Promise<Professor | null> {
    const { data, error } = await supabase.from('professores').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('professores');
    return data;
  }

  async deleteProfessor(id: number): Promise<void> {
    const { error } = await supabase.from('professores').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('professores');
  }

  // --- ALUNOS ---
  async getAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase.from('alunos').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Aluno[];
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    if (!turmaId) return [];
    const { data, error } = await supabase.from('alunos').select('*').eq('turma_id', turmaId).order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Aluno[];
  }

  async createAluno(aluno: any): Promise<Aluno> {
    const { data, error } = await supabase.from('alunos').insert(aluno).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('alunos');
    return withCamel(data) as Aluno;
  }

  async updateAluno(id: number, updates: any): Promise<Aluno | null> {
    const { data, error } = await supabase.from('alunos').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('alunos');
    return data ? withCamel(data) : null;
  }

  async deleteAluno(id: number): Promise<void> {
    const { error } = await supabase.from('alunos').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('alunos');
  }

  // --- DIÁRIOS ---
  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase.from('diarios').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Diario[];
  }

  async getDiarioById(id: number): Promise<Diario | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('diarios').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? withCamel(data) : null;
  }

  async createDiario(diario: any): Promise<Diario> {
    const { data, error } = await supabase.from('diarios').insert(diario).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return withCamel(data) as Diario;
  }

  async updateDiario(id: number, updates: any): Promise<Diario | null> {
    const { data, error } = await supabase.from('diarios').update({ ...updates, updated_at: nowIso() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return data ? withCamel(data) : null;
  }

  async deleteDiario(id: number): Promise<void> {
    const { error } = await supabase.from('diarios').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
  }

  // --- AULAS ---
  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    if (!diarioId) return [];
    const { data, error } = await supabase.from('aulas').select('*').eq('diario_id', diarioId).order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(withCamel) as Aula[];
  }

  async createAula(aula: any): Promise<Aula> {
    const { data, error } = await supabase.from('aulas').insert(aula).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('aulas');
    return withCamel(data) as Aula;
  }

  // --- PRESENÇAS ---
  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    if (!aulaId) return [];
    const { data, error } = await supabase.from('presencas').select('*').eq('aula_id', aulaId);
    if (error) throw error;
    return (data ?? []).map(withCamel) as Presenca[];
  }

  async savePresencas(presencas: any[]): Promise<void> {
    if (!presencas.length) return;
    const aulaIds = [...new Set(presencas.map(p => p.aula_id))];
    await supabase.from('presencas').delete().in('aula_id', aulaIds);
    const { error } = await supabase.from('presencas').insert(presencas);
    if (error) throw error;
    this.dispatchDataUpdated('presencas');
  }

  // --- FINALIZAR DIÁRIO (FUNCIONAL) ---
  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    try {
      if (!diarioId || !usuarioId) throw new Error('IDs inválidos');
      const { data: usuario } = await supabase.from('usuarios').select('papel').eq('id', usuarioId).maybeSingle();
      if (!usuario || usuario.papel !== 'COORDENADOR') throw new Error('Apenas coordenadores podem finalizar.');

      const diario = await this.getDiarioById(diarioId);
      if (!diario) throw new Error('Diário não encontrado');

      const historico = Array.isArray(diario.historico_status) ? [...diario.historico_status] : [];
      historico.push({ status: 'FINALIZADO', at: nowIso(), usuario_id: usuarioId });

      const { error } = await supabase.from('diarios').update({ 
        status: 'FINALIZADO', 
        historico_status: historico,
        solicitacao_devolucao: null
      }).eq('id', diarioId);

      if (error) throw error;
      this.dispatchDataUpdated('diarios');
      return true;
    } catch (e: any) { throw e; }
  }

  // --- PROTEÇÃO ANTI ERRO 400 id=eq.null ---
  async getProfessorNomeByIdSafe(id?: number | null): Promise<string | null> {
    if (!id || isNaN(Number(id))) return null;
    const { data } = await supabase.from('professores').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }

  async getAlunoNomeByIdSafe(id?: number | null): Promise<string | null> {
    if (!id || isNaN(Number(id))) return null;
    const { data } = await supabase.from('alunos').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }

  // --- OUTRAS FUNÇÕES (RESTO DO SEU CÓDIGO) ---
  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    if (!disciplinaId) return [];
    const { data } = await supabase.from('professor_disciplinas').select('professor_id').eq('disciplina_id', disciplinaId);
    return (data ?? []).map(d => d.professor_id);
  }

  async getBoletimAluno(diarioId: number, alunoId: number): Promise<any> {
    try {
      // Simulação de lógica de boletim
      return { mediaGeral: 0, frequencia: 0, situacao: 'Em Análise', notas: [] };
    } catch { return null; }
  }

  async getAvaliacoesByDiario(diarioId: number): Promise<Avaliacao[]> {
    if (!diarioId) return [];
    const { data } = await supabase.from('avaliacoes').select('*').eq('diario_id', diarioId);
    return (data ?? []) as Avaliacao[];
  }

  async getNotasByAluno(alunoId: number): Promise<Nota[]> {
    if (!alunoId) return [];
    const { data } = await supabase.from('notas').select('*').eq('aluno_id', alunoId);
    return (data ?? []) as Nota[];
  }

  // --- RECARDOS ---
  async createRecado(recado: any): Promise<any> {
    const { data, error } = await supabase.from('recados').insert(recado).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('recados');
    return data;
  }
}

export const supabaseService = new SupabaseService();
