import React, { useState } from 'react';
import { SendIcon } from '@/components/icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="border-t border-gray-700/50 bg-gray-800/50 p-4">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Enter your analytical query..."
          className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 py-3 pl-4 pr-16 text-gray-200 placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute bottom-2.5 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500 text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600"
          disabled={isLoading || !input.trim()}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;