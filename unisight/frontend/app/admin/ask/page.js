'use client';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { SafeTip, CHART_PALETTE } from '@/lib/chart';
import toast from 'react-hot-toast';

const CHART_TYPES = { bar: BarChart, line: LineChart, pie: PieChart };

function DynamicChart({ result }) {
  const data = result?.data || [];
  const type = result?.chartType || 'bar';
  if (!data.length) return null;
  const keys = Object.keys(data[0] || {}).filter(k => typeof data[0][k] === 'number');

  if (type === 'pie') {
    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie 
              data={data} 
              dataKey={keys[0]} 
              nameKey={Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string')} 
              cx="50%" 
              cy="50%" 
              outerRadius={100}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell 
                  key={i} 
                  fill={CHART_PALETTE[i % CHART_PALETTE.length]} 
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<SafeTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    const catKey = Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string') || 'name';
    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
            <XAxis dataKey={catKey} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<SafeTip />} />
            {keys.map((k, i) => (
              <Line 
                key={k} 
                type="monotone" 
                dataKey={k} 
                stroke={CHART_PALETTE[i]} 
                strokeWidth={2.5}
                dot={{ fill: CHART_PALETTE[i], r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const catKey = Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string') || 'name';
  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.045)" />
          <XAxis dataKey={catKey} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<SafeTip />} />
          {keys.map((k, i) => (
            <Bar 
              key={k} 
              dataKey={k} 
              fill={CHART_PALETTE[i]} 
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const h = localStorage.getItem('nl-query-history');
      return h ? JSON.parse(h) : [];
    }
    return [];
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/ask', { question: query }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      const entry = { query, answer: data.answer, ts: new Date().toISOString() };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('nl-query-history', JSON.stringify(updated));
    },
    onError: () => toast.error('AI query failed. Try rephrasing.'),
  });

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mutation.mutate(); } };

  const EXAMPLES = [
    'Which department has the most at-risk students?',
    'Show me CGPA trend over the last 4 semesters',
    'Which faculty has the highest effectiveness score?'
  ];

  return (
    <div className="dashboard-content">
      <PageHeader 
        title="💬 Admin AI Query" 
        subtitle="Ask any question about your university data in plain English" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container mb-6"
      >
        <div style={{ display: 'flex', gap: 2.5, marginBottom: 14 }}>
          <textarea 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={handleKey}
            placeholder="e.g. Which department has the most dropouts?" 
            className="input-field flex-1"
            style={{ 
              resize: 'none', 
              height: 56, 
              lineHeight: 1.5, 
              paddingTop: 14,
              fontSize: 15
            }} 
          />
          <motion.button 
            onClick={() => mutation.mutate()} 
            disabled={!query.trim() || mutation.isPending}
            whileHover={{ scale: query.trim() ? 1.02 : 1 }}
            whileTap={{ scale: query.trim() ? 0.98 : 1 }}
            className="w-14 h-14 rounded-xl border-none flex items-center justify-center text-xl"
            style={{ 
              background: query.trim() 
                ? 'linear-gradient(135deg,#6366f1,#7c3aed)' 
                : 'rgba(255,255,255,0.04)',
              color: 'white', 
              cursor: query.trim() ? 'pointer' : 'default',
              boxShadow: query.trim() ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
              flexShrink: 0,
            }}
          >
            {mutation.isPending ? (
              <span className="spinner" />
            ) : (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            )}
          </motion.button>
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {EXAMPLES.map((ex, i) => (
            <motion.button
              key={i}
              onClick={() => { setQuery(ex); setResult(null); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
              style={{ 
                background: 'rgba(99,102,241,0.08)', 
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8',
                minHeight: '36px',
              }}
            >
              {ex}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {mutation.isPending && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="chart-container mb-6"
          >
            <div className="chart-title">🤖 AI is thinking...</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8 }}>
              <motion.div 
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#6366f1' }}
              />
              <motion.div 
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#6366f1' }}
              />
              <motion.div 
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#6366f1' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="chart-container mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
              >
                🤖
              </motion.div>
              <div className="chart-title mb-0">AI Answer</div>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: 15, color: '#f1f5f9', lineHeight: 1.8, marginBottom: 20 }}
            >
              {result.answer}
            </motion.p>
            {result.data?.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DynamicChart result={result} />
                </motion.div>
                {result.sql && (
                  <p style={{ marginTop: 12, fontSize: 10, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Query: {result.sql.substring(0, 120)}...
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="chart-container"
        >
          <div className="chart-title">🕘 Recent Queries</div>
          {history.slice(0, 5).map((h, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ 
                padding: '12px 0', 
                borderBottom: '1px solid rgba(255,255,255,0.04)', 
                cursor: 'pointer' 
              }}
              onClick={() => { setQuery(h.query); setResult(null); }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#818cf8' }}>{h.query}</p>
              <p className="text-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: '#64748b' }}>
                {h.answer?.substring(0, 80)}...
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
