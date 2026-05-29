import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { RequestPriority, RequestCategory } from '../types';
import { notifyAdmins } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { Send, FileText, AlertTriangle, Tag, Paperclip, X, File, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NewRequest() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<RequestPriority>('Média');
  const [categoria, setCategoria] = useState<RequestCategory>('Acadêmico');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, size: number, base64: string}[]>([]);
  const [externalLinks, setExternalLinks] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      files.forEach((file: File) => {
        // Limit to 500KB per file to stay safe within Firestore 1MB limit
        if (file.size > 500 * 1024) {
          alert(`O arquivo ${file.name} é muito grande (máx 500KB para armazenamento direto). Para arquivos maiores, use a opção de links externos.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            base64: reader.result as string
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      // Process links
      const linksArray = externalLinks.split('\n')
        .map(link => link.trim())
        .filter(link => link !== '' && (link.startsWith('http://') || link.startsWith('https://')));
      
      // Combine base64 files and links into the files array
      const fileData = selectedFiles.map(f => f.base64);
      const allAttachments = [...fileData, ...linksArray];

      const newRequest = {
        titulo,
        descricao,
        dataCriacao: new Date().toISOString(),
        status: 'Pendente',
        prioridade,
        categoria,
        usuarioId: profile.id,
        historico: [
          {
            data: new Date().toISOString(),
            mensagem: 'Solicitação criada pelo estudante.',
            usuario: profile.nome
          }
        ],
        importante: false,
        arquivos: allAttachments
      };

      const docRef = await addDoc(collection(db, 'requests'), newRequest);
      
      // Notificar todos os administradores sobre a nova solicitação
      await notifyAdmins(
        'Nova Solicitação Recebida',
        `O estudante ${profile.nome} enviou uma nova solicitação: "${titulo}"`,
        docRef.id
      );

      navigate('/solicitacoes');
    } catch (error: any) {
      console.error("Error creating request:", error);
      alert("Ocorreu um erro ao criar a solicitação. Tente remover os anexos ou usar apenas links externos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold">Nova Solicitação</h2>
        <p className="text-slate-600 dark:text-slate-300">Preencha os detalhes abaixo para registrar seu pedido.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText size={16} /> Título da Solicitação
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="Ex: Revisão de Nota - Cálculo I"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Tag size={16} /> Categoria
              </label>
              <select
                className="input"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
              >
                <option value="Acadêmico">Acadêmico</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Secretaria">Secretaria</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle size={16} /> Prioridade
              </label>
              <select
                className="input"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição Detalhada</label>
            <textarea
              required
              rows={6}
              className="input resize-none"
              placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Paperclip size={16} /> Anexar Arquivos Pequenos (Máx 500KB)
              </label>
              
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer group"
              >
                <Paperclip className="mx-auto text-slate-400 dark:text-slate-500 group-hover:text-primary mb-2 transition-colors" size={24} />
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Clique para selecionar fotos ou PDFs pequenos
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <File size={18} className="text-primary flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-300">({(file.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Tag size={16} /> Links Externos (Google Drive, Dropbox, etc.)
              </label>
              <textarea
                className="input text-sm"
                rows={2}
                placeholder="Cole aqui links para arquivos grandes (um por linha)..."
                value={externalLinks}
                onChange={(e) => setExternalLinks(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-300 italic">
                Dica: Use links externos para documentos pesados ou muitos arquivos.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex flex-col items-center min-w-[160px] justify-center relative overflow-hidden"
            >
              <div className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Enviando arquivos...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Solicitação</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
