import { useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSending(true);
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ targetType, targetId, reason })
    });
    setSending(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        {done ? (
          <>
            <h3 className="font-bold text-gray-900 mb-2">Denúncia enviada</h3>
            <p className="text-sm text-gray-500 mb-4">
              Nossa equipe vai analisar o caso. Obrigado por ajudar a manter o Divide Aí seguro.
            </p>
            <button onClick={onClose} className="btn-primary w-full">Fechar</button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h3 className="font-bold text-gray-900">Denunciar</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              rows={4}
              required
              className="border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
            />
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-outline text-sm flex-1">Cancelar</button>
              <button className="btn-primary text-sm flex-1" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
