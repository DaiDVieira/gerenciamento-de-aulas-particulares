import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, FileText } from 'lucide-react';

const Relatorios = () => {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState<any>(null);

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período do relatório');
      return;
    }

    try {
      const { data: aulas, error } = await supabase
        .from('aulas')
        .select('*, professores(nome, sobrenome)')
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (error) throw error;

      const totalAulas = aulas?.length || 0;
      const faturamentoTotal = aulas?.reduce((sum, aula) => sum + (aula.valor_aula || 0), 0) || 0;
      const custoTotal = aulas?.reduce((sum, aula) => sum + (aula.valor_professor || 0), 0) || 0;
      const lucroTotal = faturamentoTotal - custoTotal;

      setRelatorio({
        totalAulas,
        faturamentoTotal,
        custoTotal,
        lucroTotal,
      });

      toast.success('Relatório gerado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/gerenciamento')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Relatório Financeiro</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={gerarRelatorio} className="w-full gap-2">
            <FileText size={18} />
            Gerar Relatório
          </Button>
        </Card>

        {relatorio && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Resumo Financeiro</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total de Aulas:</span>
                <span className="font-bold">{relatorio.totalAulas}</span>
              </div>
              <div className="flex justify-between">
                <span>Faturamento Total:</span>
                <span className="font-bold text-green-600">
                  R$ {relatorio.faturamentoTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Custo com Professores:</span>
                <span className="font-bold text-red-600">
                  R$ {relatorio.custoTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold">Lucro Total:</span>
                <span className="font-bold text-primary text-lg">
                  R$ {relatorio.lucroTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
