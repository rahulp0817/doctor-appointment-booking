"use client"
import { Monitor, Moon, Sun } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();

  // Handle scroll effect
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  const ThemeToggle = () => (
    <div className="flex items-center gap-2">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme('light')} 
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light' 
            ? 'bg-white dark:bg-gray-800 text-yellow-500' 
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme('dark')} 
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 text-blue-400 shadow-md' 
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme('system')} 
        className={`p-2 rounded-lg transition-colors ${
          theme === 'system' 
            ? 'bg-gray-100 dark:bg-gray-700 text-blue-500 shadow-md' 
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="System preference"
      >
        <Monitor className="w-4 h-4" />
      </motion.button>
    </div>
  );

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-4 shadow-sm' 
          : 'bg-transparent py-6'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Doctor Appointment
            </h1>
            
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="dark:bg-gray-800 bg-gray-100 rounded-lg px-2 py-1"
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
