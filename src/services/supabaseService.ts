import { supabase } from '@/lib/supabaseClient';

// Tipos básicos
export interface Usuario { 
  id: number;
  nome: string;
  email: string;
  papel: 'COORDENADOR' | 'PROFESSOR' | 'ALUNO';
  aluno_id?: number;
  professor_id?: number;
  ID?: number;
  ativo: boolean;
}

export interface Turma { id: number; nome: string; ano: number; turno: string; }
export interface Disciplina { id: number; nome: string; codigo: string; carga_horaria: number; }
export interface Diario {
  id: number;
  nome: string;
  disciplina_id: number;
  turma_id: number;
  professor_id: number;
  bimestre: number;
  dataInicio?: string;
  dataTermino?: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO';
  solicitacao_devolucao?: any;
  historico_status?: any;
}

const nowIso = () => new Date().toISOString();

class SupabaseService {
  private dispatchDataUpdated(type: string) {
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type, timestamp: Date.now() } }));
  }

  // --- MÉTODOS DE BUSCA COM PROTEÇÃO CONTRA ID NULL (Erro 400) ---
  
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').order('nome');
    if (error) throw error;
    return data || [];
  }

  async getTurmas(): Promise<Turma[]> {
    const { data, error } = await supabase.from('turmas').select('*').order('nome');
    if (error) throw error;
    return data || [];
  }

  async getDisciplinas(): Promise<Disciplina[]> {
    const { data, error } = await supabase.from('disciplinas').select('*').order('nome');
    if (error) throw error;
    return data || [];
  }

  async getDiarios(): Promise<Diario[]> {
    const { data, error } = await supabase.from('diarios').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getDiarioById(id: number): Promise<Diario | null> {
    if (!id || isNaN(id)) return null;
    const { data, error } = await supabase.from('diarios').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async createDiario(diario: Partial<Diario>) {
    const { data, error } = await supabase.from('diarios').insert([diario]).select().single();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return data;
  }

  async updateDiario(id: number, updates: Partial<Diario>) {
    if (!id) return null;
    const { data, error } = await supabase.from('diarios').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
    return data;
  }

  async deleteDiario(id: number) {
    const { error } = await supabase.from('diarios').delete().eq('id', id);
    if (error) throw error;
    this.dispatchDataUpdated('diarios');
  }

  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    if (!disciplinaId) return [];
    const { data, error } = await supabase.from('professor_disciplinas').select('professor_id').eq('disciplina_id', disciplinaId);
    if (error) throw error;
    return data.map(d => d.professor_id);
  }

  // --- FINALIZAR DIÁRIO ---

  async finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
    try {
      if (!diarioId || !usuarioId) throw new Error('IDs inválidos para finalização.');

      const { data: user, error: userErr } = await supabase.from('usuarios').select('papel').eq('id', usuarioId).maybeSingle();
      if (userErr || !user || user.papel !== 'COORDENADOR') {
        throw new Error('Apenas coordenadores podem finalizar diários.');
      }

      const diario = await this.getDiarioById(diarioId);
      if (!diario) throw new Error('Diário não encontrado.');

      const novoHistorico = Array.isArray(diario.historico_status) ? [...diario.historico_status] : [];
      novoHistorico.push({ status: 'FINALIZADO', at: nowIso(), usuario_id: usuarioId });

      const { error: updateErr } = await supabase
        .from('diarios')
        .update({ 
          status: 'FINALIZADO', 
          historico_status: novoHistorico,
          solicitacao_devolucao: null 
        })
        .eq('id', diarioId);

      if (updateErr) throw updateErr;
      this.dispatchDataUpdated('diarios');
      return true;
    } catch (error: any) {
      console.error('Erro service:', error);
      throw error;
    }
  }

  // --- PROTEÇÃO CONTRA ERROS 400 id=eq.null ---

  async getProfessorNomeByIdSafe(id?: number | null): Promise<string | null> {
    if (!id || isNaN(id)) return null;
    const { data } = await supabase.from('professores').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }

  async getAlunoNomeByIdSafe(id?: number | null): Promise<string | null> {
    if (!id || isNaN(id)) return null;
    const { data } = await supabase.from('alunos').select('nome').eq('id', id).maybeSingle();
    return data?.nome || null;
  }
}

export const supabaseService = new SupabaseService();
