import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, query, orderBy, where, Timestamp, writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Chat, ChatMessage, ChatMessageSender } from '../types';
import { toDate } from '../utils/dateHelpers';

const CHATS_COL = collection(db, 'chats');
const MESSAGES_COL = collection(db, 'chatMessages');

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(CHATS_COL, orderBy('lastMessageAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          employeeId: data.employeeId ?? '',
          employeeName: data.employeeName ?? '',
          pvzId: data.pvzId ?? '',
          sessionType: data.sessionType ?? 'mobile',
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: data.lastMessageAt ? toDate(data.lastMessageAt as Timestamp) : null,
          unreadAdmin: data.unreadAdmin ?? 0,
          unreadEmployee: data.unreadEmployee ?? 0,
          active: data.active ?? true,
          createdAt: toDate(data.createdAt as Timestamp),
        };
      }));
      setLoading(false);
    });
  }, []);

  const activeChats = chats.filter((c) => c.active);
  const totalUnread = chats.reduce((sum, c) => sum + c.unreadAdmin, 0);

  return { chats, activeChats, totalUnread, loading };
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      MESSAGES_COL,
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          chatId: data.chatId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderType: data.senderType as ChatMessageSender,
          text: data.text,
          readAt: data.readAt ? toDate(data.readAt as Timestamp) : null,
          createdAt: toDate(data.createdAt as Timestamp),
        };
      }));
      setLoading(false);
    });
  }, [chatId]);

  /** Отправить сообщение от админа */
  async function sendMessage(chatId: string, text: string) {
    await addDoc(MESSAGES_COL, {
      chatId,
      senderId: 'admin',
      senderName: 'Администратор',
      senderType: 'admin',
      text,
      readAt: null,
      createdAt: Timestamp.now(),
    });

    // Обновить чат: последнее сообщение + счётчик непрочитанных
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageAt: Timestamp.now(),
      unreadEmployee: (await getUnreadCount(chatId, 'employee')) + 1,
    });
  }

  /** Отметить все сообщения от сотрудника как прочитанные */
  async function markAsRead(chatId: string) {
    const q = query(
      MESSAGES_COL,
      where('chatId', '==', chatId),
      where('senderType', '==', 'employee'),
      where('readAt', '==', null),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { readAt: Timestamp.now() });
    });
    batch.update(doc(db, 'chats', chatId), { unreadAdmin: 0 });
    await batch.commit();
  }

  return { messages, loading, sendMessage, markAsRead };
}

async function getUnreadCount(chatId: string, senderType: string): Promise<number> {
  const q = query(
    MESSAGES_COL,
    where('chatId', '==', chatId),
    where('senderType', '==', senderType),
    where('readAt', '==', null),
  );
  const snap = await getDocs(q);
  return snap.size;
}
