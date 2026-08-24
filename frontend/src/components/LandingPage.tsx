// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Network } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, user, error } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#09090b', 
      color: '#fff', 
      overflow: 'hidden', 
      position: 'relative', 
      fontFamily: "'Inter', system-ui, sans-serif" 
    }}>
      
      {/* GenZ Animated Mesh Gradient Background */}
      <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at 50% 50%, rgba(168,85,247,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.15) 0%, transparent 40%)`, filter: 'blur(80px)', pointerEvents: 'none', animation: 'spin 25s linear infinite', zIndex: 0 }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }`}</style>

      {/* Floating Tech Elements */}
      <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} style={{ position: 'absolute', top: '15%', left: '15%', opacity: 0.1, zIndex: 1 }}>
        <Cpu style={{ width: '40px', height: '40px', color: '#a855f7' }} />
      </motion.div>
      <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} style={{ position: 'absolute', top: '25%', right: '20%', opacity: 0.1, zIndex: 1 }}>
        <Network style={{ width: '60px', height: '60px', color: '#ec4899' }} />
      </motion.div>

      <nav style={{ position: 'relative', zIndex: 10, padding: '24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '6px 16px', borderRadius: '9999px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', color: '#a855f7', textTransform: 'uppercase' }}>
            SIH 2026 EDITION
          </div>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
            style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '24px', 
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              padding: '3px',
              boxShadow: '0 0 40px rgba(168,85,247,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '100%', height: '100%', background: '#09090b', borderRadius: '21px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: '40px', height: '40px', color: '#a855f7', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' }} />
              </div>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, 
              color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' 
            }}
          >
            Solar<span style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}>Grid</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 400, marginBottom: '56px', maxWidth: '400px', margin: '0 auto 56px auto' }}
          >
            The next-generation microgrid OS. AI-driven load shedding and real-time telemetry.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={signInWithGoogle}
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
                    padding: '16px 32px', borderRadius: '16px', 
                    background: 'rgba(255,255,255,0.03)', 
                    color: '#fff', fontSize: '16px', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)', 
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.border = '1px solid rgba(168,85,247,0.4)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(168,85,247,0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
                >
                  <div style={{ background: '#fff', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                  Continue with Google
                </button>
                {error && (
                  <div style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.3)', fontSize: '14px', maxWidth: '400px' }}>
                    <strong>Auth Error:</strong> {error}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', borderRadius: '16px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderTopColor: '#a855f7', borderRightColor: '#a855f7', borderBottomColor: 'transparent', borderLeftColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                Initializing Grid...
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
