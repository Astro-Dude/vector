import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessageToGemini } from '../services/geminiService';

/**
 * SST AI Bot component that provides a chat interface for interacting with
 * the Gemini-powered AI about Scaler School of Technology
 */
const SSTChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hi there! I\'m the SST AI Bot. Ask me anything about Scaler School of Technology - curriculum, admissions, campus life, and more!' 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle window focus to ensure the bot stays functional during navigation
  useEffect(() => {
    const handleFocus = () => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = newMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Send message to Gemini API
      const response = await sendMessageToGemini(userMessage);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again later.',
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // If the chat is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      ref={chatContainerRef}
      className="fixed bottom-0 right-0 w-full md:w-96 h-[500px] md:h-[600px] md:mr-4 md:mb-4 bg-white rounded-t-lg md:rounded-lg shadow-xl flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-3">
        <div className="flex items-center">
          <div className="bg-white rounded-full p-1 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold">SST AI Bot</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-white p-1 rounded hover:bg-blue-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : message.error 
                    ? 'bg-red-100 text-red-700 rounded-bl-none' 
                    : 'bg-white shadow-md rounded-bl-none'
              }`}
            >
              {message.role === 'user' ? (
                message.content
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  <a href="https://www.linkedin.com/in/astro-dude" target="_blank" rel="noopener noreferrer">Connect with Shaurya Verma – Founder of Vector</a>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-white shadow-md rounded-bl-none max-w-[80%]">
              <div className="flex items-center">
                <div className="dot-typing"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-200 bg-white"
      >
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about SST..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || !newMessage.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          Information about Scaler School of Technology only
        </div>
      </form>
      
      {/* CSS for typing animation and markdown styling */}
      <style jsx="true">{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #3b82f6;
          color: #3b82f6;
          box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          animation: dot-typing 1.5s infinite linear;
        }

        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
          50% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px -10px 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px -10px 0 0 #3b82f6;
          }
          100% {
            box-shadow: 9984px 0 0 0 #3b82f6, 9999px 0 0 0 #3b82f6, 10014px 0 0 0 #3b82f6;
          }
        }
        
        /* Style markdown content */
        .markdown-content {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #333;
        }
        
        .markdown-content p {
          margin-bottom: 0.75rem;
        }
        
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        
        .markdown-content ul, 
        .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        
        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3, 
        .markdown-content h4 {
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .markdown-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .markdown-content pre {
          background-color: #f3f4f6;
          padding: 0.75rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
        
        .markdown-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .markdown-content th,
        .markdown-content td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        
        .markdown-content th {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default SSTChatBot; 