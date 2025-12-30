// src/services/mockData.ts
// Shim temporário: mantém o "contrato" antigo do mockDataService
// enquanto você migra a aplicação para Supabase.

export interface Diario {
  id: number;
  turmaId: number;
  disciplinaId: number;
  professorId: number;
  bimestre: number;
  status: 'PENDENTE' | 'ENTREGUE' | 'DEVOLVIDO' | 'FINALIZADO';
  createdAt: string;
  updatedAt: string;
}

// Se outras telas importarem mais tipos daqui, você adiciona aos poucos.
// O build só precisa que os imports existentes encontrem exports válidos.

class MockDataServiceShim {
  // ---- DIÁRIOS (usado no src/pages/professor/page.tsx) ----
  getDiariosByProfessor(_professorId: number): Diario[] {
    console.warn('[mockDataService] getDiariosByProfessor ainda não migrado para Supabase.');
    return [];
  }

  getDiarios(): Diario[] {
    console.warn('[mockDataService] getDiarios ainda não migrado para Supabase.');
    return [];
  }

  // ---- TURMAS / DISCIPLINAS / ALUNOS (muito usado) ----
  getTurmas(): any[] {
    console.warn('[mockDataService] getTurmas ainda não migrado para Supabase.');
    return [];
  }

  getDisciplinas(): any[] {
    console.warn('[mockDataService] getDisciplinas ainda não migrado para Supabase.');
    return [];
  }

  getAlunos(): any[] {
    console.warn('[mockDataService] getAlunos ainda não migrado para Supabase.');
    return [];
  }

  getAlunosByDiario(_diarioId: number): any[] {
    console.warn('[mockDataService] getAlunosByDiario ainda não migrado para Supabase.');
    return [];
  }

  // ---- AULAS / AVALIAÇÕES / PRESENÇAS (usado no diário) ----
  getAulasByDiario(_diarioId: number): any[] {
    console.warn('[mockDataService] getAulasByDiario ainda não migrado para Supabase.');
    return [];
  }

  getAvaliacoesByDiario(_diarioId: number): any[] {
    console.warn('[mockDataService] getAvaliacoesByDiario ainda não migrado para Supabase.');
    return [];
  }

  getPresencasByAula(_aulaId: number): any[] {
    console.warn('[mockDataService] getPresencasByAula ainda não migrado para Supabase.');
    return [];
  }

  // ---- USUÁRIOS / COMUNICADOS (admin/coordenador) ----
  getUsuarios(): any[] {
    console.warn('[mockDataService] getUsuarios ainda não migrado para Supabase.');
    return [];
  }

  createUsuario(_data: any): boolean {
    console.warn('[mockDataService] createUsuario ainda não migrado para Supabase.');
    return false;
  }

  deleteUsuario(_id: number): boolean {
    console.warn('[mockDataService] deleteUsuario ainda não migrado para Supabase.');
    return false;
  }

  getComunicados(): any[] {
    console.warn('[mockDataService] getComunicados ainda não migrado para Supabase.');
    return [];
  }

  // ---- PERMISSÕES / STATUS (usado em várias telas) ----
  professorPodeEditarDiario(_diario: any, _professorId: number): boolean {
    return true;
  }

  coordenadorPodeGerenciarDiario(_diario: any): boolean {
    return true;
  }

  entregarDiario(_diarioId: number): boolean {
    console.warn('[mockDataService] entregarDiario ainda não migrado para Supabase.');
    return false;
  }

  devolverDiario(_diarioId: number): boolean {
    console.warn('[mockDataService] devolverDiario ainda não migrado para Supabase.');
    return false;
  }

  finalizarDiario(_diarioId: number): boolean {
    console.warn('[mockDataService] finalizarDiario ainda não migrado para Supabase.');
    return false;
  }

  solicitarDevolucaoDiario(_diarioId: number): boolean {
    console.warn('[mockDataService] solicitarDevolucaoDiario ainda não migrado para Supabase.');
    return false;
  }

  // ---- compat: algumas telas chamam getData() ----
  getData(): any {
    return {
      usuarios: [],
      turmas: [],
      disciplinas: [],
      alunos: [],
      diarios: [],
      aulas: [],
      avaliacoes: [],
      presencas: [],
      comunicados: [],
    };
  }
}

export const mockDataService = new MockDataServiceShim();
