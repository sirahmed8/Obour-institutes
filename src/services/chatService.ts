
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDoc,
  increment,
  writeBatch,
  limit,
  where
} from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string; // 'admin' or userId
  senderEmail?: string;
  timestamp: any;
  status: 'sent' | 'delivered' | 'seen';
  type: 'text' | 'file' | 'audio' | 'image';
  fileUrl?: string; // For attachments
  reactions?: Record<string, string>; // { userId: '👍' }
  isDeleted?: boolean;
  replyTo?: { id: string; text: string; sender: string } | null;
}

export interface Conversation {
  id: string; // userId
  userEmail: string;
  displayName?: string;
  photoURL?: string; // Cached profile pic
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number; // For admin
  userUnreadCount?: number; // For user
  isArchived?: boolean;
}

const PROFANITY_LIST = ['badword1', 'badword2', 'idiot', 'stupid']; // Replace with robust list

class ChatService {
  
  // --- UTILS ---
  private filterProfanity(text: string): string {
    const regex = new RegExp(PROFANITY_LIST.join('|'), 'gi');
    return text.replace(regex, (match) => '*'.repeat(match.length));
  }

  // --- MESSAGING ---

  // Send a message (User or Admin)
  async sendMessage(
    conversationId: string, 
    senderId: string, 
    text: string, 
    senderEmail: string,
    userDetails?: { displayName?: string; photoURL?: string }, // Only needed on first user msg
    replyTo?: Message['replyTo'],
    attachment?: { url: string; type: Message['type'] }
  ) {
    const cleanText = this.filterProfanity(text);
    if (cleanText !== text && senderId !== 'admin') {
       throw new Error("Message contains restricted words.");
    }

    const convRef = doc(db, 'conversations', conversationId);
    const messagesRef = collection(convRef, 'messages');

    const batch = writeBatch(db);

    // 1. Create Message
    const newMessageRef = doc(messagesRef);
    const messageData: Partial<Message> = {
      text: cleanText,
      senderId,
      senderEmail,
      timestamp: serverTimestamp(),
      status: 'sent',
      type: attachment?.type || 'text',
      fileUrl: attachment?.url || undefined,
      replyTo: replyTo || null,
      reactions: {}
    };

    batch.set(newMessageRef, messageData);

    // 2. Update Conversation Metadata
    const convData: any = {
      lastMessage: attachment ? `[${attachment.type.toUpperCase()}]` : cleanText,
      lastMessageTimestamp: serverTimestamp(),
      userEmail: senderEmail,
      id: conversationId // Ensure ID is set
    };

    if (senderId === 'admin') {
      convData.userUnreadCount = increment(1);
    } else {
      convData.unreadCount = increment(1);
      // Update user cache if provided
      if (userDetails?.displayName) convData.displayName = userDetails.displayName;
      if (userDetails?.photoURL) convData.photoURL = userDetails.photoURL;
    }

    batch.set(convRef, convData, { merge: true });

    await batch.commit();
    return newMessageRef.id;
  }

  // --- SUBSCRIPTIONS ---

  // Subscribe to a single conversation's messages
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'), 
      orderBy('timestamp', 'asc')
    ); // Limit if needed

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(msgs);
    });
  }

  // Subscribe to ALL conversations (For Admin Inbox)
  subscribeToAllConversations(callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'), 
      orderBy('lastMessageTimestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      callback(convs);
    });
  }

  // --- ACTIONS ---

  // Mark all messages in a conversation as seen (by Admin or User)
  async markAsSeen(conversationId: string, viewerRole: 'admin' | 'user') {
    const convRef = doc(db, 'conversations', conversationId);
    
    // 1. Reset unread count
    if (viewerRole === 'admin') {
       await updateDoc(convRef, { unreadCount: 0 });
    } else {
       await updateDoc(convRef, { userUnreadCount: 0 });
    }

    // 2. Update status of specific messages (Optional optimization: only update 'sent'/'delivered')
    // This might be expensive if many messages. For now, we rely on the counter for the badge.
    // To update visual "ticks", we would query messages where sender != viewer && status != 'seen'
  }

  // React to a message
  async toggleReaction(conversationId: string, messageId: string, userId: string, emoji: string) {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) return;

    const currentReactions = msgSnap.data().reactions || {};
    
    if (currentReactions[userId] === emoji) {
        delete currentReactions[userId];
    } else {
        currentReactions[userId] = emoji;
    }

    await updateDoc(msgRef, { reactions: currentReactions });
  }

  // Delete messsage
  async deleteMessage(conversationId: string, messageId: string) {
      await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
          isDeleted: true,
          text: '🚫 This message was deleted',
          fileUrl: null
      });
  }

  // Clear History (User Side - Admin still sees it unless manually deleted? Or just soft hide?)
  // User Request: "the next time they open the chat, it should start fresh... but history remains on admin side"
  // Implementation: We can store a "clearedTimestamp" in local storage or user profile. 
  // The query for the user will only fetch messages AFTER this timestamp.
  // The admin fetches ALL.
}

export const chatService = new ChatService();
