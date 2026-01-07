import React, { useState } from 'react';
import {
  X, Headphones, MessageSquare, Mail, FileText, Send,
  CheckCircle, Loader2, ExternalLink, ArrowRight
} from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../constants';
import { userService } from '../services/userService';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'menu' | 'form' | 'success'>('menu');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmitTicket = async () => {
    if (!message.trim()) return;
    setIsLoading(true);

    try {
      const id = await userService.createSupportTicket(category, message);
      setTicketId(id); // UUID returned by Supabase
      setView('success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setView('menu');
    setMessage('');
    setTicketId('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">

        {/* Header */}
        <div className="bg-slate-900 p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Headphones className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Support Center</h2>
              <p className="text-slate-400 text-xs">We are here to help 24/7</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* MENU VIEW */}
          {view === 'menu' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-2">
                How would you like to contact us?
              </p>

              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors group"
              >
                <div className="bg-green-500 p-2 rounded-full text-white group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">Chat on WhatsApp</h3>
                  <p className="text-xs text-slate-500">Instant response</p>
                </div>
                <ExternalLink size={16} className="text-slate-400" />
              </a>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
              >
                <div className="bg-blue-500 p-2 rounded-full text-white group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">Email Us</h3>
                  <p className="text-xs text-slate-500">Get reply in 24hrs</p>
                </div>
                <ExternalLink size={16} className="text-slate-400" />
              </a>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-slate-400">OR</span>
                </div>
              </div>

              <button
                onClick={() => setView('form')}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group text-left"
              >
                <div className="bg-slate-500 p-2 rounded-full text-white group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">Raise a Complaint</h3>
                  <p className="text-xs text-slate-500">Trackable ticket system</p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            </div>
          )}

          {/* FORM VIEW */}
          {view === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Issue Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Payment Issue</option>
                  <option>App Bug / Crash</option>
                  <option>Translation Error</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue here..."
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl h-32 resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setView('menu')}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmitTicket}
                  disabled={isLoading || !message.trim()}
                  className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Submit Ticket <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {view === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ticket Registered!</h3>
              <p className="text-slate-500 text-sm mb-4">
                We’ve received your complaint.<br />Your Ticket Reference ID:
              </p>

              <div className="bg-slate-100 py-3 px-6 rounded-lg inline-block mb-6">
                <span className="font-mono text-lg font-bold text-slate-900 tracking-wider">
                  {ticketId}
                </span>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
