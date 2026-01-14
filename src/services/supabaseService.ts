// COPIAR E SUBSTITUIR A INTERFACE Professor NO supabaseService.ts

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

// SUBSTITUIR OS MÉTODOS DE PROFESSOR NA CLASSE SupabaseService

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
