"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isSoundMuted, setSoundMuted, unlockSound } from "@/lib/sound";

export function SoundToggle() {
  const t = useTranslations();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) {
      unlockSound();
    }
  }

  return (
    <button className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--text)]" onClick={toggle} type="button">
      {muted ? t("common.soundOff") : t("common.soundOn")}
    </button>
  );
}
