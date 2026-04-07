import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { playHoverSound, playClickSound, playWhooshSound, playSuccessSound } from './utils/sounds';

const messages = [
  "Hey...",
  "I know things haven't been perfect lately.",
  "And I've made my fair share of mistakes.",
  "But every single day with you is a gift.",
  "You are the most beautiful, brilliant, and patient person I know.",
  "I am so incredibly sorry for when I fall short.",
  "I promise to keep growing, for us."
];

export default function App() {
  const { scrollYProgress } = useScroll();
  const crimsonOpacity = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const sunsetY = useTransform(scrollYProgress, [0, 1], ["10%", "-5%"]);
  const sunsetScale = useTransform(scrollYProgress, [0, 1], [0.9, 1.15]);
  const baseOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
  
  const [forgiven, setForgiven] = useState<string | null>(null);
  const [noCount, setNoCount] = useState(0);
  const [yesPressed, setYesPressed] = useState(false);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const noButtonRef = useRef<HTMLButtonElement>(null);

  const handleForgive = async (answer: string) => {
    playClickSound();
    setForgiven(answer);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'surveyResponses', auth.currentUser.uid), {
          forgiveMe: answer,
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid
        }, { merge: true });
      } catch (e) {
        console.error("Error saving survey:", e);
      }
    }
  };

  const handleNoInteraction = () => {
    playWhooshSound();
    setNoCount(prev => prev + 1);
    
    // Calculate random position within reasonable bounds
    const maxMove = 150;
    const randomX = (Math.random() - 0.5) * maxMove * 2;
    const randomY = (Math.random() - 0.5) * maxMove * 2;
    
    setNoPosition({ x: randomX, y: randomY });
  };

  const handleYes = async () => {
    playSuccessSound();
    setYesPressed(true);
    
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff0000', '#ff69b4', '#ff1493', '#ffffff']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff0000', '#ff69b4', '#ff1493', '#ffffff']
      });
    }, 250);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'surveyResponses', auth.currentUser.uid), {
          proposalAnswer: "Yes",
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid
        }, { merge: true });
      } catch (e) {
        console.error("Error saving proposal answer:", e);
      }
    }
  };

  const yesButtonScale = 1 + (noCount * 0.15);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white selection:bg-rose-500/30 overflow-x-hidden font-sans">
      {/* Backgrounds */}
      <motion.div 
        className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-black" 
        style={{ opacity: baseOpacity }}
      />
      <motion.div 
        className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-600/20 via-rose-900/40 to-transparent origin-bottom"
        style={{ 
          opacity: crimsonOpacity,
          y: sunsetY,
          scale: sunsetScale
        }}
      />
      <motion.div 
        className="fixed bottom-0 left-0 right-0 h-[60vh] z-0 bg-gradient-to-t from-rose-950/80 via-rose-900/20 to-transparent"
        style={{ opacity: crimsonOpacity }}
      />

      <div className="relative z-10">
        {/* Phase 1: The Soften */}
        <div className="flex flex-col items-center w-full">
          {messages.map((msg, index) => (
            <div key={index} className="min-h-[80vh] flex items-center justify-center w-full px-6">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-20%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="max-w-2xl w-full"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] shadow-rose-900/10">
                  <h2 className="text-2xl md:text-4xl font-light text-center leading-relaxed tracking-wide text-slate-200">
                    {msg}
                  </h2>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Phase 2: The Survey */}
        <div className="min-h-screen flex items-center justify-center w-full px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, margin: "-20%" }}
            transition={{ duration: 0.8 }}
            className="max-w-xl w-full backdrop-blur-xl bg-black/40 border border-rose-500/20 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(225,29,72,0.15)]"
          >
            <h3 className="text-3xl md:text-5xl font-light text-center mb-12 text-rose-100">
              Do you forgive me?
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => handleForgive('Yes')}
                onMouseEnter={playHoverSound}
                className={`px-8 py-4 rounded-full text-lg transition-all duration-300 border ${
                  forgiven === 'Yes' 
                    ? 'bg-rose-600 border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.5)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-rose-500/50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleForgive('Maybe')}
                onMouseEnter={playHoverSound}
                className={`px-8 py-4 rounded-full text-lg transition-all duration-300 border ${
                  forgiven === 'Maybe' 
                    ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'
                }`}
              >
                Maybe
              </button>
            </div>
            {forgiven && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8 text-rose-200/70 italic"
              >
                {forgiven === 'Yes' ? "Thank you. It means the world to me." : "I'll keep trying until it's a yes."}
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Phase 3: The Grand Finale */}
        <div className="min-h-screen flex items-center justify-center w-full px-6 py-20 pb-40">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-20%" }}
            transition={{ duration: 1.5 }}
            className="max-w-3xl w-full text-center"
          >
            <AnimatePresence mode="wait">
              {!yesPressed ? (
                <motion.div
                  key="proposal"
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  transition={{ duration: 0.8 }}
                  className="backdrop-blur-2xl bg-black/60 border border-rose-500/30 p-10 md:p-20 rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.2)]"
                >
                  <h1 className="text-5xl md:text-7xl font-light mb-16 bg-gradient-to-r from-rose-300 via-red-200 to-rose-300 text-transparent bg-clip-text">
                    Will you marry me?
                  </h1>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative min-h-[120px]">
                    <motion.button
                      onClick={handleYes}
                      onMouseEnter={playHoverSound}
                      animate={{ scale: yesButtonScale }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="px-10 py-5 rounded-full text-xl font-medium bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] border border-rose-400/50 z-20"
                    >
                      Yes
                    </motion.button>

                    <motion.button
                      ref={noButtonRef}
                      animate={{ x: noPosition.x, y: noPosition.y }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onMouseEnter={handleNoInteraction}
                      onClick={handleNoInteraction}
                      className="px-10 py-5 rounded-full text-xl font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 z-10 absolute sm:relative"
                      style={{ 
                        left: noPosition.x !== 0 ? 'auto' : undefined,
                        right: noPosition.x !== 0 ? 'auto' : undefined
                      }}
                    >
                      No
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="backdrop-blur-2xl bg-rose-950/40 border border-rose-500/50 p-10 md:p-20 rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.4)]"
                >
                  <h2 className="text-4xl md:text-6xl font-light text-rose-100 leading-tight">
                    Yeah you made the right decision<br/>love you darling 💘
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
