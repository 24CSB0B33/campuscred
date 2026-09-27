import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { auth } from '../config/firebase';

// Chat for one booked session
export default function SessionChat({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;

    const connect = async () => {
      const token = await auth.currentUser.getIdToken();
      socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
      });
      socketRef.current = socket;

      socket.emit('join_session', sessionId);
      socket.on('new_message', (msg) => setMessages((prev) => [...prev, msg]));
    };

    connect();
    return () => socket?.disconnect();
  }, [sessionId]);

  const send = () => {
    if (!text.trim()) return;
    socketRef.current.emit('send_message', { sessionId, content: text });
    setText('');
  };

  return (
    <div className="border rounded flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold">{m.sender_name}: </span>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex border-t p-2">
        <input
          className="flex-1 border rounded px-2 py-1 mr-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
        />
        <button onClick={send} className="bg-indigo-600 text-white px-3 py-1 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
