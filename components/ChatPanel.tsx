import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageType, AnalysisResponse } from '../types';
import { getAnalysis } from '../services/geminiService';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 'init',
      role: 'system',
      content: 'Welcome to Synoptic Edge. Enter your query to begin analysis. For example: "Analyze the Chiefs vs. Ravens game, focusing on QB props for Lamar Jackson."',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const analysisResponse: AnalysisResponse = await getAnalysis(query);
      const assistantMessage: MessageType = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: analysisResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: MessageType = {
        id: Date.now().toString() + '-err',
        role: 'system',
        content: error instanceof Error ? error.message : 'An unknown error occurred.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-800/30">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-4 max-w-2xl">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="ml-2 text-gray-400 text-sm">Analyzer is thinking...</span>
                </div>
            </div>
          )}
        </div>
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatPanel;