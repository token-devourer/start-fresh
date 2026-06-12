"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Card, GameSnapshot } from "@kartu-satu/shared";
import { canPlayCard } from "@/lib/rules";
import { CardView } from "./CardView";

interface HandProps {
  snapshot: GameSnapshot;
  isMyTurn: boolean;
  onPlay: (card: Card) => void;
  onPassDrawn: () => void;
}

export function Hand({ snapshot, isMyTurn, onPlay, onPassDrawn }: HandProps) {
  const t = useTranslations();
  const hand = snapshot.self?.hand ?? [];
  const drawnId = snapshot.self?.drawnCardId;
  const count = hand.length;
  const center = (count - 1) / 2;
  const spreadDeg = count > 1 ? Math.min(5, 40 / count) : 0;
  const arcPx = count > 1 ? Math.min(4, 30 / count) : 0;

  return (
    <div className="grid gap-2">
      {drawnId && isMyTurn ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-sm font-bold"
        >
          <span className="rounded-full bg-black/40 px-3 py-1.5">{t("board.drawnBadge")} ✨</span>
          <button className="button secondary !min-h-9 !px-4 text-sm" onClick={onPassDrawn}>
            {t("board.passDrawn")}
          </button>
        </motion.div>
      ) : null}

      <div className="thin-scroll overflow-x-auto pb-2 pt-5">
        <div className="mx-auto flex w-max items-end px-6">
          <AnimatePresence initial={false}>
            {hand.map((card, index) => {
              const playable = canPlayCard(snapshot, card);
              const isDrawn = card.id === drawnId;

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ y: 70, opacity: 0 }}
                  animate={{
                    y: Math.abs(index - center) * arcPx,
                    rotate: (index - center) * spreadDeg,
                    opacity: 1
                  }}
                  exit={{ y: -90, opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="relative -ml-7 first:ml-0"
                  style={{ transformOrigin: "bottom center", zIndex: index }}
                >
                  {isDrawn ? (
                    <span className="display absolute -top-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black text-black">
                      {t("board.drawnBadge")}
                    </span>
                  ) : null}
                  <CardView
                    card={card}
                    playable={playable}
                    dimmed={isMyTurn && !playable}
                    disabled={!playable}
                    onClick={() => onPlay(card)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
