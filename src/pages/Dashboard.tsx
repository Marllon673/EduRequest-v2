import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRequest } from '../types';
import { Clock, CheckCircle, AlertCircle, List, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<AcademicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    analise: 0,
    concluida: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      
      try {
        let q = query(
          collection(db, 'requests'),
          where('usuarioId', '==', profile.id),
          orderBy('dataCriacao', 'desc')
        );

        if (profile.tipo === 'Admin') {
          q = query(collection(db, 'requests'), orderBy('dataCriacao', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const fetchedRequests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AcademicRequest[];

        setRequests(fetchedRequests.slice(0, 5));
        
        const newStats = fetchedRequests.reduce((acc, req) => {
          acc.total++;
          if (req.status === 'Pendente') acc.pendente++;
          if (req.status === 'Em análise') acc.analise++;
          if (req.status === 'Concluída') acc.concluida++;
          return acc;
        }, { total: 0, pendente: 0, analise: 0, concluida: 0 });
        
        setStats(newStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>)}
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
  </div>;

  const statCards = [
    { label: 'Pendentes', value: stats.pendente, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Em Análise', value: stats.analise, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Concluídas', value: stats.concluida, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total', value: stats.total, icon: List, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold dark:text-slate-200">Olá, {profile?.nome.split(' ')[0]} 👋</h2>
          <p className="text-slate-600 dark:text-slate-400">Bem-vindo ao seu painel acadêmico.</p>
        </div>
        <Link to="/nova-solicitacao" className="btn btn-primary flex items-center justify-center space-x-2">
          <Plus size={20} />
          <span>Nova Solicitação</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card flex flex-col items-center justify-center text-center p-6 hover:scale-105 transition-transform">
            <div className={cn("p-3 rounded-full mb-3", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <span className="text-2xl font-bold dark:text-slate-200">{stat.value}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold dark:text-slate-200">Solicitações Recentes</h3>
          <Link to="/solicitacoes" className="text-primary hover:underline text-sm font-medium flex items-center">
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {requests.length > 0 ? (
            requests.map((req) => (
              <Link key={req.id} to={`/solicitacoes/${req.id}`} className="card flex items-center justify-between hover:border-primary transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-2 h-12 rounded-full",
                    req.status === 'Pendente' ? "bg-amber-500" : 
                    req.status === 'Em análise' ? "bg-blue-500" : "bg-emerald-500"
                  )} />
                  <div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors dark:text-slate-200">{req.titulo}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(req.dataCriacao), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium hidden sm:block",
                    req.prioridade === 'Alta' ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
                    req.prioridade === 'Média' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                  )}>
                    {req.prioridade}
                  </span>
                  <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                </div>
              </Link>
            ))
          ) : (
            <div className="card text-center py-12">
              <p className="text-slate-500 dark:text-slate-300">Nenhuma solicitação encontrada.</p>
              <Link to="/nova-solicitacao" className="text-primary hover:underline font-medium mt-2 inline-block">
                Criar minha primeira solicitação
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
