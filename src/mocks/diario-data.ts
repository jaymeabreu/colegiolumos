export const alunosData: Array<{
  id: number
  nome: string
  matricula: string
  contato: string
}> = []

export const aulasData: Array<{
  id: number
  data: string
  conteudo: string
  materiais: string
  observacoes: string
  presentes: number
  faltas: number
}> = []

export const avaliacoesData: Array<{
  id: number
  titulo: string
  data: string
  tipo: string
  peso: number
  notas: { alunoId: number; valor: number }[]
}> = []

export const ocorrenciasData: Array<{
  id: number
  alunoId: number
  data: string
  tipo: string
  descricao: string
  acaoTomada: string
}> = []
