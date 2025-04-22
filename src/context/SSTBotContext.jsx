import { createContext, useState, useContext } from 'react';
import SSTChatBot from '../components/SSTChatBot';

// Create a context for the SST AI Bot
const SSTBotContext = createContext();

// Custom hook for using the SST Bot context
export const useSST = () => {
  return useContext(SSTBotContext);
};

// Provider component that will wrap the app
export const SSTBotProvider = ({ children }) => {
  const [isBotOpen, setIsBotOpen] = useState(false);
  
  // Function to open the bot
  const openBot = () => setIsBotOpen(true);
  
  // Function to close the bot
  const closeBot = () => setIsBotOpen(false);
  
  // Function to toggle the bot
  const toggleBot = () => setIsBotOpen(prev => !prev);
  
  // Value object to be provided to consumers
  const value = {
    isBotOpen,
    openBot,
    closeBot,
    toggleBot
  };
  
  return (
    <SSTBotContext.Provider value={value}>
      {children}
      <SSTChatBot isOpen={isBotOpen} onClose={closeBot} />
      
      {/* Floating action button for opening the bot */}
      {!isBotOpen && (
        <button
          onClick={openBot}
          className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-40"
          aria-label="Open AI Bot"
          title="Ask about SST"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      )}
    </SSTBotContext.Provider>
  );
};

export default SSTBotContext; 