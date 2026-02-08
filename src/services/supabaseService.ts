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

function withCamel(row: any) {
  if (!row) return row;
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

class SupabaseService {
  private dispatchDataUpdated(type: string) {
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type, timestamp: Date.now() } }));
  }

  // --- MATRÍCULA ---
  async getSuggestedMatricula(): Promise<string> {
    const { data } = await supabase.from('alunos').select('matricula');
    const existing = new Set((data ?? []).map(a => a.matricula));
    for (let i = 1; i <= 9999; i++) {
      const suggested = i.toString().padStart(2, '0');
      if (!existing.has(suggested)) return suggested;
    }
    return '01';
  }

  // --- USUÁRIOS ---
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').order('nome');
    if (error) throw error;
    return data as Usuario[];
  }

  async createUsuario(usuario: any, senha?: string) {
    const payload = { ...usuario, senha: senha || '123456', ativo: true };
    const { data, error } = await supabase.from('usuarios').insert(payload).select('*').single();
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
    return data;
  }

  async updateUsuario(id: number, updates: any) {
    const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('usuarios');
    return data;
  }

  async deleteUsuario(id: number) {
    await supabase.from('usuarios').delete().eq('id', id);
    this.dispatchDataUpdated('usuarios');
  }

  // --- TURMAS E DISCIPLINAS ---
  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase.from('turmas').select('*').order('nome');
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase.from('disciplinas').select('*').order('nome');
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  // --- ALUNOS (Funções completas restauradas) ---
  async getAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase.from('alunos').select('*').order('nome');
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    if (!turmaId) return [];
    const { data, error } = await supabase.from('alunos').select('*').eq('turma_id', turmaId);
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  async getAlunosByDiario(diarioId: number): Promise<Aluno[]> {
    if (!diarioId) return [];
    const { data: vinculos } = await supabase.from('diario_alunos').select('aluno_id').eq('diario_id', diarioId);
    const ids = (vinculos ?? []).map(v => v.aluno_id);
    if (!ids.length) return [];
    const { data, error } = await supabase.from('alunos').select('*').in('id', ids);
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  // --- DIÁRIOS ---
  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase.from('diarios').select('*').order('id', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  async getDiarioById(id: number): Promise<Diario | null> {
    if (!id || isNaN(id)) return null;
    const { data, error } = await supabase.from('diarios').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return withCamel(data);
  }

  async createDiario(diario: any) {
    const { data, error } = await supabase.from('diarios').insert(diario).select().single();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return withCamel(data);
  }

  async updateDiario(id: number, updates: any) {
    if (!id) return null;
    const { data, error } = await supabase.from('diarios').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return withCamel(data);
  }

  async deleteDiario(id: number) {
    await supabase.from('diarios').delete().eq('id', id);
    this.dispatchDataUpdated('diarios');
  }

  // --- AULAS E PRESENÇAS ---
  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    if (!diarioId) return [];
    const { data, error } = await supabase.from('aulas').select('*').eq('diario_id', diarioId).order('data');
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  async getPresencasByAula(aulaId: number): Promise<Presenca[]> {
    if (!aulaId) return [];
    const { data, error } = await supabase.from('presencas').select('*').eq('aula_id', aulaId);
    if (error) throw error;
    return (data ?? []).map(withCamel);
  }

  // --- FINALIZAR DIÁRIO ---
  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    try {
      if (!diarioId || !usuarioId) throw new Error('Dados insuficientes para finalizar.');
      const { data: user } = await supabase.from('usuarios').select('papel').eq('id', usuarioId).maybeSingle();
      if (!user || user.papel !== 'COORDENADOR') throw new Error('Apenas coordenadores podem finalizar.');
      const diario = await this.getDiarioById(diarioId);
      if (!diario) throw new Error('Diário não encontrado.');
      const hist = Array.isArray(diario.historico_status) ? [...diario.historico_status] : [];
      hist.push({ status: 'FINALIZADO', at: nowIso(), usuario_id: usuarioId });
      const { error } = await supabase.from('diarios').update({ status: 'FINALIZADO', historico_status: hist, solicitacao_devolucao: null }).eq('id', diarioId);
      if (error) throw error;
      this.dispatchDataUpdated('diarios');
      return true;
    } catch (e: any) { throw e; }
  }

  // --- AUXILIARES ANTI-ERRO 400 ---
  async getProfessorNomeByIdSafe(id?: number | null) {
    if (!id || isNaN(Number(id))) return null;
    const { data } = await supabase.from('professores').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }

  async getAlunoNomeByIdSafe(id?: number | null) {
    if (!id || isNaN(Number(id))) return null;
    const { data } = await supabase.from('alunos').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }

  async getProfessoresByDisciplina(id: number) {
    const { data } = await supabase.from('professor_disciplinas').select('professor_id').eq('disciplina_id', id);
    return (data ?? []).map(d => d.professor_id);
  }
}

export const supabaseService = new SupabaseService();
