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
  if (mediaGeral >= 7 && frequencia >= 75) {
    situacao = 'Aprovado';
  } else if (mediaGeral < 5 || frequencia < 75) {
    situacao = 'Reprovado';
  } else if (mediaGeral >= 5 && mediaGeral < 7) {
    situacao = 'Recuperação';
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
