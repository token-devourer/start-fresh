"use client";

import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

// Each avatar id keeps its elemental theme through the background gradient,
// while the seed drives a distinct human face/hair/outfit per id.
const THEME: Record<string, { seed: string; bg: [string, string] }> = {
  sun: { seed: "Surya", bg: ["f2c14e", "e07b3c"] },
  moon: { seed: "Chandra", bg: ["4c5fd5", "232a6b"] },
  star: { seed: "Bintang", bg: ["eebc3a", "9b6a12"] },
  bolt: { seed: "Kilat", bg: ["9b5fd5", "5b2a8a"] },
  leaf: { seed: "Daun", bg: ["2f9b67", "1c5e3d"] },
  wave: { seed: "Ombak", bg: ["3d7edb", "1d4a8a"] },
  flame: { seed: "Api", bg: ["e0493c", "8a2018"] },
  stone: { seed: "Batu", bg: ["8b8f87", "4a4e46"] },
  comet: { seed: "Komet", bg: ["35b5a5", "176258"] },
  spark: { seed: "Percik", bg: ["e879ad", "a8326b"] },
  cloud: { seed: "Awan", bg: ["7db4d8", "3a6a8c"] },
  gem: { seed: "Permata", bg: ["b05fd5", "5e2a8a"] }
};

const uriCache = new Map<string, string>();

export function avatarUri(avatarId: string): string {
  const cached = uriCache.get(avatarId);
  if (cached) {
    return cached;
  }

  const theme = THEME[avatarId] ?? { seed: avatarId, bg: ["1a2420", "0d1410"] as [string, string] };
  const uri = createAvatar(adventurer, {
    seed: theme.seed,
    backgroundColor: theme.bg,
    backgroundType: ["gradientLinear"],
    backgroundRotation: [25]
  }).toDataUri();

  uriCache.set(avatarId, uri);
  return uri;
}

interface AvatarProps {
  avatarId: string;
  size?: number;
  className?: string;
}

export function Avatar({ avatarId, size = 40, className = "" }: AvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimizer needed
    <img
      src={avatarUri(avatarId)}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`rounded-full ${className}`}
    />
  );
}
