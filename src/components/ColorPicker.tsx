"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Color } from "@kartu-satu/shared";
import { COLORS } from "@kartu-satu/shared";

interface ColorPickerProps {
  onPick: (color: Color) => void;
  onCancel: () => void;
}

export function ColorPicker({ onPick, onCancel }: ColorPickerProps) {
  const t = useTranslations();

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.7, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 24 }}
        className="panel grid w-full max-w-sm gap-4 p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="display text-center text-2xl font-black">{t("colorPicker.title")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((color, index) => (
            <motion.button
              key={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 380, damping: 20 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className={`card-${color} display h-24 rounded-xl border-2 border-white/30 text-xl font-black ${
                color === "yellow" ? "text-[#221706]" : "text-white"
              }`}
              style={{ boxShadow: "var(--shadow-pop)" }}
              onClick={() => onPick(color)}
            >
              {t(`colors.${color}`)}
            </motion.button>
          ))}
        </div>
        <button className="button secondary" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </motion.div>
    </motion.div>
  );
}
