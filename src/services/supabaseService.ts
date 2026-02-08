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
  matricula: string;
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
  hora_inicio?: string;
  horaInicio?: string;
  hora_fim?: string;
  horaFim?: string;
  conteudo?: string;
  observacoes?: string;
  quantidade_aulas?: number;
  quantidadeAulas?: number;
  tipo_aula?: string;
  tipoAula?: string;
  aula_assincrona?: boolean;
  aulaAssincrona?: boolean;
  conteudo_detalhado?: string;
  conteudoDetalhado?: string;
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
  aula_sequencia?: number;
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
  diario_id: number;
  diarioId?: number;
  tipo: string;
  data: string;
  descricao: string;
  acao_tomada?: string;
  acaoTomada?: string;
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
  turma_id?: number;
  turmaId?: number;
  usuario_id?: number;
  usuarioId?: number;
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
  if (r.autor_id !== undefined) r.autorId = r.autor_id;
  if (r.usuario_id !== undefined) r.usuarioId = r.usuario_id;

  if (r.data_inicio !== undefined) r.dataInicio = r.data_inicio;
  if (r.data_termino !== undefined) r.dataTermino = r.data_termino;
  if (r.data_publicacao !== undefined) r.dataPublicacao = r.data_publicacao;
  if (r.data_envio !== undefined) r.dataEnvio = r.data_envio;
  if (r.hora_inicio !== undefined) r.horaInicio = r.hora_inicio;
  if (r.hora_fim !== undefined) r.horaFim = r.hora_fim;
  if (r.acao_tomada !== undefined) r.acaoTomada = r.acao_tomada;

  if (r.professor_nome !== undefined) r.professorNome = r.professor_nome;
  if (r.turma_nome !== undefined) r.turmaNome = r.turma_nome;
  if (r.aluno_nome !== undefined) r.alunoNome = r.aluno_nome;

  if (r.carga_horaria !== undefined) r.cargaHoraria = r.carga_horaria;

  if (r.quantidade_aulas !== undefined) r.quantidadeAulas = r.quantidade_aulas;
  if (r.tipo_aula !== undefined) r.tipoAula = r.tipo_aula;
  if (r.aula_assincrona !== undefined) r.aulaAssincrona = r.aula_assincrona;
  if (r.conteudo_detalhado !== undefined) r.conteudoDetalhado = r.conteudo_detalhado;

  return r;
}

function sanitizeAlunoId(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'number') return isNaN(value) ? null : value;
  return null;
}

class SupabaseService {
  private dispatchDataUpdated(type: string) {
    window.dispatchEvent(
      new CustomEvent('dataUpdated', { detail: { type, timestamp: Date.now() } })
    );
  }

  async getSuggestedMatricula(): Promise<string> {
    try {
      console.log('🔍 Buscando próxima matrícula disponível...');

      const { data: alunos, error } = await supabase
        .from('alunos')
        .select('matricula');

      if (error) {
        console.error('❌ Erro ao buscar matrículas:', error);
        return '01';
      }

      const existingMatriculas = new Set<string>(
        (alunos ?? [])
          .map(a => a.matricula)
          .filter(m => m && typeof m === 'string')
          .map(m => {
            const num = parseInt(m, 10);
            if (!isNaN(num)) {
              return num.toString().padStart(2, '0');
            }
            return m;
          })
      );

      console.log('📊 Matrículas existentes:', Array.from(existingMatriculas));

      for (let i = 1; i <= 9999; i++) {
        const suggested = i.toString().padStart(2, '0');
        
        if (!existingMatriculas.has(suggested)) {
          console.log(`✅ Matrícula sugerida: ${suggested}`);
          return suggested;
        }
      }

      console.warn('⚠️ Não há matrículas disponíveis!');
      return '9999';
    } catch (error) {
      console.error('❌ Erro ao gerar matrícula sugerida:', error);
      return '01';
    }
  }

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
      if (!senha) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
        senha = '';
        for (let i = 0; i < 12; i++) {
          senha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      
      const payload: any = {
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        senha: senha,
        ativo: usuario.ativo ?? true
      };
      
      if (usuario.aluno_id !== undefined && usuario.aluno_id !== null) {
        payload.aluno_id = usuario.aluno_id;
        console.log(`✅ Vinculando aluno_id: ${usuario.aluno_id}`);
      }
      
      if (usuario.professor_id !== undefined && usuario.professor_id !== null) {
        payload.professor_id = usuario.professor_id;
        console.log(`✅ Vinculando professor_id: ${usuario.professor_id}`);
      }
      
      console.log('📤 Criando usuário com payload:', JSON.stringify(payload, null, 2));
      
      const { data, error } = await supabase
        .from('usuarios')
        .insert(payload)
        .select('*')
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar usuário:', error);
        throw error;
      }
      
      console.log('✅ Usuário criado com sucesso:', data);
      this.dispatchDataUpdated('usuarios');
      return data as Usuario;
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
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

    const ids = (vinculos ?? []).map((v: any) => v.aluno_id).filter(Boolean);
    
    if (ids.length === 0) return [];

    const { data: alunos, error: e2 } = await supabase
      .from('alunos')
      .select('*')
      .in('id', ids as number[])
      .order('id', { ascending: true });

    if (e2) throw e2;

    return (alunos ?? []).map(withCamel) as Aluno[];
  }

  async createAluno(aluno: any): Promise<Aluno> {
    const payload: any = {
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email ?? null,
      turma_id: aluno.turma_id ?? aluno.turmaId ?? null,
      data_nascimento: aluno.dataNascimento ?? aluno.data_nascimento ?? null,
      cpf: aluno.cpf ?? null,
      rg: aluno.rg ?? null,
      sexo: aluno.sexo ?? null,
      contato: aluno.contato ?? null,
      observacoes: aluno.observacoes ?? null,
      endereco: aluno.endereco ?? null,
      bairro: aluno.bairro ?? null,
      cidade: aluno.cidade ?? null,
      estado: aluno.estado ?? null,
      cep: aluno.cep ?? null,
      nome_responsavel: aluno.nomeResponsavel ?? aluno.nome_responsavel ?? null,
      telefone_responsavel: aluno.contatoResponsavel ?? aluno.telefone_responsavel ?? null,
      email_responsavel: aluno.emailResponsavel ?? aluno.email_responsavel ?? null,
      parentesco: aluno.parentesco ?? null,
      ano_letivo: aluno.anoLetivo ?? aluno.ano_letivo ?? null,
      situacao: aluno.situacao ?? null
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

  async updateAluno(id: number, updates: Partial<any>): Promise<Aluno | null> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.turma_id !== undefined) payload.turma_id = updates.turma_id;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId;
    if (updates.data_nascimento !== undefined) payload.data_nascimento = updates.data_nascimento;
    if (updates.dataNascimento !== undefined) payload.data_nascimento = updates.dataNascimento;
    if (updates.cpf !== undefined) payload.cpf = updates.cpf;
    if (updates.rg !== undefined) payload.rg = updates.rg;
    if (updates.sexo !== undefined) payload.sexo = updates.sexo;
    if (updates.contato !== undefined) payload.contato = updates.contato;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;
    if (updates.endereco !== undefined) payload.endereco = updates.endereco;
    if (updates.bairro !== undefined) payload.bairro = updates.bairro;
    if (updates.cidade !== undefined) payload.cidade = updates.cidade;
    if (updates.estado !== undefined) payload.estado = updates.estado;
    if (updates.cep !== undefined) payload.cep = updates.cep;
    if (updates.nomeResponsavel !== undefined) payload.nome_responsavel = updates.nomeResponsavel;
    if (updates.nome_responsavel !== undefined) payload.nome_responsavel = updates.nome_responsavel;
    if (updates.contatoResponsavel !== undefined) payload.telefone_responsavel = updates.contatoResponsavel;
    if (updates.telefone_responsavel !== undefined) payload.telefone_responsavel = updates.telefone_responsavel;
    if (updates.emailResponsavel !== undefined) payload.email_responsavel = updates.emailResponsavel;
    if (updates.email_responsavel !== undefined) payload.email_responsavel = updates.email_responsavel;
    if (updates.parentesco !== undefined) payload.parentesco = updates.parentesco;
    if (updates.anoLetivo !== undefined) payload.ano_letivo = updates.anoLetivo;
    if (updates.ano_letivo !== undefined) payload.ano_letivo = updates.ano_letivo;
    if (updates.situacao !== undefined) payload.situacao = updates.situacao;
    
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

  async getAulasByDiario(diarioId: number): Promise<Aula[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('diario_id', diarioId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Aula[];
  }

  async getDiarioStats(diarioId: number): Promise<{
    alunosMatriculados: number;
    aulasCount: number;
  }> {
    try {
      const { data: vinculos, error: e1 } = await supabase
        .from('diario_alunos')
        .select('aluno_id')
        .eq('diario_id', diarioId);

      if (e1) throw e1;

      const { data: aulas, error: e2 } = await supabase
        .from('aulas')
        .select('id')
        .eq('diario_id', diarioId);

      if (e2) throw e2;

      return {
        alunosMatriculados: (vinculos ?? []).length,
        aulasCount: (aulas ?? []).length
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do diário:', error);
      return {
        alunosMatriculados: 0,
        aulasCount: 0
      };
    }
  }

  async getDiariosWithStats(professorId: number): Promise<Array<Diario & { stats: { alunosMatriculados: number; aulasCount: number } }>> {
    try {
      const diarios = await this.getDiariosByProfessor(professorId);
      
      const diarioStats = await Promise.all(
        diarios.map(async (diario) => ({
          ...diario,
          stats: await this.getDiarioStats(diario.id)
        }))
      );

      return diarioStats;
    } catch (error) {
      console.error('Erro ao buscar diários com estatísticas:', error);
      return [];
    }
  }

  async createAula(aula: Omit<Aula, 'id' | 'created_at' | 'updated_at'>): Promise<Aula> {
    const payload: any = {
      diario_id: aula.diario_id ?? aula.diarioId,
      data: aula.data,
      hora_inicio: aula.hora_inicio ?? aula.horaInicio ?? null,
      hora_fim: aula.hora_fim ?? aula.horaFim ?? null,
      conteudo: aula.conteudo ?? null,
      observacoes: aula.observacoes ?? null,
      quantidade_aulas: aula.quantidade_aulas ?? aula.quantidadeAulas ?? 1,
      tipo_aula: aula.tipo_aula ?? aula.tipoAula ?? 'Teórica',
      aula_assincrona: aula.aula_assincrona ?? aula.aulaAssincrona ?? false,
      conteudo_detalhado: aula.conteudo_detalhado ?? aula.conteudoDetalhado ?? null
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
    if (updates.hora_inicio !== undefined) payload.hora_inicio = updates.hora_inicio;
    if (updates.horaInicio !== undefined) payload.hora_inicio = updates.horaInicio;
    if (updates.hora_fim !== undefined) payload.hora_fim = updates.hora_fim;
    if (updates.horaFim !== undefined) payload.hora_fim = updates.horaFim;
    if (updates.conteudo !== undefined) payload.conteudo = updates.conteudo;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;
    if (updates.quantidade_aulas !== undefined) payload.quantidade_aulas = updates.quantidade_aulas;
    if (updates.quantidadeAulas !== undefined) payload.quantidade_aulas = updates.quantidadeAulas;
    if (updates.tipo_aula !== undefined) payload.tipo_aula = updates.tipo_aula;
    if (updates.tipoAula !== undefined) payload.tipo_aula = updates.tipoAula;
    if (updates.aula_assincrona !== undefined) payload.aula_assincrona = updates.aula_assincrona;
    if (updates.aulaAssincrona !== undefined) payload.aula_assincrona = updates.aulaAssincrona;
    if (updates.conteudo_detalhado !== undefined) payload.conteudo_detalhado = updates.conteudo_detalhado;
    if (updates.conteudoDetalhado !== undefined) payload.conteudo_detalhado = updates.conteudoDetalhado;

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

    try {
      const aulaIds = Array.from(new Set(presencas.map(p => p.aula_id ?? p.aulaId).filter(Boolean)));

      if (aulaIds.length > 0) {
        const { error: delError } = await supabase
          .from('presencas')
          .delete()
          .in('aula_id', aulaIds as number[]);

        if (delError) {
          console.error('Erro ao deletar presenças antigas:', delError);
          throw delError;
        }
      }

      const payload = presencas.map(p => ({
        aula_id: p.aula_id ?? p.aulaId,
        aluno_id: p.aluno_id ?? p.alunoId,
        status: p.status,
        aula_sequencia: p.aula_sequencia ?? 1
      }));

      const { error: insertError } = await supabase
        .from('presencas')
        .insert(payload);

      if (insertError) {
        console.error('Erro ao inserir presenças:', insertError);
        console.error('Payload:', JSON.stringify(payload, null, 2));
        throw insertError;
      }

      this.dispatchDataUpdated('presencas');
    } catch (error) {
      console.error('Erro em savePresencas:', error);
      throw error;
    }
  }

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

  async getNotasByAvaliacao(avaliacaoId: number): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('avaliacao_id', avaliacaoId)
      .order('id', { ascending: true});

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

  async saveNota(params: { 
    avaliacaoId: number; 
    alunoId: number; 
    nota: number 
  }): Promise<void> {
    try {
      const { data: existing, error: searchError } = await supabase
        .from('notas')
        .select('id')
        .eq('avaliacao_id', params.avaliacaoId)
        .eq('aluno_id', params.alunoId)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('notas')
          .update({ 
            valor: params.nota,
            updated_at: nowIso()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('notas')
          .insert({
            avaliacao_id: params.avaliacaoId,
            aluno_id: params.alunoId,
            valor: params.nota
          });

        if (insertError) throw insertError;
      }

      this.dispatchDataUpdated('notas');
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      throw error;
    }
  }

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
      diario_id: ocorrencia.diario_id ?? ocorrencia.diarioId ?? null,
      tipo: ocorrencia.tipo,
      data: ocorrencia.data,
      descricao: ocorrencia.descricao,
      acao_tomada: ocorrencia.acao_tomada ?? ocorrencia.acaoTomada ?? null
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
    if (updates.diario_id !== undefined) payload.diario_id = updates.diario_id;
    if (updates.diarioId !== undefined) payload.diario_id = updates.diarioId;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.descricao !== undefined) payload.descricao = updates.descricao;
    if (updates.acao_tomada !== undefined) payload.acao_tomada = updates.acao_tomada;
    if (updates.acaoTomada !== undefined) payload.acao_tomada = updates.acaoTomada;

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

  async getComunicados(): Promise<Comunicado[]> {
    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(withCamel) as Comunicado[];
  }

  async getComunicadosParaAluno(alunoId: number): Promise<Comunicado[]> {
    const { data: aluno } = await supabase
      .from('alunos')
      .select('turma_id')
      .eq('id', alunoId)
      .single();

    if (!aluno) return [];

    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .or(`and(turma_id.is.null,usuario_id.is.null),turma_id.eq.${aluno.turma_id},usuario_id.eq.${alunoId}`)
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
      autor: comunicado.autor ?? null,
      autor_id: comunicado.autor_id ?? comunicado.autorId ?? 1,
      data_publicacao: comunicado.data_publicacao ?? comunicado.dataPublicacao ?? new Date().toISOString().split('T')[0]
    };

    if (comunicado.turma_id || comunicado.turmaId) {
      payload.turma_id = comunicado.turma_id ?? comunicado.turmaId;
    }
    
    if (comunicado.usuario_id || comunicado.usuarioId) {
      payload.usuario_id = comunicado.usuario_id ?? comunicado.usuarioId;
    }

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
    if (updates.autor !== undefined) payload.autor = updates.autor;
    if (updates.autor_id !== undefined) payload.autor_id = updates.autor_id;
    if (updates.autorId !== undefined) payload.autor_id = updates.autorId;
    if (updates.data_publicacao !== undefined) payload.data_publicacao = updates.data_publicacao;
    if (updates.dataPublicacao !== undefined) payload.data_publicacao = updates.dataPublicacao;
    
    if (updates.turma_id !== undefined) payload.turma_id = updates.turma_id;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId;
    if (updates.usuario_id !== undefined) payload.usuario_id = updates.usuario_id;
    if (updates.usuarioId !== undefined) payload.usuario_id = updates.usuarioId;

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
    const alunoIdFinal = sanitizeAlunoId(recado.aluno_id ?? recado.alunoId);

    const payload: any = {
      titulo: recado.titulo,
      mensagem: recado.mensagem,
      professor_id: recado.professor_id ?? recado.professorId,
      professor_nome: recado.professor_nome ?? recado.professorNome ?? '',
      turma_id: recado.turma_id ?? recado.turmaId,
      turma_nome: recado.turma_nome ?? recado.turmaNome ?? '',
      aluno_id: alunoIdFinal,
      aluno_nome: alunoIdFinal ? (recado.aluno_nome ?? recado.alunoNome ?? null) : null,
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

    if (updates.aluno_id !== undefined || updates.alunoId !== undefined) {
      const alunoIdFinal = sanitizeAlunoId(updates.aluno_id ?? updates.alunoId);
      payload.aluno_id = alunoIdFinal;
      payload.aluno_nome = alunoIdFinal ? (updates.aluno_nome ?? updates.alunoNome ?? null) : null;
    }

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

  async getProfessoresByDisciplina(disciplinaId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('professor_disciplinas')
      .select('professor_id')
      .eq('disciplina_id', disciplinaId);

    if (error) throw error;

    const ids = (data ?? []).map((row: any) => row.professor_id).filter((id: any) => id !== null && id !== undefined);
    return ids as number[];
  }

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

  aasync finalizarDiario(diarioId: number, usuarioId: number): Promise<boolean> {
  try {
    console.log('🔵 finalizarDiario chamado com:', { diarioId, usuarioId });
    
    // Validar usuário
    if (!usuarioId || isNaN(usuarioId) || usuarioId <= 0) {
      console.error('❌ ID do usuário inválido:', usuarioId);
      throw new Error('ID do usuário inválido');
    }

    // Buscar usuário para validar se existe e se é coordenador
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, papel')
      .eq('id', usuarioId)
      .maybeSingle();

    if (usuarioError) {
      console.error('❌ Erro ao buscar usuário:', usuarioError);
      throw new Error(`Erro ao validar usuário: ${usuarioError.message}`);
    }

    if (!usuario) {
      console.error('❌ Usuário não encontrado com ID:', usuarioId);
      throw new Error('Usuário não identificado. Tente fazer login novamente.');
    }

    console.log('✅ Usuário validado:', usuario);

    // Validar se é coordenador
    if (usuario.papel !== 'COORDENADOR') {
      console.error('❌ Usuário não é coordenador:', usuario);
      throw new Error('Apenas coordenadores podem finalizar diários.');
    }

    // Buscar o diário
    const diario = await this.getDiarioById(diarioId);
    if (!diario) {
      console.error('❌ Diário não encontrado:', diarioId);
      throw new Error('Diário não encontrado');
    }

    console.log('📋 Diário encontrado:', diario);

    // Validar status atual
    if (diario.status === 'FINALIZADO') {
      console.warn('⚠️ Diário já está finalizado');
      throw new Error('Este diário já foi finalizado.');
    }

    if (diario.status !== 'ENTREGUE') {
      console.warn('⚠️ Diário não está no status ENTREGUE:', diario.status);
      throw new Error('Apenas diários entregues podem ser finalizados.');
    }

    // Atualizar histórico
    const historico_status = this.pushHistoricoStatus(diario, 'FINALIZADO');
    
    // Adicionar informações de quem finalizou
    const historicoComUsuario = historico_status.map((h: any, index: number) => {
      if (index === historico_status.length - 1) {
        return {
          ...h,
          usuario_id: usuarioId,
          usuario_nome: usuario.papel
        };
      }
      return h;
    });

    console.log('📝 Atualizando diário para FINALIZADO...');

    // Atualizar o diário
    const resultado = await this.updateDiario(diarioId, { 
      status: 'FINALIZADO', 
      historico_status: historicoComUsuario,
      solicitacao_devolucao: null // Limpar qualquer solicitação de devolução
    });
    
    if (!resultado) {
      console.error('❌ Falha ao atualizar diário');
      throw new Error('Falha ao atualizar o diário');
    }

    console.log('✅ Diário finalizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro em finalizarDiario:', error);
    
    // Re-lançar erro com mensagem amigável
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao finalizar diário');
  }
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

  async getBoletimAluno(diarioId: number, alunoId: number): Promise<{
    mediaGeral: number;
    frequencia: number;
    situacao: string;
    totalAulas: number;
    presencas: number;
    faltas: number;
    notas: Array<{
      avaliacaoId: number;
      avaliacaoTitulo: string;
      avaliacaoTipo: string;
      avaliacaoData: string;
      nota: number;
      peso: number;
    }>;
  }> {
    try {
      const avaliacoes = await this.getAvaliacoesByDiario(diarioId);
      const todasNotas = await this.getNotasByAluno(alunoId);
      const notasDoDiario = todasNotas.filter(n => 
        avaliacoes.some(av => av.id === (n.avaliacao_id ?? n.avaliacaoId))
      );

      let somaPesos = 0;
      let somaPonderada = 0;
      const notasDetalhadas = [];

      for (const av of avaliacoes) {
        const nota = notasDoDiario.find(n => (n.avaliacao_id ?? n.avaliacaoId) === av.id);
        const peso = av.peso ?? 1;
        
        if (nota) {
          somaPesos += peso;
          somaPonderada += (nota.valor ?? 0) * peso;
          
          notasDetalhadas.push({
            avaliacaoId: av.id,
            avaliacaoTitulo: av.titulo,
            avaliacaoTipo: av.tipo,
            avaliacaoData: av.data,
            nota: nota.valor ?? 0,
            peso: peso
          });
        }
      }

      const mediaGeral = somaPesos > 0 ? Number((somaPonderada / somaPesos).toFixed(2)) : 0;

      const aulas = await this.getAulasByDiario(diarioId);
      const aulaIds = aulas.map(a => a.id);
      
      const { data: presencasData, error } = await supabase
        .from('presencas')
        .select('*')
        .in('aula_id', aulaIds)
        .eq('aluno_id', alunoId);

      if (error) throw error;

      const presencas = (presencasData ?? []).filter(p => p.status === 'PRESENTE').length;
      const faltas = (presencasData ?? []).filter(p => p.status === 'FALTA').length;
      const totalAulas = aulas.length;
      const frequencia = totalAulas > 0 ? Number(((presencas / totalAulas) * 100).toFixed(1)) : 0;

      let situacao = 'Em Análise';
      
      if (mediaGeral > 0) {
        if (frequencia < 75) {
          situacao = 'Reprovado';
        } else if (mediaGeral >= 6.0) {
          situacao = 'Aprovado';
        } else if (mediaGeral >= 5.0) {
          situacao = 'Recuperação';
        } else {
          situacao = 'Reprovado';
        }
      }

      return {
        mediaGeral,
        frequencia,
        situacao,
        totalAulas,
        presencas,
        faltas,
        notas: notasDetalhadas
      };
    } catch (error) {
      console.error('Erro ao buscar boletim do aluno:', error);
      return {
        mediaGeral: 0,
        frequencia: 0,
        situacao: 'Sem Dados',
        totalAulas: 0,
        presencas: 0,
        faltas: 0,
        notas: []
      };
    }
  }
}

export const supabaseService = new SupabaseService();
