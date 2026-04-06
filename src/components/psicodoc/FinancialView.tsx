import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Wallet, Plus, Tag, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface FinancialTransaction {
  id: string;
  categoryId?: string;
  appointmentId?: string;
  patientId?: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  transactionDate: string;
}

interface Patient {
  id: string;
  name: string;
}

interface FinancialViewProps {
  categories: FinancialCategory[];
  setCategories: React.Dispatch<React.SetStateAction<FinancialCategory[]>>;
  transactions: FinancialTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  patients: Patient[];
  primaryColor: PrimaryColor;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  categories,
  setCategories,
  transactions,
  setTransactions,
  patients,
  primaryColor,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // New Transaction Form
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    categoryId: '',
    patientId: '',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // New Category Form
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    color: '#6366f1',
  });

  // Filter transactions for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.transactionDate);
      return date >= monthStart && date <= monthEnd;
    });
  }, [transactions, monthStart, monthEnd]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  // Chart data for last 6 months
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentMonth, i);
      const monthS = startOfMonth(month);
      const monthE = endOfMonth(month);
      
      const monthTx = transactions.filter(t => {
        const date = new Date(t.transactionDate);
        return date >= monthS && date <= monthE;
      });

      const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: format(month, 'MMM', { locale: ptBR }),
        receitas: income,
        despesas: expense,
      });
    }
    return data;
  }, [transactions, currentMonth]);

  // Category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    monthTransactions.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat?.name || 'Sem categoria';
      
      if (t.type === 'income') {
        incomeByCategory[catName] = (incomeByCategory[catName] || 0) + t.amount;
      } else {
        expenseByCategory[catName] = (expenseByCategory[catName] || 0) + t.amount;
      }
    });

    return {
      income: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    };
  }, [monthTransactions, categories]);

  // DRE (Monthly P&L) data
  const dreData = useMemo(() => {
    const yearStart = startOfYear(currentMonth);
    const yearEnd = endOfYear(currentMonth);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    let accumulated = 0;
    return months.map(month => {
      const ms = startOfMonth(month);
      const me = endOfMonth(month);
      const monthTx = transactions.filter(t => {
        const d = new Date(t.transactionDate);
        return d >= ms && d <= me;
      });

      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = income - expense;
      accumulated += net;

      // Breakdown by category
      const incomeByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};
      monthTx.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat?.name || 'Sem categoria';
        if (t.type === 'income') {
          incomeByCategory[catName] = (incomeByCategory[catName] || 0) + t.amount;
        } else {
          expenseByCategory[catName] = (expenseByCategory[catName] || 0) + t.amount;
        }
      });

      return {
        month: format(month, 'MMM', { locale: ptBR }),
        monthFull: format(month, 'MMMM', { locale: ptBR }),
        income,
        expense,
        net,
        accumulated,
        margin: income > 0 ? ((net / income) * 100).toFixed(1) : '0.0',
        incomeByCategory,
        expenseByCategory,
        isPast: month <= new Date(),
      };
    });
  }, [transactions, currentMonth, categories]);

  // Revenue projection (average of last 3 months with data)
  const projection = useMemo(() => {
    const monthsWithData = dreData.filter(d => d.isPast && (d.income > 0 || d.expense > 0));
    const last3 = monthsWithData.slice(-3);
    if (last3.length === 0) return { avgIncome: 0, avgExpense: 0, avgNet: 0 };
    const avgIncome = last3.reduce((s, d) => s + d.income, 0) / last3.length;
    const avgExpense = last3.reduce((s, d) => s + d.expense, 0) / last3.length;
    return { avgIncome, avgExpense, avgNet: avgIncome - avgExpense };
  }, [dreData]);

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.description || !newTransaction.amount) return;

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          type: newTransaction.type,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category_id: newTransaction.categoryId || null,
          patient_id: newTransaction.patientId || null,
          transaction_date: newTransaction.transactionDate,
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [{
        id: data.id,
        type: data.type as 'income' | 'expense',
        description: data.description,
        amount: parseFloat(data.amount as unknown as string),
        categoryId: data.category_id || undefined,
        patientId: data.patient_id || undefined,
        transactionDate: data.transaction_date,
      }, ...prev]);

      setNewTransaction({
        type: 'income',
        description: '',
        amount: '',
        categoryId: '',
        patientId: '',
        transactionDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsTransactionModalOpen(false);

      toast({
        title: 'Transação adicionada!',
        description: 'A transação foi salva com sucesso.',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a transação.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async () => {
    if (!user || !newCategory.name) return;

    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert({
          user_id: user.id,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, {
        id: data.id,
        name: data.name,
        type: data.type as 'income' | 'expense',
        color: data.color || '#6366f1',
      }]);

      setNewCategory({ name: '', type: 'income', color: '#6366f1' });
      setIsCategoryModalOpen(false);

      toast({
        title: 'Categoria criada!',
        description: 'A categoria foi salva com sucesso.',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));

      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida.',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a transação.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Controle Financeiro</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Categorias
          </Button>
          <Button
            size="sm"
            onClick={() => setIsTransactionModalOpen(true)}
            style={{ background: palette.hex }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <h2 className="text-lg font-bold min-w-[200px] text-center capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button 
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Icons.ChevronRight />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Receitas</p>
              <p className="text-2xl font-black text-emerald-500">{formatCurrency(totals.income)}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Despesas</p>
              <p className="text-2xl font-black text-rose-500">{formatCurrency(totals.expense)}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <Wallet className="w-6 h-6" style={{ color: palette.hex }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Saldo</p>
              <p 
                className="text-2xl font-black"
                style={{ color: totals.balance >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {formatCurrency(totals.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Evolution Chart */}
          <div className="card-elevated p-6">
            <h3 className="font-bold mb-4">Evolução (últimos 6 meses)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receitas" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-bold mb-4 text-emerald-500">Receitas por Categoria</h3>
              {categoryDistribution.income.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution.income}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryDistribution.income.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sem receitas neste mês</p>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-bold mb-4 text-rose-500">Despesas por Categoria</h3>
              {categoryDistribution.expense.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution.expense}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryDistribution.expense.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sem despesas neste mês</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* DRE Tab */}
        <TabsContent value="dre" className="space-y-6 mt-6">
          {/* Projection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-elevated p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Projeção Receita/mês</p>
              <p className="text-xl font-black text-emerald-500">{formatCurrency(projection.avgIncome)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Média dos últimos 3 meses</p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Projeção Despesa/mês</p>
              <p className="text-xl font-black text-rose-500">{formatCurrency(projection.avgExpense)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Média dos últimos 3 meses</p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Resultado Projetado</p>
              <p className="text-xl font-black" style={{ color: projection.avgNet >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatCurrency(projection.avgNet)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Lucro líquido estimado</p>
            </div>
          </div>

          {/* DRE Chart */}
          <div className="card-elevated p-6">
            <h3 className="font-bold mb-4">Fluxo de Caixa Mensal — {format(currentMonth, 'yyyy')}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DRE Table */}
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-black text-xs uppercase tracking-wider text-muted-foreground">Mês</th>
                  <th className="text-right p-3 font-black text-xs uppercase tracking-wider text-emerald-500">Receitas</th>
                  <th className="text-right p-3 font-black text-xs uppercase tracking-wider text-rose-500">Despesas</th>
                  <th className="text-right p-3 font-black text-xs uppercase tracking-wider text-muted-foreground">Resultado</th>
                  <th className="text-right p-3 font-black text-xs uppercase tracking-wider text-muted-foreground">Margem</th>
                  <th className="text-right p-3 font-black text-xs uppercase tracking-wider text-muted-foreground">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {dreData.map((row, i) => (
                  <tr key={i} className={`border-b border-border/50 ${!row.isPast ? 'opacity-40' : ''}`}>
                    <td className="p-3 font-bold capitalize">{row.monthFull}</td>
                    <td className="p-3 text-right text-emerald-500 font-medium">{formatCurrency(row.income)}</td>
                    <td className="p-3 text-right text-rose-500 font-medium">{formatCurrency(row.expense)}</td>
                    <td className="p-3 text-right font-bold" style={{ color: row.net >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(row.net)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{row.margin}%</td>
                    <td className="p-3 text-right font-bold" style={{ color: row.accumulated >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(row.accumulated)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-black">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-right text-emerald-500">
                    {formatCurrency(dreData.reduce((s, d) => s + (d.isPast ? d.income : 0), 0))}
                  </td>
                  <td className="p-3 text-right text-rose-500">
                    {formatCurrency(dreData.reduce((s, d) => s + (d.isPast ? d.expense : 0), 0))}
                  </td>
                  <td className="p-3 text-right" style={{ 
                    color: dreData.reduce((s, d) => s + (d.isPast ? d.net : 0), 0) >= 0 ? '#22c55e' : '#ef4444' 
                  }}>
                    {formatCurrency(dreData.reduce((s, d) => s + (d.isPast ? d.net : 0), 0))}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">—</td>
                  <td className="p-3 text-right" style={{ 
                    color: (dreData.filter(d => d.isPast).pop()?.accumulated || 0) >= 0 ? '#22c55e' : '#ef4444' 
                  }}>
                    {formatCurrency(dreData.filter(d => d.isPast).pop()?.accumulated || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="card-elevated">
            {monthTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma transação neste mês</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsTransactionModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Transação
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {monthTransactions.map(transaction => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  const patient = patients.find(p => p.id === transaction.patientId);

                  return (
                    <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                          }`}
                        >
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(transaction.transactionDate), 'dd/MM/yyyy')}</span>
                            {category && (
                              <>
                                <span>•</span>
                                <span 
                                  className="px-2 py-0.5 rounded-full text-white"
                                  style={{ background: category.color }}
                                >
                                  {category.name}
                                </span>
                              </>
                            )}
                            {patient && (
                              <>
                                <span>•</span>
                                <span>{patient.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p 
                          className="font-bold"
                          style={{ color: transaction.type === 'income' ? '#22c55e' : '#ef4444' }}
                        >
                          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 hover:bg-rose-500/15 rounded-lg text-rose-500 transition-colors"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Categories */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-emerald-500">Categorias de Receita</h3>
              </div>
              <div className="space-y-2">
                {categories.filter(c => c.type === 'income').map(cat => (
                  <div 
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                ))}
                {categories.filter(c => c.type === 'income').length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhuma categoria</p>
                )}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-rose-500">Categorias de Despesa</h3>
              </div>
              <div className="space-y-2">
                {categories.filter(c => c.type === 'expense').map(cat => (
                  <div 
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                ))}
                {categories.filter(c => c.type === 'expense').length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhuma categoria</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Modal */}
      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                className={newTransaction.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Receita
              </Button>
              <Button
                type="button"
                variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                className={newTransaction.type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : ''}
                onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Despesa
              </Button>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Consulta, Aluguel..."
              />
            </div>

            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newTransaction.transactionDate}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, transactionDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Categoria (opcional)</Label>
              <Select
                value={newTransaction.categoryId}
                onValueChange={(value) => setNewTransaction(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === newTransaction.type)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {newTransaction.type === 'income' && (
              <div>
                <Label>Paciente (opcional)</Label>
                <Select
                  value={newTransaction.patientId}
                  onValueChange={(value) => setNewTransaction(prev => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular a um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleAddTransaction}
              style={{ background: newTransaction.type === 'income' ? '#22c55e' : '#ef4444' }}
            >
              Adicionar {newTransaction.type === 'income' ? 'Receita' : 'Despesa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={newCategory.type === 'income' ? 'default' : 'outline'}
                className={newCategory.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                onClick={() => setNewCategory(prev => ({ ...prev, type: 'income' }))}
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={newCategory.type === 'expense' ? 'default' : 'outline'}
                className={newCategory.type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : ''}
                onClick={() => setNewCategory(prev => ({ ...prev, type: 'expense' }))}
              >
                Despesa
              </Button>
            </div>

            <div>
              <Label>Nome da Categoria</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Consultas, Supervisão..."
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${newCategory.color === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ background: color }}
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleAddCategory}
              style={{ background: palette.hex }}
            >
              Criar Categoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialView;
