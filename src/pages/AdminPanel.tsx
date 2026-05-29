import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRequest, UserProfile } from '../types';
import { createNotification } from '../services/notificationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, FileText, CheckCircle, Clock, Search, Filter, ArrowRight, ShieldCheck, UserMinus, Key, Mail, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AcademicRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.tipo !== 'Admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const requestsSnap = await getDocs(query(collection(db, 'requests'), orderBy('dataCriacao', 'desc')));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        setRequests(requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRequest)));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, navigate]);

  const handleToggleAdmin = async (userId: string, currentType: string) => {
    try {
      const newType = currentType === 'Admin' ? 'Estudante' : 'Admin';
      await updateDoc(doc(db, 'users', userId), { tipo: newType });
      
      // Notificar o usuário sobre a mudança de permissão
      await createNotification({
        usuarioId: userId,
        titulo: 'Alteração de Permissão',
        mensagem: `Suas permissões de acesso foram alteradas para: ${newType}`,
        lida: false,
        data: new Date().toISOString()
      });

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tipo: newType as any } : u));
    } catch (error) {
      console.error("Error toggling admin:", error);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!window.confirm(`Enviar e-mail de redefinição de senha para ${email}?`)) return;
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`E-mail de redefinição enviado para ${email}`);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      alert("Erro ao enviar e-mail: " + (error.message || "Tente novamente mais tarde."));
    }
  };

  const filteredRequests = requests.filter(r => 
    r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-900 rounded-lg"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>)}
    </div>
    <div className="h-96 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold dark:text-slate-200">Painel do Administrador</h1>
        <div className="flex items-center space-x-2 bg-card-light dark:bg-card-dark p-1 rounded-xl border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('requests')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'requests' ? "bg-primary text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Solicitações
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'users' ? "bg-primary text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Usuários
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">{requests.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Total Pedidos</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">{requests.filter(r => r.status === 'Pendente').length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Pendentes</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">{requests.filter(r => r.status === 'Concluída').length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Concluídos</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
            <Star className="fill-amber-400 text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">
              {requests.filter(r => r.avaliacao).length > 0 
                ? (requests.filter(r => r.avaliacao).reduce((acc, r) => acc + r.avaliacao!.nota, 0) / requests.filter(r => r.avaliacao).length).toFixed(1)
                : "—"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider leading-tight">
              Média (de {requests.filter(r => r.avaliacao).length})
            </p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">{users.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Usuários</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
            <input 
              type="text" 
              className="input pl-10" 
              placeholder={activeTab === 'requests' ? "Buscar solicitações..." : "Buscar usuários..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter size={18} />
            <span>Filtros Avançados</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'requests' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID / Título</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Prioridade</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-sm dark:text-slate-200">{request.titulo}</span>
                        {request.avaliacao && (
                          <span className="inline-flex items-center space-x-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span>{request.avaliacao.nota}/5</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{request.id.slice(-8).toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        request.status === 'Pendente' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : 
                        request.status === 'Em análise' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" : 
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
                      )}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs font-semibold",
                        request.prioridade === 'Alta' ? "text-red-500" : 
                        request.prioridade === 'Média' ? "text-amber-500" : "text-blue-500"
                      )}>
                        {request.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {format(new Date(request.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/solicitacoes/${request.id}`)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Curso / Matrícula</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm dark:text-slate-200">{user.nome}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.tipo === 'Admin' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                      )}>
                        {user.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {user.curso || 'N/A'} <span className="text-slate-300 mx-1">|</span> {user.matricula || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        title="Redefinir Senha"
                        className="p-2 hover:bg-amber-50 text-amber-500 rounded-lg transition-colors"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleAdmin(user.id, user.tipo)}
                        title={user.tipo === 'Admin' ? "Remover Admin" : "Tornar Admin"}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          user.tipo === 'Admin' ? "hover:bg-red-50 text-red-500" : "hover:bg-emerald-50 text-emerald-500"
                        )}
                      >
                        {user.tipo === 'Admin' ? <UserMinus size={18} /> : <ShieldCheck size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
