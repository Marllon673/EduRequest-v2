import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { AcademicRequest, RequestStatus } from '../types';
import { createNotification } from '../services/notificationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MessageSquare, Send, User, Star, FileText as FileTextIcon, File as FileIcon, Download, Paperclip, Trash2, X, Eye, Pencil, Mic, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import DocumentViewer from '../components/DocumentViewer';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [request, setRequest] = useState<AcademicRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  // States for comment editing/deletion
  const [editingCommentIndex, setEditingCommentIndex] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentIndex, setDeletingCommentIndex] = useState<number | null>(null);
  const [actionCommentLoading, setActionCommentLoading] = useState(false);

  // States for evaluating the service/request
  const [rating, setRating] = useState(5);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // States for audio recording and speech-to-text dictation
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any | null>(null);

  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize dictation (Speech Recognition) on mount
  useEffect(() => {
    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechObj) {
      const rec = new SpeechObj();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNewComment(prev => {
            const separator = prev.length && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + finalTranscript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleDictation = () => {
    if (!recognition) {
      alert("Seu navegador não oferece suporte para ditado de voz.");
      return;
    }

    if (isDictating) {
      recognition.stop();
      setIsDictating(false);
    } else {
      try {
        recognition.start();
        setIsDictating(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setAudioChunks(chunks);
      };

      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 59) {
            recorder.stop();
            stream.getTracks().forEach(track => track.stop());
            clearInterval(interval);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      setTimerInterval(interval);
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordedAudioUrl(null);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Não foi possível acessar seu microfone. Certifique-se de dar as permissões de gravação de áudio em seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsRecording(false);
    setRecordedAudioUrl(null);
    setAudioChunks([]);
  };

  const sendAudioComment = async () => {
    if (audioChunks.length === 0 || !id || !profile || !request) return;

    setCommentLoading(true);
    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const audioMessage = `[AUDIO]${base64Audio}`;

        const historyItem = {
          id: Math.random().toString(36).substring(2, 9),
          data: new Date().toISOString(),
          mensagem: audioMessage,
          usuario: profile.nome,
          tipo: 'comentario' as const
        };

        await updateDoc(doc(db, 'requests', id), {
          historico: arrayUnion(historyItem)
        });

        if (profile.tipo === 'Admin') {
          await createNotification({
            usuarioId: request.usuarioId,
            titulo: 'Novo Relato de Áudio',
            mensagem: `Um administrador enviou um comentário de áudio em: "${request.titulo}"`,
            lida: false,
            solicitacaoId: id,
            data: new Date().toISOString()
          });
        }

        setRequest(prev => prev ? {
          ...prev,
          historico: [...prev.historico, historyItem]
        } : null);

        setRecordedAudioUrl(null);
        setAudioChunks([]);
      };
    } catch (error) {
      console.error("Error saving audio comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'requests', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as AcademicRequest);
        } else {
          navigate('/solicitacoes');
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, navigate]);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !request || !profile) return;
    setSubmittingRating(true);
    try {
      const evalObj = {
        nota: rating,
        comentario: ratingComment.trim(),
        dataAvaliacao: new Date().toISOString()
      };

      const historyItem = {
        id: Math.random().toString(36).substring(2, 9),
        data: new Date().toISOString(),
        mensagem: `Protocolo avaliado pelo estudante: ${rating}/5 estrelas. Feedback: "${ratingComment.trim() || 'Sem comentários'}"`,
        usuario: profile.nome,
        tipo: 'sistema' as const
      };

      await updateDoc(doc(db, 'requests', id), {
        avaliacao: evalObj,
        historico: arrayUnion(historyItem)
      });

      // Notify administration about the new rating
      await createNotification({
        usuarioId: 'admin-broadcast', // General admin notice or system notification
        titulo: 'Nova Avaliação de Solicitação',
        mensagem: `O estudante avaliou o atendimento de "${request.titulo}" com ${rating}/5 estrelas.`,
        lida: false,
        solicitacaoId: id,
        data: new Date().toISOString()
      });

      setRequest(prev => prev ? {
        ...prev,
        avaliacao: evalObj,
        historico: [...prev.historico, historyItem]
      } : null);
    } catch (error) {
      console.error("Error saving evaluation:", error);
      alert("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!id || !profile || !request) return;
    
    // Check permissions (redundant with rules but good for UX)
    const canDelete = profile.tipo === 'Admin' || (request.usuarioId === profile.id && request.status === 'Pendente');
    if (!canDelete) return;

    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'requests', id));
      navigate('/solicitacoes');
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Erro ao excluir solicitação. Verifique suas permissões.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile || !newComment.trim() || !request) return;

    setCommentLoading(true);
    try {
      const historyItem = {
        id: Math.random().toString(36).substring(2, 9),
        data: new Date().toISOString(),
        mensagem: newComment,
        usuario: profile.nome,
        tipo: 'comentario' as const
      };

      await updateDoc(doc(db, 'requests', id), {
        historico: arrayUnion(historyItem)
      });

      // Notificar o estudante se o admin comentar
      if (profile.tipo === 'Admin') {
        await createNotification({
          usuarioId: request.usuarioId,
          titulo: 'Novo Comentário',
          mensagem: `Um administrador comentou na sua solicitação: "${request.titulo}"`,
          lida: false,
          solicitacaoId: id,
          data: new Date().toISOString()
        });
      }

      setRequest(prev => prev ? {
        ...prev,
        historico: [...prev.historico, historyItem]
      } : null);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSaveEditComment = async (index: number) => {
    if (!id || !editingCommentText.trim() || !request) return;
    setActionCommentLoading(true);
    try {
      const updatedHistorico = [...request.historico];
      updatedHistorico[index] = {
        ...updatedHistorico[index],
        mensagem: editingCommentText.trim(),
        editado: true
      };

      await updateDoc(doc(db, 'requests', id), {
        historico: updatedHistorico
      });

      setRequest(prev => prev ? {
        ...prev,
        historico: updatedHistorico
      } : null);
      setEditingCommentIndex(null);
      setEditingCommentText('');
    } catch (error) {
      console.error("Error editing comment:", error);
    } finally {
      setActionCommentLoading(false);
    }
  };

  const handleDeleteComment = async (index: number) => {
    if (!id || !request) return;
    setActionCommentLoading(true);
    try {
      const updatedHistorico = request.historico.filter((_, i) => i !== index);

      await updateDoc(doc(db, 'requests', id), {
        historico: updatedHistorico
      });

      setRequest(prev => prev ? {
        ...prev,
        historico: updatedHistorico
      } : null);
      setDeletingCommentIndex(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setActionCommentLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: RequestStatus) => {
    if (!id || !profile || profile.tipo !== 'Admin' || !request) return;

    try {
      const historyItem = {
        id: Math.random().toString(36).substring(2, 9),
        data: new Date().toISOString(),
        mensagem: `Status alterado para: ${newStatus}`,
        usuario: profile.nome,
        tipo: 'sistema' as const
      };

      await updateDoc(doc(db, 'requests', id), {
        status: newStatus,
        historico: arrayUnion(historyItem)
      });

      // Notificar o estudante sobre a mudança de status
      await createNotification({
        usuarioId: request.usuarioId,
        titulo: 'Atualização de Status',
        mensagem: `Sua solicitação "${request.titulo}" foi alterada para: ${newStatus}`,
        lida: false,
        solicitacaoId: id,
        data: new Date().toISOString()
      });

      setRequest(prev => prev ? {
        ...prev,
        status: newStatus,
        historico: [...prev.historico, historyItem]
      } : null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const toggleImportant = async () => {
    if (!id || !request) return;
    try {
      await updateDoc(doc(db, 'requests', id), {
        importante: !request.importante
      });
      setRequest(prev => prev ? { ...prev, importante: !prev.importante } : null);
    } catch (error) {
      console.error("Error toggling important:", error);
    }
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
  </div>;

  if (!request) return <div>Solicitação não encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>
        <button onClick={toggleImportant} className="text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors">
          <Star size={24} className={cn(request.importante && "fill-amber-400 text-amber-400")} />
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold">Excluir Solicitação</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteRequest}
                className="btn bg-red-500 hover:bg-red-600 text-white flex-1 flex items-center justify-center space-x-2"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Trash2 size={18} />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                request.status === 'Pendente' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : 
                request.status === 'Em análise' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" : 
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
              )}>
                {request.status}
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{request.categoria}</span>
            </div>
            <h1 className="text-3xl font-bold dark:text-slate-200">{request.titulo}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {(profile?.tipo === 'Admin' || (request.usuarioId === profile?.id && request.status === 'Pendente')) && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="btn bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-2 rounded-xl"
                title="Excluir Solicitação"
              >
                <Trash2 size={20} />
              </button>
            )}

            {profile?.tipo === 'Admin' && (
              <>
                <button 
                  onClick={() => handleUpdateStatus('Em análise')}
                  className="btn btn-secondary text-xs"
                  disabled={request.status === 'Em análise'}
                >
                  Analisar
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Concluída')}
                  className="btn btn-primary text-xs"
                  disabled={request.status === 'Concluída'}
                >
                  Concluir
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Prioridade</p>
            <p className={cn(
              "font-semibold",
              request.prioridade === 'Alta' ? "text-red-500" : 
              request.prioridade === 'Média' ? "text-amber-500" : "text-blue-500"
            )}>{request.prioridade}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Criado em</p>
            <p className="font-semibold dark:text-slate-200">{format(new Date(request.dataCriacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Protocolo</p>
            <p className="font-mono font-semibold text-primary">#{request.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 dark:text-slate-200">
            <FileTextIcon size={20} className="text-primary" /> Descrição
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {request.descricao}
          </p>
        </div>

        {request.arquivos && request.arquivos.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 dark:text-slate-200">
              <Paperclip size={20} className="text-primary" /> Arquivos Anexados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {request.arquivos.map((url, index) => {
                const isBase64 = url.startsWith('data:');
                const isLink = url.startsWith('http');
                
                let fileName = `Anexo ${index + 1}`;
                if (isLink && !isBase64) {
                  try {
                    const urlObj = new URL(url);
                    fileName = urlObj.hostname + (urlObj.pathname.length > 1 ? '...' : '');
                  } catch (e) {
                    fileName = "Link Externo";
                  }
                } else if (isBase64) {
                  fileName = `Arquivo Local ${index + 1}`;
                }

                return (
                  <div key={index} className="flex flex-col space-y-2">
                    {isBase64 && url.includes('image/') ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 h-32">
                        <img 
                          src={url} 
                          alt={fileName} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                          <button 
                            onClick={() => {
                              setViewerStartIndex(index);
                              setViewerOpen(true);
                            }}
                            className="p-2.5 bg-primary text-white hover:bg-blue-600 rounded-full shadow-lg transition transform hover:scale-110"
                            title="Visualizar Imagem"
                          >
                            <Eye size={18} />
                          </button>
                          <a 
                            href={url} 
                            download={`anexo-${index}`} 
                            className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-primary rounded-full shadow-lg transition transform hover:scale-110"
                            title="Baixar Imagem"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-primary mr-4 shadow-sm group-hover:scale-110 transition-transform">
                          <FileIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                          setViewerStartIndex(index);
                          setViewerOpen(true);
                        }}>
                          <p className="text-sm font-bold truncate dark:text-slate-200 group-hover:text-primary transition-colors">{fileName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            {url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf') ? 'Documento PDF' : 'Link Externo'}
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 py-0.2 rounded font-mono lowercase text-slate-400">Clique para visualizar</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => {
                              setViewerStartIndex(index);
                              setViewerOpen(true);
                            }}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-primary rounded-lg transition"
                            title="Visualizar documento"
                          >
                            <Eye size={18} />
                          </button>
                          <a 
                            href={url}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-primary rounded-lg transition"
                            title="Baixar ou abrir direto"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Seção de Avaliação de Atendimento */}
      {request.status === 'Concluída' && (
        <div className="card p-8 border-t-4 border-emerald-500 space-y-6">
          <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
            <Star size={28} className="fill-emerald-500/10 text-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold dark:text-slate-200">Avaliação do Atendimento</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Esta solicitação está concluída. Ajude-nos a melhorar avaliando o atendimento.</p>
            </div>
          </div>

          {request.avaliacao ? (
            // Se já foi avaliada, exibe o resultado
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Avaliação registrada:</p>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <Star
                      key={starIndex}
                      size={20}
                      className={starIndex <= request.avaliacao!.nota 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-slate-300 dark:text-slate-700"
                      }
                    />
                  ))}
                </div>
                <span className="font-mono text-sm font-bold text-amber-500">({request.avaliacao.nota}/5)</span>
              </div>
              {request.avaliacao.comentario && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed shadow-sm">
                  "{request.avaliacao.comentario}"
                </div>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Avaliado em {format(new Date(request.avaliacao.dataAvaliacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ) : profile?.tipo === 'Estudante' ? (
            // Aluno avalia
            <form onSubmit={handleSubmitEvaluation} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nota de Satisfação</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => setRating(starIndex)}
                      onMouseEnter={() => setRatingHover(starIndex)}
                      onMouseLeave={() => setRatingHover(null)}
                      className="transition-transform active:scale-95 duration-100 p-1"
                    >
                      <Star
                        size={32}
                        className={cn(
                          "transition-all",
                          starIndex <= (ratingHover !== null ? ratingHover : rating)
                            ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-sm"
                            : "text-slate-300 dark:text-slate-700 hover:text-amber-300"
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-mono font-bold text-slate-500 ml-2">
                    {rating === 1 ? 'Péssimo' :
                     rating === 2 ? 'Ruim' :
                     rating === 3 ? 'Regular' :
                     rating === 4 ? 'Bom' : 'Excelente!'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Feedback Escrito (Opcional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  maxLength={500}
                  placeholder="Escreva como foi sua experiência ou observações adicionais..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="btn btn-primary flex items-center space-x-2 animate-pulse hover:animate-none"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Enviar Avaliação</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Painel Admin aguardando avaliação
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl flex items-center space-x-3 text-slate-500 dark:text-slate-400 text-sm">
              <Clock size={20} className="text-slate-400 animate-pulse" />
              <span>Aguardando a avaliação de satisfação do estudante para esta solicitação.</span>
            </div>
          )}
        </div>
      )}

      {/* Modern PDF & Image Viewer Modal Overlay */}
      {viewerOpen && (
        <DocumentViewer 
          files={request.arquivos} 
          initialIndex={viewerStartIndex} 
          onClose={() => setViewerOpen(false)} 
        />
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 dark:text-slate-200">
          <MessageSquare size={24} className="text-primary" /> Histórico e Comentários
        </h3>

        <div className="space-y-4">
          {request.historico.map((item, index) => {
            const isSystem = item.tipo === 'sistema' || item.mensagem.startsWith('Status alterado para:') || item.mensagem.startsWith('Protocolo avaliado pelo estudante:');
            const canEditOrDelete = !isSystem && (item.usuario === profile?.nome || profile?.tipo === 'Admin');

            return (
              <div key={index} className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <User size={20} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-sm dark:text-slate-200">{item.usuario}</p>
                      {isSystem && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Sistema</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {format(new Date(item.data), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                      {canEditOrDelete && editingCommentIndex !== index && deletingCommentIndex !== index && (
                        <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                          {!item.mensagem.startsWith('[AUDIO]') && (
                            <button
                              onClick={() => {
                                setEditingCommentIndex(index);
                                setEditingCommentText(item.mensagem);
                                setDeletingCommentIndex(null);
                              }}
                              className="text-slate-400 hover:text-primary p-1 rounded transition-colors"
                              title="Editar comentário"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeletingCommentIndex(index);
                              setEditingCommentIndex(null);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Excluir comentário"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingCommentIndex === index ? (
                    <div className="space-y-2 w-full pt-1">
                      <textarea
                        className="input resize-none w-full text-sm"
                        rows={3}
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        disabled={actionCommentLoading}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingCommentIndex(null)}
                          className="btn btn-secondary text-[11px] py-1 px-2.5"
                          disabled={actionCommentLoading}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEditComment(index)}
                          className="btn btn-primary text-[11px] py-1 px-2.5 flex items-center space-x-1"
                          disabled={actionCommentLoading || !editingCommentText.trim()}
                        >
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  ) : deletingCommentIndex === index ? (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4 rounded-xl space-y-3 mt-1">
                      <p className="text-xs text-red-700 dark:text-red-400 font-semibold">Deseja realmente excluir esta mensagem?</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteComment(index)}
                          className="btn bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-3"
                          disabled={actionCommentLoading}
                        >
                          {actionCommentLoading ? 'Excluindo...' : 'Excluir'}
                        </button>
                        <button
                          onClick={() => setDeletingCommentIndex(null)}
                          className="btn btn-secondary text-xs py-1 px-3"
                          disabled={actionCommentLoading}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed dark:text-slate-300 relative group">
                      {item.mensagem.startsWith('[AUDIO]') ? (
                        <div className="space-y-2 py-1 max-w-full overflow-hidden">
                          <div className="flex items-center space-x-2 text-primary font-semibold text-xs mb-1">
                            <Mic size={14} className="text-blue-500 animate-pulse animate-duration-1000" />
                            <span>Mensagem de Áudio</span>
                          </div>
                          <audio 
                            src={item.mensagem.replace('[AUDIO]', '')} 
                            controls 
                            className="w-full max-w-sm rounded-lg outline-none focus:none"
                          />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{item.mensagem}</p>
                      )}
                      {item.editado && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-1 block">
                          (editado)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddComment} className="card p-6 space-y-4">
          <div className="relative">
            <textarea
              className="input resize-none w-full pr-12"
              rows={3}
              placeholder="Adicione um comentário ou responda à solicitação..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isRecording}
            />
            <button
              type="button"
              onClick={toggleDictation}
              title={isDictating ? "Parar ditado de voz" : "Digitar através de voz (áudio para texto)"}
              className={cn(
                "absolute right-3 top-3 p-2 rounded-full transition-all duration-300",
                isDictating 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              )}
            >
              <Mic size={18} />
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Gravando Comentário de Áudio...</span>
                <span className="font-mono text-xs text-red-500 dark:text-red-400">
                  {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                  {(recordingDuration % 60).toString().padStart(2, '0')} / 01:00
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="btn btn-secondary py-1 px-3 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="btn bg-red-600 hover:bg-red-700 text-white py-1 px-3 text-xs"
                >
                  Confirmar Gravação
                </button>
              </div>
            </div>
          )}

          {recordedAudioUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 dark:bg-blue-950/25 border border-blue-200/50 dark:border-blue-900/40 p-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <Mic size={16} className="text-primary" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Revisar áudio gravado:</span>
              </div>
              <audio src={recordedAudioUrl} controls className="h-8 max-w-full" />
              <div className="flex items-center space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRecordedAudioUrl(null)}
                  className="btn btn-secondary py-1 px-2.5 text-xs"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={sendAudioComment}
                  disabled={commentLoading}
                  className="btn btn-primary py-1 px-3 text-xs"
                >
                  {commentLoading ? "Enviando..." : "Enviar Áudio"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2">
              {!isRecording && !recordedAudioUrl && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="btn btn-secondary flex items-center space-x-2 text-xs py-1.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Mic size={14} className="text-red-500" />
                  <span>Gravar Áudio</span>
                </button>
              )}
              {isDictating && (
                <span className="text-xs text-red-500 font-semibold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  Ditado de voz ativo... Fale agora...
                </span>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Send size={18} />
                <span>{commentLoading ? 'Enviando...' : 'Enviar Comentário'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}

function FileText(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
