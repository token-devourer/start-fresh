"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Card, GameSnapshot } from "@congkak-game/shared";
import { anchorRect } from "@/lib/anchors";
import { useRoomStore } from "@/lib/store";

type Flight =
  | { kind: "card"; card: Card; from: string; to: string; delay?: number }
  | { kind: "back"; from: string; to: string; delay?: number }
  | { kind: "token"; from: string; to: string; delay?: number };

const MAX_BURST = 6;

// Derives card movements by diffing consecutive snapshots (the server sends no
// structured events) and flies GSAP-animated clones between registered anchors.
export function FlightLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<GameSnapshot | null>(null);
  const snapshot = useRoomStore((state) => state.snapshot);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = snapshot;

    const layer = layerRef.current;
    if (!snapshot || !prev || !layer || prev.code !== snapshot.code) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const flights: Flight[] = [];
    const sameRound =
      prev.roundNumber === snapshot.roundNumber && prev.phase === "playing" && snapshot.phase === "playing";

    if (sameRound) {
      if (snapshot.discardTop && snapshot.discardTop.id !== prev.discardTop?.id && prev.currentPlayerId) {
        flights.push({ kind: "card", card: snapshot.discardTop, from: `seat:${prev.currentPlayerId}`, to: "discard" });
      }

      for (const player of snapshot.players) {
        const before = prev.players.find((item) => item.id === player.id);
        if (!before) {
          continue;
        }

        const gained = player.cardCount - before.cardCount;
        if (gained > 0) {
          const to = player.id === snapshot.self?.id ? "hand" : `seat:${player.id}`;
          for (let i = 0; i < Math.min(gained, MAX_BURST); i += 1) {
            flights.push({ kind: "back", from: "draw", to, delay: i * 0.09 });
          }
        }
      }
    }

    if (
      snapshot.phase === "playing" &&
      prev.currentPlayerId &&
      snapshot.currentPlayerId &&
      snapshot.currentPlayerId !== prev.currentPlayerId
    ) {
      flights.push({ kind: "token", from: `seat:${prev.currentPlayerId}`, to: `seat:${snapshot.currentPlayerId}` });
    }

    for (const flight of flights) {
      spawnFlight(layer, flight);
    }
  }, [snapshot]);

  useEffect(() => {
    const layer = layerRef.current;
    return () => {
      if (layer) {
        gsap.killTweensOf(layer.children);
      }
    };
  }, []);

  return <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true" />;
}

function spawnFlight(layer: HTMLDivElement, flight: Flight) {
  const from = anchorRect(flight.from);
  const to = anchorRect(flight.to);
  if (!from || !to) {
    return;
  }

  const el = document.createElement("div");
  if (flight.kind === "card") {
    el.className = `card-face small ${flight.card.color ? `card-${flight.card.color}` : "card-wild"}`;
  } else if (flight.kind === "back") {
    el.className = "card-face small card-back";
  } else {
    el.className = "turn-token";
  }
  el.style.position = "absolute";
  el.style.left = "0";
  el.style.top = "0";
  el.style.willChange = "transform";
  layer.appendChild(el);

  const startX = from.left + from.width / 2 - el.offsetWidth / 2;
  const startY = from.top + from.height / 2 - el.offsetHeight / 2;
  const endX = to.left + to.width / 2 - el.offsetWidth / 2;
  const endY = to.top + to.height / 2 - el.offsetHeight / 2;
  const lift = Math.max(40, Math.abs(endY - startY) * 0.35);
  const spin = flight.kind === "token" ? 0 : startX < endX ? 14 : -14;

  gsap.set(el, { x: startX, y: startY, scale: flight.kind === "token" ? 0.6 : 0.72, opacity: 0.95, rotation: 0 });
  gsap.to(el, {
    delay: flight.delay ?? 0,
    keyframes: [
      {
        x: (startX + endX) / 2,
        y: Math.min(startY, endY) - lift,
        scale: flight.kind === "token" ? 1 : 1.04,
        rotation: spin,
        duration: 0.3,
        ease: "power2.out"
      },
      { x: endX, y: endY, scale: 1, rotation: 0, duration: 0.3, ease: "power2.in" },
      { opacity: 0, scale: 0.8, duration: 0.16, ease: "power1.in" }
    ],
    onComplete: () => el.remove()
  });
}
