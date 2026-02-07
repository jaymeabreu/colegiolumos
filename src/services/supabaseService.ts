// FUNÇÃO CORRIGIDA PARA COLOCAR NO supabaseService.ts
// Substitua a função createUsuario existente por esta:

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

    // Adiciona aluno_id ou professor_id apenas se forem definidos e não nulos
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
