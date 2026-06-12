"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useNow } from "@/lib/useNow";

interface CatchTarget {
  id: string;
  nickname: string;
  deadline: number;
}

interface UnoButtonProps {
  canCallOne: boolean;
  onCallOne: () => void;
  catchTarget?: CatchTarget;
  onCatch: (targetId: string) => void;
}

export function UnoButton({ canCallOne, onCallOne, catchTarget, onCatch }: UnoButtonProps) {
  const t = useTranslations();

  return (
    <div className="fixed bottom-5 right-4 z-30 grid justify-items-end gap-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <AnimatePresence>
        {catchTarget ? (
          <motion.button
            key={`catch-${catchTarget.id}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="pulse-red display flex items-center gap-2 rounded-full border-2 border-white/30 px-5 py-3 text-lg font-black text-white"
            style={{ background: "linear-gradient(180deg, #f06354, var(--red))", boxShadow: "var(--shadow-pop)" }}
            onClick={() => onCatch(catchTarget.id)}
          >
            <span aria-hidden="true">👋</span>
            {t("board.catch", { name: catchTarget.nickname })}
            <CatchCountdown deadline={catchTarget.deadline} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {canCallOne ? (
          <motion.button
            key="one"
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="pulse-gold display grid h-24 w-24 place-items-center rounded-full border-4 border-white/40 text-2xl font-black text-[#221a07]"
            style={{
              background: "linear-gradient(180deg, var(--gold-strong), var(--gold) 60%, #d99e2b)",
              boxShadow: "0 0 44px rgba(242, 193, 78, 0.6), var(--shadow-pop)"
            }}
            onClick={onCallOne}
          >
            {t("board.one")}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CatchCountdown({ deadline }: { deadline: number }) {
  const now = useNow(100);
  const seconds = Math.max(0, (deadline - now) / 1000);

  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-black/40 text-sm tabular-nums">
      {seconds.toFixed(0)}
    </span>
  );
}
