import React, { useState, useRef, useEffect } from 'react';

interface Message { role: 'user' | 'frost'; text: string; }

const API = 'http://localhost:3000';

export default function Chat({ address }: { address: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'frost', text: "Yo! I'm Frost. Challenge me to a game, place a World Cup bet, or ask for your stats. What's it gonna be?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: userMsg }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'frost', text: data.reply || 'Frost glitched...' }]);
    } catch(e) {
      setMessages(m => [...m, { role: 'frost', text: 'Connection error. Try again.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: '#111', borderRadius: 12, padding: 16, height: 400, overflowY: 'auto', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block', padding: '8px 14px', borderRadius: 12,
              background: m.role === 'user' ? '#00d4ff' : '#222',
              color: m.role === 'user' ? '#000' : '#fff', maxWidth: '80%'
            }}>{m.text}</span>
          </div>
        ))}
        {loading && <div style={{ color: '#888' }}>Frost is thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Talk to Frost..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white', fontSize: 15 }}
        />
        <button onClick={send} disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, background: '#00d4ff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Send
        </button>
      </div>
    </div>
  );
}
