import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { subscribeToNotifications, markAsRead, deleteNotification } from '../services/notificationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Props {
  align?: 'left' | 'right';
}

export default function NotificationDropdown({ align = 'right' }: Props) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const unsubscribe = subscribeToNotifications(profile.id, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.lida) {
      await markAsRead(notification.id);
    }
    if (notification.solicitacaoId) {
      navigate(`/solicitacoes/${notification.solicitacaoId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-600 dark:text-slate-400 relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[var(--sidebar-app)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 sidebar border rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200",
          align === 'right' ? "right-0" : "left-0"
        )}>
          <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold dark:text-slate-200">Notificações</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma notificação por aqui.</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-slate-800">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group",
                      !notification.lida && "bg-primary/5 dark:bg-primary/10"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <p className={cn(
                          "text-sm font-medium dark:text-slate-200",
                          !notification.lida && "text-primary"
                        )}>
                          {notification.titulo}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {notification.mensagem}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {format(new Date(notification.data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.lida && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md"
                            title="Marcar como lida"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t text-center bg-slate-50 dark:bg-slate-900/50">
              <button 
                onClick={() => {
                  notifications.forEach(n => !n.lida && markAsRead(n.id));
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
