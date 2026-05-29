import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRequest, RequestStatus, RequestCategory } from '../types';
import { Search, Filter, ChevronRight, Clock, CheckCircle, AlertCircle, Star, Paperclip, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function RequestList() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<AcademicRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AcademicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'Todos'>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<RequestCategory | 'Todas'>('Todas');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = async () => {
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

      setRequests(fetchedRequests);
      setFilteredRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Tem certeza que deseja excluir esta solicitação?")) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'requests', id));
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Erro ao excluir solicitação.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let result = requests;

    if (searchTerm) {
      result = result.filter(req => 
        req.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'Todos') {
      result = result.filter(req => req.status === statusFilter);
    }

    if (categoryFilter !== 'Todas') {
      result = result.filter(req => req.categoria === categoryFilter);
    }

    setFilteredRequests(result);
  }, [searchTerm, statusFilter, categoryFilter, requests]);

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>)}
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Minhas Solicitações</h2>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
            <input
              type="text"
              className="input pl-10"
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select 
          className="btn btn-secondary text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Em análise">Em análise</option>
          <option value="Concluída">Concluída</option>
        </select>

        <select 
          className="btn btn-secondary text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
        >
          <option value="Todas">Todas as Categorias</option>
          <option value="Acadêmico">Acadêmico</option>
          <option value="Financeiro">Financeiro</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <Link key={req.id} to={`/solicitacoes/${req.id}`} className="card flex items-center justify-between hover:border-primary transition-colors group">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "p-2 rounded-full",
                  req.status === 'Pendente' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : 
                  req.status === 'Em análise' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" : 
                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
                )}>
                  {req.status === 'Pendente' ? <Clock size={20} /> : 
                   req.status === 'Em análise' ? <AlertCircle size={20} /> : 
                   <CheckCircle size={20} />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold group-hover:text-primary transition-colors dark:text-slate-200">{req.titulo}</h4>
                    {req.importante && <Star size={14} className="fill-amber-400 text-amber-400" />}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{req.categoria}</span>
                    <span>•</span>
                    <span>{format(new Date(req.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {req.arquivos && req.arquivos.length > 0 && (
                      <>
                        <span>•</span>
                        <Paperclip size={12} className="text-slate-400 dark:text-slate-600" />
                        <span>{req.arquivos.length}</span>
                      </>
                    )}
                  </div>
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
                
                {(profile?.tipo === 'Admin' || (req.usuarioId === profile?.id && req.status === 'Pendente')) && (
                  <button
                    onClick={(e) => handleDelete(e, req.id)}
                    disabled={deletingId === req.id}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Excluir Solicitação"
                  >
                    {deletingId === req.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
                
                <ChevronRight className="text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" size={20} />
              </div>
            </Link>
          ))
        ) : (
          <div className="card text-center py-12">
            <p className="text-slate-500 dark:text-slate-300">Nenhuma solicitação encontrada com esses filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
