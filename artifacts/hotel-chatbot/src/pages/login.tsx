import { motion } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0d0f0e]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/seed-resort-bg.png`}
          alt="Seed Resort"
          className="w-full h-full object-cover"
          style={{ objectPosition: "65% 50%" }}
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-black/55" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-transparent to-black/50" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center"
          style={{
            background: "rgba(13, 15, 14, 0.75)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-6 shadow-lg"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              SEED Resort
            </h1>
            <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-6 font-medium">
              Concierge Portal
            </p>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              Sign in to access Aria, your personal AI concierge for an elevated stay experience.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={login}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm tracking-wide transition-shadow duration-300"
            style={{
              background: "linear-gradient(135deg, #52b788 0%, #2d6a4f 100%)",
              boxShadow: "0 4px 20px rgba(82, 183, 136, 0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(82, 183, 136, 0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(82, 183, 136, 0.25)";
            }}
          >
            Log in to continue
          </motion.button>

          <p className="mt-5 text-[10px] text-white/25 tracking-wider uppercase">
            Secure · Private · Encrypted
          </p>
        </div>
      </motion.div>

      {/* Bottom shimmer */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: "linear-gradient(90deg, transparent, rgba(82,183,136,0.5), transparent)" }}
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
