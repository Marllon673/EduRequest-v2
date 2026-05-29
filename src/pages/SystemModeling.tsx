import React from 'react';
import { 
  User, 
  Database, 
  Bell, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Shield, 
  FileText, 
  MessageSquare,
  Layout as LayoutIcon,
  Smartphone,
  Server,
  Cloud,
  Lock,
  GitMerge,
  Cpu,
  Zap,
  Key,
  Activity,
  ArrowDown,
  Layers,
  Terminal,
  Search,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function SystemModeling() {
  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="space-y-2 mb-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl ring-1 ring-primary/20">
          <Icon size={24} />
        </div>
        <h3 className="text-3xl font-bold tracking-tight dark:text-slate-100">{title}</h3>
      </div>
      {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm ml-14">{subtitle}</p>}
    </div>
  );

  const EntityRelationship = () => (
    <div className="space-y-8">
      <SectionHeader 
        icon={GitMerge} 
        title="Arquitetura de Dados NoSQL" 
        subtitle="Mapeamento de coleções Firestore e seus relacionamentos lógicos (1:N)"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
        {/* User Entity */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-primary">
                <User size={20} />
                <h4 className="font-bold uppercase tracking-wider text-xs">Coleção: users</h4>
              </div>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Entidade Base</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'id', type: 'string (PK)', desc: 'UID do Firebase Auth' },
                { name: 'nome', type: 'string', desc: 'Nome completo' },
                { name: 'tipo', type: 'enum', desc: 'Estudante | Admin' },
                { name: 'email', type: 'string', desc: 'Email único' },
                { name: 'createdAt', type: 'timestamp', desc: 'Data de registro' }
              ].map((field) => (
                <div key={field.name} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{field.name}</span>
                    <span className="text-[10px] text-slate-400">{field.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{field.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Request Entity */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-blue-500">
                <FileText size={20} />
                <h4 className="font-bold uppercase tracking-wider text-xs">Coleção: requests</h4>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase">Transacional</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'id', type: 'string (PK)', desc: 'ID gerado pelo Firestore' },
                { name: 'usuarioId', type: 'string (FK)', desc: 'Relacionamento 1:N com users' },
                { name: 'status', type: 'enum', desc: 'Pendente | Em análise | Concluída' },
                { name: 'historico', type: 'array', desc: 'Array de objetos HistoryItem' },
                { name: 'updatedAt', type: 'timestamp', desc: 'Última modificação' }
              ].map((field) => (
                <div key={field.name} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-blue-500">{field.name}</span>
                    <span className="text-[10px] text-slate-400">{field.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{field.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Entity */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <Bell size={20} />
                <h4 className="font-bold uppercase tracking-wider text-xs">Coleção: notifications</h4>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">Evento</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'id', type: 'string (PK)', desc: 'ID gerado pelo Firestore' },
                { name: 'usuarioId', type: 'string (FK)', desc: 'Destinatário (users.id)' },
                { name: 'solicitacaoId', type: 'string (FK)', desc: 'Origem (requests.id)' },
                { name: 'lida', type: 'boolean', desc: 'Status de visualização' },
                { name: 'tipo', type: 'string', desc: 'status_change | new_request' }
              ].map((field) => (
                <div key={field.name} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-amber-500">{field.name}</span>
                    <span className="text-[10px] text-slate-400">{field.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{field.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Connectors (Desktop Only) */}
        <div className="hidden lg:block absolute top-[40%] left-[28%] w-[10%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0">
          <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-primary"></div>
        </div>
        <div className="hidden lg:block absolute top-[40%] left-[61%] w-[10%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0">
          <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
      </div>
    </div>
  );

  const DetailedLogicFlow = () => (
    <div className="space-y-12">
      <SectionHeader 
        icon={Cpu} 
        title="Fluxograma de Processos & Funções Lógicas" 
        subtitle="Ciclo de vida completo de uma solicitação, do trigger UI à persistência e notificação real-time"
      />

      <div className="relative space-y-24">
        {/* Vertical Line Connector */}
        <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 z-0"></div>

        {/* Stage 1: Submission */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1 w-full md:text-right order-2 md:order-1">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm inline-block w-full max-w-md">
              <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-widest">Ação do Usuário</div>
              <h5 className="font-bold mb-2 dark:text-slate-200">Envio de Nova Solicitação</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                O estudante preenche o formulário em <code className="text-primary">NewRequest.tsx</code>. 
                A função <code className="text-primary">handleSubmit</code> é disparada.
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 order-1 md:order-2 shrink-0">
            <Smartphone size={20} />
          </div>
          <div className="flex-1 w-full order-3">
            <div className="p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1">
              <p className="text-slate-500">// Logic: Firestore Write</p>
              <p>const docRef = await addDoc(collection(db, 'requests'), {'{'} ... {'}'});</p>
              <p>await notifyAdmins(data.titulo, 'Nova solicitação...', docRef.id);</p>
            </div>
          </div>
        </div>

        {/* Stage 2: Notification Engine */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1 w-full md:text-right order-2 md:order-1">
            <div className="p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-blue-400 space-y-1">
              <p className="text-slate-500">// Logic: notificationService.ts</p>
              <p>const admins = query(users, where('tipo', '==', 'Admin'));</p>
              <p>const snap = await getDocs(admins);</p>
              <p>snap.docs.forEach(admin ={'>'} createNotification(admin.id, ...));</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 order-1 md:order-2 shrink-0">
            <Zap size={20} />
          </div>
          <div className="flex-1 w-full order-3">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm inline-block w-full max-w-md">
              <div className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest">Processamento Backend</div>
              <h5 className="font-bold mb-2 dark:text-slate-200">Motor de Notificações</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                A função <code className="text-amber-500">notifyAdmins</code> identifica todos os administradores 
                ativos e gera documentos individuais na coleção <code className="text-amber-500">notifications</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Stage 3: Real-time Sync */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1 w-full md:text-right order-2 md:order-1">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm inline-block w-full max-w-md">
              <div className="text-[10px] font-black text-emerald-500 mb-2 uppercase tracking-widest">Sincronização Ativa</div>
              <h5 className="font-bold mb-2 dark:text-slate-200">Snapshot Listeners</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                O frontend mantém conexões WebSocket abertas via <code className="text-emerald-500">onSnapshot</code>. 
                Qualquer mudança no banco reflete na UI em <code className="text-emerald-500">{'<'} 200ms</code>.
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 order-1 md:order-2 shrink-0">
            <RefreshCw size={20} />
          </div>
          <div className="flex-1 w-full order-3">
            <div className="p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1">
              <p className="text-slate-500">// Logic: Real-time UI Update</p>
              <p>onSnapshot(query(collection(db, 'requests')), (snap) ={'>'} {'{'}</p>
              <p className="pl-4">setRequests(snap.docs.map(doc ={'>'} doc.data()));</p>
              <p>{'}'});</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SecurityLogic = () => (
    <div className="space-y-8">
      <SectionHeader 
        icon={Shield} 
        title="Matriz de Segurança & RBAC" 
        subtitle="Controle de acesso granular baseado em funções e validação de integridade de dados"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-red-500">
            <Lock size={24} />
            <h4 className="text-lg font-bold">Escrita (Write)</h4>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 mb-2">VALIDAÇÃO DE PROPRIEDADE</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Um usuário só pode criar ou editar documentos onde o <code className="text-red-500">usuarioId</code> 
                corresponda ao seu <code className="text-red-500">auth.uid</code>.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 mb-2">INTEGRIDADE DE STATUS</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Apenas usuários com <code className="text-red-500">tipo == 'Admin'</code> podem alterar o campo 
                <code className="text-red-500">status</code> de uma solicitação.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-500">
            <Search size={24} />
            <h4 className="text-lg font-bold">Leitura (Read)</h4>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 mb-2">FILTRAGEM DE DADOS</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Estudantes têm acesso apenas às suas próprias solicitações. Admins possuem visão global 
                de todas as coleções transacionais.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 mb-2">PRIVACIDADE DE PERFIL</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dados sensíveis de perfil são restritos ao dono do documento (<code className="text-emerald-500">isOwner</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LogicalFunctions = () => (
    <div className="space-y-8">
      <SectionHeader 
        icon={Terminal} 
        title="Funções Lógicas do Sistema" 
        subtitle="Principais métodos utilitários que garantem a robustez e estabilidade da aplicação"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            name: 'handleFirestoreError',
            icon: Shield,
            color: 'text-red-500',
            desc: 'Centraliza o tratamento de erros de permissão e falhas de rede.'
          },
          {
            name: 'notifyAdmins',
            icon: Bell,
            color: 'text-amber-500',
            desc: 'Orquestra o disparo de notificações para toda a equipe administrativa.'
          },
          {
            name: 'createNotification',
            icon: Zap,
            color: 'text-blue-500',
            desc: 'Persiste eventos de notificação no Firestore com metadados de origem.'
          },
          {
            name: 'subscribeToNotifications',
            icon: RefreshCw,
            color: 'text-emerald-500',
            desc: 'Estabelece o listener em tempo real para o badge de notificações.'
          }
        ].map((func) => (
          <div key={func.name} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/50 transition-colors group">
            <func.icon className={cn("mb-4 transition-transform group-hover:scale-110", func.color)} size={24} />
            <h5 className="font-mono text-sm font-bold mb-2 dark:text-slate-200">{func.name}</h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {func.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-32 pb-32 px-4 md:px-0">
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
          <Layers size={12} />
          Documentação Técnica
        </div>
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter dark:text-slate-100">
          Modelagem do Sistema
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Uma visão profunda sobre a arquitetura, fluxos lógicos e a infraestrutura 
          que sustenta o EduRequest.
        </p>
      </div>

      <EntityRelationship />
      <DetailedLogicFlow />
      <LogicalFunctions />
      <SecurityLogic />

      {/* Technical Footer */}
      <div className="p-12 bg-slate-900 rounded-[40px] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h4 className="text-3xl font-bold tracking-tight">Stack de Desenvolvimento</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Construído com as tecnologias mais modernas do ecossistema JavaScript, 
              focando em tipagem estática, performance e escalabilidade serverless.
            </p>
            <div className="flex flex-wrap gap-3">
              {['TypeScript', 'React 18', 'Vite', 'Tailwind 4', 'Firebase', 'Lucide'].map(tech => (
                <span key={tech} className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium border border-white/5">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <Activity className="text-primary mb-3" size={24} />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Real-time Sync</div>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <Shield className="text-emerald-400 mb-3" size={24} />
              <div className="text-2xl font-bold">RBAC</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Security Model</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
