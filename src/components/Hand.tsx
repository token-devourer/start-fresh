"use client";

import { useEffect, useRef, useState } from "react";
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

// Must mirror the .card-face widths in globals.css (including the 760px
// breakpoint) — they drive the overlap math below.
const CARD_WIDTH = { normal: 88, compact: 56 };
const CARD_WIDTH_NARROW = { normal: 70, compact: 46 };
// Minimum sliver of an overlapped card that must stay visible/clickable.
const MIN_VISIBLE_STEP = 14;
// Cards always overlap at least a little so the hand reads as a fan.
const MIN_OVERLAP = 24;

export function Hand({ snapshot, isMyTurn, onPlay, onPassDrawn }: HandProps) {
  const t = useTranslations();
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [stackWidth, setStackWidth] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);
  const hand = snapshot.self?.hand ?? [];
  const drawnId = snapshot.self?.drawnCardId;
  const drawnCount = drawnId ? 1 : 0;
  const count = hand.length;

  // The fan is sized from the measured panel width, so zooming in or out
  // (which shrinks/grows the CSS viewport) re-packs the cards instead of
  // overflowing the panel or needing scrollbars.
  useEffect(() => {
    const element = stackRef.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      const styles = window.getComputedStyle(element);
      const padding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      setStackWidth(element.clientWidth - padding);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const compact = count > 24;
  const cardWidth = isNarrow
    ? CARD_WIDTH_NARROW[compact ? "compact" : "normal"]
    : CARD_WIDTH[compact ? "compact" : "normal"];
  // 1040 mirrors the .hand-row max-width cap in globals.css.
  const usableWidth = Math.min(stackWidth > 0 ? stackWidth : 640, 1040);

  const maxPerRow = Math.max(1, Math.floor((usableWidth - cardWidth) / MIN_VISIBLE_STEP) + 1);
  const rowCountBySize = count <= 12 ? 1 : count <= 24 ? 2 : 3;
  const rowCount = Math.min(4, Math.max(rowCountBySize, Math.ceil(count / maxPerRow)));
  const rows = chunkCards(hand, rowCount);
  const longestRow = rows.reduce((max, row) => Math.max(max, row.length), 1);
  const step =
    longestRow > 1 ? Math.min(cardWidth - MIN_OVERLAP, (usableWidth - cardWidth) / (longestRow - 1)) : 0;
  const overlap = longestRow > 1 ? Math.max(0, cardWidth - step) : 0;

  return (
    <div className="grid gap-2">
      {drawnId && isMyTurn ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-sm font-bold"
        >
          <span className="rounded-full bg-black/40 px-3 py-1.5">{t("board.drawnBadge", { count: drawnCount })} ✨</span>
          <button className="button secondary !min-h-9 !px-4 text-sm" onClick={onPassDrawn}>
            {t("board.passDrawn")}
          </button>
        </motion.div>
      ) : null}

      <div ref={stackRef} className="hand-stack pb-2 pt-5">
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
                  const layer = cardIndex + (playable ? 1000 : 0) + (isDrawn ? 1000 : 0);

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
                        zIndex: layer
                      }}
                    >
                      {isDrawn ? (
                        <span className="display absolute -top-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black text-black">
                          {t("board.drawnBadge", { count: drawnCount })}
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
