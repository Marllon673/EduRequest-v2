import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { doc, updateDoc, collection, query, where, onSnapshot, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, storage } from '../firebase';
import { User, Shield, Activity, Settings, Bell, Moon, Sun, LogOut, Camera, Save, Loader2, Clock, CheckCircle, AlertCircle, Trash2, X, Key, Mail, Volume2, Type, Eye, HelpCircle, Minus, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { AcademicRequest, RequestHistoryItem } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    fontSizeScale,
    highContrast,
    dyslexicFont,
    screenReaderActive,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleHighContrast,
    toggleDyslexicFont,
    toggleScreenReader,
  } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity' | 'prefs'>('info');
  const [nome, setNome] = useState(profile?.nome || '');
  const [telefone, setTelefone] = useState(profile?.telefone || '');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, open: 0 });
  const [recentActivity, setRecentActivity] = useState<(RequestHistoryItem & { requestId: string, requestTitle: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setTelefone(profile.telefone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;

    const q = query(collection(db, 'requests'), where('usuarioId', '==', profile.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AcademicRequest[];
      
      const total = requests.length;
      const completed = requests.filter(r => r.status === 'Concluída').length;
      const open = total - completed;
      
      setStats({ total, completed, open });

      // Flatten and sort history for recent activity
      const allHistory = requests.flatMap(req => 
        (req.historico || []).map(h => ({
          ...h,
          requestId: req.id,
          requestTitle: req.titulo
        }))
      ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);

      setRecentActivity(allHistory);
    });

    return () => unsubscribe();
  }, [profile?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Limit to 500KB for direct Firestore storage
    if (file.size > 500 * 1024) {
      // Show error in UI or console instead of alert
      console.warn("A foto de perfil deve ter no máximo 500KB.");
      return;
    }

    setPhotoLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          // Update Firestore directly with Base64
          await updateDoc(doc(db, 'users', profile.id), {
            fotoPerfil: base64
          });

          await refreshProfile();
        } catch (err: any) {
          console.error("Error saving photo to Firestore:", err);
        } finally {
          setPhotoLoading(false);
        }
      };
      
      reader.onerror = () => {
        setPhotoLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error in photo upload process:", error);
      setPhotoLoading(false);
    }
  };

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');

  const handleRemovePhoto = async () => {
    if (!profile) return;
    
    setPhotoLoading(true);
    try {
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        fotoPerfil: deleteField()
      });
      
      await refreshProfile();
      setShowRemoveConfirm(false);
    } catch (error: any) {
      console.error("Error removing photo:", error);
      // We'll show the error in the UI instead of alert
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) return;
    
    setLoading(true);
    setPasswordResetError('');
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setPasswordResetSent(true);
      setTimeout(() => setPasswordResetSent(false), 5000);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      setPasswordResetError(error.message || "Erro ao enviar e-mail de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        nome,
        telefone
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Informações', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'activity', label: 'Atividade', icon: Activity },
    { id: 'prefs', label: 'Preferências', icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-card-light dark:border-card-dark shadow-xl overflow-hidden relative">
            {profile?.fotoPerfil ? (
              <img src={profile.fotoPerfil} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={64} />
            )}
            {photoLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            title="Alterar Foto"
          >
            <Camera size={18} />
          </button>
          {profile?.fotoPerfil && (
            <div className="absolute bottom-0 -left-2 flex items-center">
              {showRemoveConfirm ? (
                <div className="flex bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button 
                    onClick={handleRemovePhoto}
                    disabled={photoLoading}
                    className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                    title="Confirmar Remoção"
                  >
                    {photoLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  </button>
                  <button 
                    onClick={() => setShowRemoveConfirm(false)}
                    disabled={photoLoading}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={photoLoading}
                  className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover Foto"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold dark:text-slate-200">{profile?.nome}</h2>
          <p className="text-slate-500 dark:text-slate-400">{profile?.tipo} • {profile?.curso || 'Sem curso definido'}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-8">
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <input type="text" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="input opacity-50 cursor-not-allowed" value={profile?.email} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <input type="text" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Matrícula</label>
                <input type="text" className="input opacity-50 cursor-not-allowed" value={profile?.matricula || 'N/A'} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
                <Save size={18} />
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm flex items-start space-x-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>
                Para sua segurança, a alteração de senha é feita através de um link enviado para o seu e-mail cadastrado.
              </span>
            </div>

            {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 text-sm flex items-start space-x-3">
                <Shield size={18} className="mt-0.5 shrink-0" />
                <span>
                  Você está autenticado com o Google. Para alterar sua senha, acesse as configurações da sua Conta Google.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {passwordResetSent ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center space-x-3">
                    <CheckCircle size={20} />
                    <div className="flex-1">
                      <p className="font-bold">E-mail enviado!</p>
                      <p className="text-sm">Verifique sua caixa de entrada ({auth.currentUser?.email}) para redefinir sua senha.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="btn btn-secondary w-full md:w-auto flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Key size={18} />
                      )}
                      <span>Enviar E-mail de Redefinição</span>
                    </button>
                    {passwordResetError && (
                      <p className="text-red-500 text-xs">{passwordResetError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => auth.signOut()}
                className="btn bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center space-x-2"
              >
                <LogOut size={18} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total de Pedidos</p>
              </div>
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Concluídos</p>
              </div>
              <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.open}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Em Aberto</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 dark:text-slate-200">
                <Clock size={20} className="text-primary" />
                Atividade Recente
              </h3>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                      <div className="mt-1">
                        {item.mensagem.toLowerCase().includes('concluída') ? (
                          <CheckCircle size={18} className="text-emerald-500" />
                        ) : item.mensagem.toLowerCase().includes('análise') ? (
                          <Activity size={18} className="text-blue-500" />
                        ) : (
                          <AlertCircle size={18} className="text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium dark:text-slate-200">
                          {item.mensagem}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-primary/80">{item.requestTitle}</span>
                          <span>•</span>
                          <span>{format(new Date(item.data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Nenhuma atividade registrada ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prefs' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b pb-2 text-slate-700 dark:text-slate-300">Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Notificações</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receba alertas de mudança de status</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-slate-300 rounded-full appearance-none checked:bg-primary transition-all cursor-pointer" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    {theme === 'Claro' ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Modo {theme === 'Claro' ? 'Claro' : 'Escuro'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Alterne os temas da interface visualmente</p>
                  </div>
                </div>
                <button onClick={toggleTheme} className="btn btn-secondary text-xs">Alternar</button>
              </div>
            </div>

            <h3 className="text-lg font-bold border-b pb-2 text-slate-700 dark:text-slate-300 pt-4">Recursos de Acessibilidade</h3>
            
            <div className="space-y-4">
              {/* Text Sizing Scale */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Type size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Tamanho da Fonte: {fontSizeScale}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajuste o tamanho de exibição dos textos das páginas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={decreaseFontSize} 
                    title="Diminuir Fonte (Alt + -)"
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    <Minus size={16} />
                  </button>
                  <button 
                    onClick={resetFontSize} 
                    title="Resetar Fonte (Alt + R)"
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Padrão
                  </button>
                  <button 
                    onClick={increaseFontSize} 
                    title="Aumentar Fonte (Alt + +)"
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Eye size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Alto Contraste</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Cores de contraste máximo para facilidade de leitura (Alt + H)</p>
                  </div>
                </div>
                <button 
                  onClick={toggleHighContrast} 
                  className={cn("btn text-xs", highContrast ? "btn-primary" : "btn-secondary")}
                >
                  {highContrast ? "Ativado" : "Desativado"}
                </button>
              </div>

              {/* Dyslexic Font */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Type size={20} className="stroke-[3]" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Fonte para Dislexia</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Altera a fonte do sistema para uma tipografia amigável (Alt + D)</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDyslexicFont} 
                  className={cn("btn text-xs", dyslexicFont ? "btn-primary" : "btn-secondary")}
                >
                  {dyslexicFont ? "Ativado" : "Desativado"}
                </button>
              </div>

              {/* Screen Reader Speak Mode */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-slate-200">Leitor de Tela (Voz Assistiva)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Narração em português ao passar o mouse ou focar nos textos (Alt + S)</p>
                  </div>
                </div>
                <button 
                  onClick={toggleScreenReader} 
                  className={cn("btn text-xs", screenReaderActive ? "btn-primary" : "btn-secondary")}
                >
                  {screenReaderActive ? "Ativado" : "Desativado"}
                </button>
              </div>
            </div>

            {/* Keyboard Shortcuts Help list */}
            <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm rounded-xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                <HelpCircle size={16} />
                Atalhos Rápidos de Teclado (Acessibilidade)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-blue-700/90 dark:text-blue-300/80">
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Alto Contraste</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + H</kbd>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Fonte para Dislexia</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + D</kbd>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Leitor de Tela por Voz</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + S</kbd>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Aumentar tamanho do texto</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + +</kbd>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Diminuir tamanho do texto</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + -</kbd>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 py-1.5 items-center">
                  <span>Resetar tamanho do texto</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Alt + R</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
