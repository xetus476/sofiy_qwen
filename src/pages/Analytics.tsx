import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, getMonthNameShort } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export function Analytics() {
  const { user, categories, transactions } = useAppContext();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  // Generate monthly data from transactions
  const monthlyData = useMemo(() => {
    const now = new Date();
    const data: { month: string; income: number; expenses: number }[] = [];
    
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNum = d.getMonth() + 1;
      const year = d.getFullYear();
      
      let income = 0;
      let expenses = 0;
      
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() + 1 === monthNum && tDate.getFullYear() === year) {
          if (t.type === 'income') {
            income += Number(t.amount);
          } else {
            expenses += Number(t.amount);
          }
        }
      });

      // If no transactions, use income as default
      if (income === 0 && expenses === 0) {
        income = user.monthly_income;
      }
      
      data.push({
        month: getMonthNameShort(monthNum),
        income,
        expenses,
      });
    }
    
    return data;
  }, [transactions, period, user.monthly_income]);

  // Category expenses for current month
  const categoryExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const catMap: Record<string, { category: typeof categories[0]; amount: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear && t.type === 'expense') {
        const cat = categories.find(c => c.id === t.category_id);
        if (cat) {
          if (!catMap[t.category_id]) {
            catMap[t.category_id] = { category: cat, amount: 0 };
          }
          catMap[t.category_id].amount += Number(t.amount);
        }
      }
    });
    
    const total = Object.values(catMap).reduce((sum, c) => sum + c.amount, 0);
    
    return Object.values(catMap)
      .map(c => ({
        ...c,
        percentage: total > 0 ? (c.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const totalIncome = monthlyData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const avgIncome = totalIncome / monthlyData.length;
  const avgExpenses = totalExpenses / monthlyData.length;
  const savings = totalIncome - totalExpenses;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold">📈 Аналитика</h1>

      {/* Period Switcher */}
      <div className="flex gap-2">
        {([3, 6, 12] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {p} мес
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
          <p className="text-[10px] text-green-600 dark:text-green-400">Ср. доход</p>
          <p className="text-sm font-bold text-green-700 dark:text-green-300">
            {formatCurrency(avgIncome)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
          <p className="text-[10px] text-red-600 dark:text-red-400">Ср. расход</p>
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {formatCurrency(avgExpenses)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
          <p className="text-[10px] text-blue-600 dark:text-blue-400">Сбережения</p>
          <p className={`text-sm font-bold ${savings >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {formatCurrency(savings)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)]">
        <h3 className="text-sm font-semibold mb-3">Доходы vs Расходы</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}к`} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Доходы" />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Расходы" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      {categoryExpenses.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)]">
          <h3 className="text-sm font-semibold mb-3">Расходы по категориям</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category.name"
                >
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryExpenses.map((item) => (
              <div key={item.category.id} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.category.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.category.icon} {item.category.name} ({Math.round(item.percentage)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)]">
        <h3 className="text-sm font-semibold mb-3">Сводка по месяцам</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-2 font-medium">Месяц</th>
                <th className="text-right py-2 font-medium">Доход</th>
                <th className="text-right py-2 font-medium">Расход</th>
                <th className="text-right py-2 font-medium">±</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row) => {
                const diff = row.income - row.expenses;
                return (
                  <tr key={row.month} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2 font-medium">{row.month}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(row.income)}</td>
                    <td className="py-2 text-right text-red-600">{formatCurrency(row.expenses)}</td>
                    <td className={`py-2 text-right font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
