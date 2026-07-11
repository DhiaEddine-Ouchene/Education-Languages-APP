"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LevelUpModal({ level, open, onClose }: { level: number; open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-primary-dark/90 flex items-center justify-center px-4">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center text-white">
            <p className="text-7xl mb-4">🎉</p>
            <h2 className="font-heading font-bold text-4xl mb-2">Level up!</h2>
            <p className="text-xl mb-6">You reached <b>Level {level}</b></p>
            <Button variant="accent" size="lg" onClick={onClose}>Keep learning</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
