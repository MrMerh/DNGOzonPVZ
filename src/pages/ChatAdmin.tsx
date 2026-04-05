import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Circle } from 'lucide-react';
import { useChats, useChatMessages } from '../hooks/useChat';
import type { Chat } from '../types';

export default function ChatAdmin() {
  const { chats, activeChats, totalUnread, loading } = useChats();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <MessageSquare size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          Чат
          {totalUnread > 0 && (
            <span
              style={{
                background: 'var(--red)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                marginLeft: 8,
                verticalAlign: 'middle',
              }}
            >
              {totalUnread}
            </span>
          )}
        </h1>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          height: 'calc(100vh - 160px)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Список чатов */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text2)',
            }}
          >
            Активные чаты ({activeChats.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div className="loader">Загрузка...</div>
            ) : chats.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text2)', fontSize: 13, textAlign: 'center' }}>
                Нет активных чатов.<br />Чаты появятся когда сотрудник войдёт через приложение.
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '12px 16px',
                    background: selectedChat?.id === chat.id ? 'rgba(59,130,246,.1)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text)',
                    transition: 'background .15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Circle
                        size={8}
                        fill={chat.active ? 'var(--green)' : 'var(--text2)'}
                        stroke="none"
                      />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{chat.employeeName}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {chat.sessionType === 'mobile' ? '📱' : '🖥️'} {chat.lastMessage || 'Нет сообщений'}
                    </div>
                  </div>
                  {chat.unreadAdmin > 0 && (
                    <span
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 99,
                        flexShrink: 0,
                      }}
                    >
                      {chat.unreadAdmin}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Область сообщений */}
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text2)',
              fontSize: 14,
            }}
          >
            Выберите чат слева
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWindow({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const { messages, loading, sendMessage, markAsRead } = useChatMessages(chat.id);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat.unreadAdmin > 0) {
      markAsRead(chat.id);
    }
  }, [chat.id, chat.unreadAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(ev: React.FormEvent) {
    ev.preventDefault();
    if (!text.trim()) return;
    await sendMessage(chat.id, text.trim());
    setText('');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Шапка */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{chat.employeeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>
            {chat.sessionType === 'mobile' ? '📱 Мобильное' : '🖥️ ПК'}
            {chat.active ? ' · Онлайн' : ' · Оффлайн'}
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {loading ? (
          <div className="loader">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 13, paddingTop: 40 }}>
            Нет сообщений. Напишите первым!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: msg.senderType === 'admin'
                    ? 'rgba(59,130,246,.2)'
                    : 'var(--surface)',
                  borderBottomRightRadius: msg.senderType === 'admin' ? 4 : 12,
                  borderBottomLeftRadius: msg.senderType === 'employee' ? 4 : 12,
                }}
              >
                <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{msg.text}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4, textAlign: 'right' }}>
                  {msg.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {msg.senderType === 'admin' && msg.readAt && ' ✓✓'}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <input
          className="input"
          placeholder="Написать сообщение..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!text.trim()}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
