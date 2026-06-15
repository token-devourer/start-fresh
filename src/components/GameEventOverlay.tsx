"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRoomStore } from "@/lib/store";
import type { UiEvent } from "@/lib/events";

const COLOR_VAR: Record<string, string> = {
  red: "var(--red)",
  yellow: "var(--yellow)",
  green: "var(--green)",
  blue: "var(--blue)"
};

export function GameEventOverlay() {
  const events = useRoomStore((state) => state.events);
  const dismissEvent = useRoomStore((state) => state.dismissEvent);
  const toasts = events.filter((event) => event.type !== "yourTurn");
  const selfPenalty = toasts.some((event) => event.type === "penalty" && event.self);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center">
      <AnimatePresence>
        {selfPenalty ? (
          <motion.div
            key="penalty-flash"
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(224, 73, 60, 0.45))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          />
        ) : null}
      </AnimatePresence>

      <div className="grid justify-items-center gap-3">
        <AnimatePresence>
          {toasts.map((event) => (
            <EventToast key={event.id} event={event} onDone={() => dismissEvent(event.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function toastDuration(event: UiEvent): number {
  if (event.type === "penalty") {
    return event.self ? 2400 : 1800;
  }

  if (event.type === "catchWindow" || event.type === "calledOne") {
    return 2200;
  }

  if (event.type === "stack") {
    return 1400;
  }

  return 1500;
}

function EventToast({ event, onDone }: { event: UiEvent; onDone: () => void }) {
  const t = useTranslations();

  useEffect(() => {
    const id = window.setTimeout(onDone, toastDuration(event));
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const { label, sublabel, background, color } = toastContent(event, t);

  return (
    <motion.div
      layout
      initial={{ scale: 0.3, opacity: 0, y: 18 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -24 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`grid justify-items-center gap-1 ${event.type === "penalty" && event.self ? "shake" : ""}`}
    >
      <div
        className="display rounded-2xl border-2 border-white/25 px-7 py-3 text-3xl font-black text-white md:text-5xl"
        style={{ background, color, boxShadow: "var(--shadow-pop)" }}
      >
        {label}
      </div>
      {sublabel ? (
        <div className="rounded-full bg-black/75 px-4 py-1 text-sm font-bold text-white">{sublabel}</div>
      ) : null}
    </motion.div>
  );
}

function toastContent(
  event: UiEvent,
  t: ReturnType<typeof useTranslations>
): { label: string; sublabel?: string; background: string; color?: string } {
  switch (event.type) {
    case "penalty":
      return {
        label: `+${event.count}!`,
        sublabel: event.self
          ? t("events.youDrew", { count: event.count })
          : t("events.playerDrew", { name: event.nickname, count: event.count }),
        background: "linear-gradient(180deg, #f06354, var(--red))"
      };
    case "skip":
      return { label: t("events.skip"), background: "linear-gradient(180deg, #4d5a66, #28323c)" };
    case "reverse":
      return { label: t("events.reverse"), background: "linear-gradient(180deg, #5d96ec, var(--blue))" };
    case "colorChange":
      return {
        label: t("events.colorChange", { color: t(`colors.${event.color}`) }),
        background: COLOR_VAR[event.color] ?? "var(--gold)",
        color: event.color === "yellow" ? "#221706" : "white"
      };
    case "stack":
      return {
        label: `+${event.totalDraw}`,
        sublabel: t("events.stackPenalty"),
        background: "linear-gradient(180deg, #ffda5f, #d88a16)",
        color: "#211405"
      };
    case "calledOne":
      return {
        label: t("board.one"),
        sublabel: t("events.calledOne", { name: event.nickname }),
        background: "linear-gradient(180deg, var(--gold-strong), var(--gold))",
        color: "#221a07"
      };
    case "catchWindow":
      return {
        label: event.self ? t("events.youHaveOne") : t("events.catchWindow", { name: event.nickname }),
        background: "rgba(10, 14, 11, 0.9)"
      };
    default:
      return { label: "", background: "transparent" };
  }
}
