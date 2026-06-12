"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Card, GameSnapshot } from "@congcard/shared";
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
  const rowCount = count <= 12 ? 1 : count <= 24 ? 2 : 3;
  const rows = chunkCards(hand, rowCount);
  const overlap = count <= 12 ? 28 : count <= 24 ? 38 : 48;
  const compact = count > 24;

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

      <div className="hand-stack pb-2 pt-5">
        {rows.map((row, rowIndex) => {
          const center = (row.length - 1) / 2;
          const spreadDeg = row.length > 1 ? Math.min(5, 40 / row.length) : 0;
          const arcPx = row.length > 1 ? Math.min(4, 30 / row.length) : 0;

          return (
            <div key={rowIndex} className="hand-row">
              <AnimatePresence initial={false}>
                {row.map((card, index) => {
                  const playable = canPlayCard(snapshot, card);
                  const isDrawn = card.id === drawnId;
                  const cardIndex = rowIndex * 100 + index;

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
                      className="relative"
                      style={{
                        marginLeft: index === 0 ? 0 : -overlap,
                        transformOrigin: "bottom center",
                        zIndex: cardIndex
                      }}
                    >
                      {isDrawn ? (
                        <span className="display absolute -top-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black text-black">
                          {t("board.drawnBadge")}
                        </span>
                      ) : null}
                      <CardView
                        card={card}
                        small={compact}
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
          );
        })}
      </div>
    </div>
  );
}

function chunkCards(cards: Card[], rowCount: number): Card[][] {
  const perRow = Math.ceil(cards.length / rowCount);

  return Array.from({ length: rowCount }, (_, index) => cards.slice(index * perRow, (index + 1) * perRow)).filter(
    (row) => row.length > 0
  );
}
