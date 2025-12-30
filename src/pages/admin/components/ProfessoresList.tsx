import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabaseService, Professor } from '../../../services/supabaseService';

type FormState = {
  nome: string;
  email: string;
  contato: string;
  dataNascimento: string;
  cpf: string;
  rg: string;
  sexo: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  estado: string;
  formacao: string;
  especializacao: string;
  registro: string;
  dataAdmissao: string;
  situacao: string;
  observacoes: string;
};

const emptyForm: FormState = {
  nome: '',
  email: '',
  contato: '',
  dataNascimento: '',
  cpf: '',
  rg: '',
  sexo: '',
  endereco: '',
  bairro: '',
  cidade: '',
  cep: '',
  estado: '',
  formacao: '',
  especializacao: '',
  registro: '',
  dataAdmissao: '',
  situacao: '',
  observacoes: '',
};

export function ProfessoresList() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getProfessores();
      setProfessores(data);
    } catch (e) {
      console.error('Erro ao carregar professores:', e);
      alert('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return professores;
    return professores.filter((p) => {
      const nome = (p.nome || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      return nome.includes(q) || email.includes(q);
    });
  }, [professores, searchTerm]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }

  function openEdit(p: Professor) {
    setEditing(p);
    setForm({
      nome: p.nome || '',
      email: p.email || '',
      contato: p.contato || '',
      dataNascimento: p.data_nascimento || '',
      cpf: p.cpf || '',
      rg: p.rg || '',
      sexo: p.sexo || '',
      endereco: p.endereco || '',
      bairro: p.bairro || '',
      cidade: p.cidade || '',
      cep: p.cep || '',
      estado: p.estado || '',
      formacao: p.formacao || '',
      especializacao: p.especializacao || '',
      registro: p.registro || '',
      dataAdmissao: p.data_admissao || '',
      situacao: p.situacao || '',
      observacoes: p.observacoes || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      alert('Nome e e-mail são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        contato: form.contato.trim() || null,
        data_nascimento: form.dataNascimento.trim() || null,
        cpf: form.cpf.trim() || null,
        rg: form.rg.trim() || null,
        sexo: form.sexo.trim() || null,
        endereco: form.endereco.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        cep: form.cep.trim() || null,
        estado: form.estado.trim() || null,
        formacao: form.formacao.trim() || null,
        especializacao: form.especializacao.trim() || null,
        registro: form.registro.trim() || null,
        data_admissao: form.dataAdmissao.trim() || null,
        situacao: form.situacao.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };

      if (editing) {
        await supabaseService.updateProfessor(editing.id, payload);
      } else {
        await supabaseService.createProfessor(payload);
      }

      setIsDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadData();
    } catch (e) {
      console.error('Erro ao salvar professor:', e);
      alert('Erro ao salvar professor (verifique RLS/policies e colunas no banco)');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(p: Professor) {
    const ok = confirm(`Excluir professor "${p.nome}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await supabaseService.deleteProfessor(p.id);
      await loadData();
    } catch (e) {
      console.error('Erro ao excluir professor:', e);
      alert('Erro ao excluir professor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Professores</CardTitle>
            <CardDescription>Cadastro de professores (salvando no Supabase)</CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Novo professor
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar professor' : 'Novo professor'}</DialogTitle>
                <DialogDescription>Preencha os dados e salve.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Input value={form.contato} onChange={(e) => setForm((s) => ({ ...s, contato: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Data de nascimento</Label>
                  <Input value={form.dataNascimento} onChange={(e) => setForm((s) => ({ ...s, dataNascimento: e.target.value }))} placeholder="YYYY-MM-DD" />
                </div>

                <div className="space-y-2">
                  <Label>Formação</Label>
                  <Input value={form.formacao} onChange={(e) => setForm((s) => ({ ...s, formacao: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Input value={form.situacao} onChange={(e) => setForm((s) => ({ ...s, situacao: e.target.value }))} placeholder="ATIVO / INATIVO" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4">
          <Input placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.nome}</div>
                <div className="text-sm text-muted-foreground truncate">{p.email}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)} disabled={loading}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(p)} disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum professor encontrado.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfessoresList;
