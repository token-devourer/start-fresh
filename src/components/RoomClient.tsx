"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Client, Room } from "@colyseus/sdk";
import type { Card, Color, GameSnapshot, RoomSettings } from "@kartu-satu/shared";
import { AVATARS } from "@kartu-satu/shared";
import { anchorRef } from "@/lib/anchors";
import { resolveRoom } from "@/lib/api";
import { Avatar } from "./Avatar";
import { AvatarGrid } from "./AvatarGrid";
import { GAME_SERVER_URL } from "@/lib/config";
import { LOG_ICON, translateLog, type Translate } from "@/lib/log";
import { canPlayCard, needsColor } from "@/lib/rules";
import { useRoomStore } from "@/lib/store";
import { ChallengeModal } from "./ChallengeModal";
import { ColorPicker } from "./ColorPicker";
import { FlightLayer } from "./FlightLayer";
import { GameEventOverlay } from "./GameEventOverlay";
import { Hand } from "./Hand";
import { LanguageToggle } from "./LanguageToggle";
import { RoundEndOverlay } from "./RoundEndOverlay";
import { RoundTable } from "./RoundTable";
import { TurnBanner } from "./TurnBanner";
import { UnoButton } from "./UnoButton";

interface RoomClientProps {
  code: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "closed";

export function RoomClient({ code }: RoomClientProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get("roomId");
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const { snapshot, error, setSnapshot, setError, reset } = useRoomStore();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState<(typeof AVATARS)[number]>("sun");
  const [profileReady, setProfileReady] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    const savedName = window.localStorage.getItem("kartu-satu:nickname");
    const savedAvatar = window.localStorage.getItem("kartu-satu:avatar");
    setNickname(savedName ?? "");
    if (savedAvatar && AVATARS.includes(savedAvatar as (typeof AVATARS)[number])) {
      setAvatarId(savedAvatar as (typeof AVATARS)[number]);
    }
    setProfileReady(true);

    return () => {
      roomRef.current?.leave();
      reset();
    };
  }, [reset]);

  const connect = useCallback(async () => {
    if (!nickname.trim() || connectingRef.current || roomRef.current) {
      return;
    }

    connectingRef.current = true;
    setStatus("connecting");
    setError("");

    try {
      const client = new Client(GAME_SERVER_URL);
      const reconnectKey = `kartu-satu:reconnect:${code}`;
      const token = window.localStorage.getItem(reconnectKey);
      let room: Room | null = null;

      if (token) {
        try {
          room = await client.reconnect(token);
        } catch {
          window.localStorage.removeItem(reconnectKey);
        }
      }

      if (!room) {
        const lookup = roomIdFromUrl ? { code, roomId: roomIdFromUrl } : await resolveRoom(code);
        room = await client.joinById(lookup.roomId, {
          nickname: nickname.trim(),
          avatarId
        });
      }

      roomRef.current = room;
      setStatus("connected");
      window.localStorage.setItem("kartu-satu:nickname", nickname.trim());
      window.localStorage.setItem("kartu-satu:avatar", avatarId);
      if (room.reconnectionToken) {
        window.localStorage.setItem(reconnectKey, room.reconnectionToken);
      }

      room.onMessage("state", (nextSnapshot: GameSnapshot) => {
        setSnapshot(nextSnapshot);
      });
      room.onMessage("error", (payload: { message?: string }) => {
        setError(payload.message ?? t("common.actionFailed"));
      });
      room.onLeave(() => {
        setStatus("closed");
        roomRef.current = null;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("landing.connectionFailed"));
      setStatus("closed");
    } finally {
      connectingRef.current = false;
    }
  }, [avatarId, code, nickname, roomIdFromUrl, setError, setSnapshot, t]);

  useEffect(() => {
    if (profileReady && nickname.trim()) {
      void connect();
    }
  }, [connect, nickname, profileReady]);

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void connect();
  }

  function send(type: string, payload?: unknown) {
    setError("");
    roomRef.current?.send(type, payload);
  }

  if (!profileReady) {
    return null;
  }

  if (!nickname.trim()) {
    return (
      <main className="app-shell grid min-h-screen place-items-center py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel grid w-full max-w-md gap-4 p-5"
          onSubmit={submitProfile}
        >
          <div>
            <p className="display text-sm font-black uppercase tracking-[0.18em] text-[var(--gold)]">
              {t("room.title", { code })}
            </p>
            <h1 className="display mt-2 text-2xl font-black">{t("room.chooseSeatName")}</h1>
          </div>
          <input
            className="field"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={20}
            placeholder={t("landing.nicknamePlaceholder")}
          />
          <AvatarGrid value={avatarId} onChange={setAvatarId} />
          <button className="button" disabled={!nickname.trim() || status === "connecting"}>
            {t("room.join")}
          </button>
        </motion.form>
      </main>
    );
  }

  return (
    <main className="app-shell py-3 md:py-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="display text-sm font-black uppercase tracking-[0.18em] text-[var(--gold)]">{t("common.appName")}</p>
          <h1 className="display text-2xl font-black">{t("room.title", { code })}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span
            className={`flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1 ${
              status === "closed" ? "text-red-300" : ""
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status === "connected" ? "bg-green-400" : status === "connecting" ? "animate-pulse bg-[var(--gold)]" : "bg-red-400"
              }`}
            />
            {t(`room.status.${status}`)}
          </span>
          <LanguageToggle />
          <a className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--text)]" href="/rules">
            {t("room.rules")}
          </a>
        </div>
      </header>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!snapshot ? (
        <div className="panel grid min-h-[420px] place-items-center p-6 text-[var(--muted)]">{t("room.connecting")}</div>
      ) : snapshot.phase === "lobby" ? (
        <Lobby snapshot={snapshot} code={code} send={send} />
      ) : (
        <Board snapshot={snapshot} send={send} selectedCard={selectedCard} setSelectedCard={setSelectedCard} />
      )}
    </main>
  );
}

function Lobby({
  snapshot,
  code,
  send
}: {
  snapshot: GameSnapshot;
  code: string;
  send: (type: string, payload?: unknown) => void;
}) {
  const t = useTranslations();
  const me = snapshot.players.find((player) => player.id === snapshot.self?.id);
  const isHost = Boolean(me?.isHost);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  function updateSetting(input: Partial<RoomSettings>) {
    send("room.updateSettings", input);
  }

  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? code : window.location.href;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard unavailable (insecure context) — ignore
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="panel p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-xl font-black">{t("lobby.players")}</h2>
          <div className="flex flex-wrap gap-2">
            <button className="button secondary !min-h-9 !px-3 text-sm" onClick={() => copy("code")}>
              {copied === "code" ? t("lobby.copied") : `📋 ${t("lobby.copyCode")}`}
            </button>
            <button className="button secondary !min-h-9 !px-3 text-sm" onClick={() => copy("link")}>
              {copied === "link" ? t("lobby.copied") : `🔗 ${t("lobby.copyLink")}`}
            </button>
            <button className="button !min-h-9 !px-3 text-sm" onClick={() => send("room.ready", { ready: !me?.ready })}>
              {me?.ready ? t("lobby.notReady") : t("lobby.ready")}
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {snapshot.players.map((player) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-black/20 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar avatarId={player.avatarId} size={44} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-black">
                      {player.isHost ? "👑 " : ""}
                      {player.nickname}
                      {player.id === snapshot.self?.id ? <span className="text-[var(--gold)]"> ★</span> : null}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <span className={player.ready ? "font-bold text-green-300" : ""}>
                        {player.ready ? `✓ ${t("lobby.statusReady")}` : t("lobby.statusWaiting")}
                      </span>
                      <span>·</span>
                      <span className={player.connected ? "" : "text-red-300"}>
                        {player.connected ? t("lobby.online") : t("lobby.offline")}
                      </span>
                    </div>
                  </div>
                </div>
                {isHost && !player.isHost ? (
                  <button className="button danger !min-h-9 !px-3 text-sm" onClick={() => send("room.kick", { playerId: player.id })}>
                    {t("lobby.kick")}
                  </button>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <aside className="panel grid content-start gap-4 p-4">
        <h2 className="display text-xl font-black">{t("lobby.settings")}</h2>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-[var(--muted)]">{t("lobby.maxPlayers")}</span>
          <select
            className="field"
            disabled={!isHost}
            value={snapshot.settings.maxPlayers}
            onChange={(event) => updateSetting({ maxPlayers: Number(event.target.value) })}
          >
            {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-[var(--muted)]">{t("lobby.turnTimer")}</span>
          <select
            className="field"
            disabled={!isHost}
            value={snapshot.settings.turnTimeoutSec}
            onChange={(event) => updateSetting({ turnTimeoutSec: Number(event.target.value) })}
          >
            {[15, 30, 45, 60].map((value) => (
              <option key={value} value={value}>
                {t("lobby.seconds", { value })}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-[var(--muted)]">{t("lobby.scoreTarget")}</span>
          <select
            className="field"
            disabled={!isHost}
            value={snapshot.settings.scoreTarget}
            onChange={(event) => updateSetting({ scoreTarget: Number(event.target.value) as RoomSettings["scoreTarget"] })}
          >
            <option value={0}>{t("lobby.oneRound")}</option>
            <option value={500}>{t("lobby.points500")}</option>
          </select>
        </label>
        {isHost ? (
          <button className="button" disabled={snapshot.players.length < 2} onClick={() => send("game.start")}>
            {snapshot.players.length < 2 ? t("lobby.needPlayers") : t("lobby.start")}
          </button>
        ) : (
          <p className="text-center text-sm text-[var(--muted)]">{t("lobby.waitingHost")}</p>
        )}
      </aside>
    </section>
  );
}

function Board({
  snapshot,
  send,
  selectedCard,
  setSelectedCard
}: {
  snapshot: GameSnapshot;
  send: (type: string, payload?: unknown) => void;
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
}) {
  const t = useTranslations();
  const me = snapshot.players.find((player) => player.id === snapshot.self?.id);
  const isMyTurn = snapshot.phase === "playing" && snapshot.currentPlayerId === snapshot.self?.id && !snapshot.pendingChallenge;
  const canCallOne = snapshot.self?.hand.length === 1 && !me?.calledOne;
  const canDraw = isMyTurn && !snapshot.self?.drawnCardId;
  const oneTarget =
    snapshot.oneWindow && snapshot.oneWindow.playerId !== me?.id
      ? snapshot.players.find((player) => player.id === snapshot.oneWindow?.playerId)
      : undefined;

  function play(card: Card) {
    if (!canPlayCard(snapshot, card)) {
      return;
    }

    if (needsColor(card)) {
      setSelectedCard(card);
      return;
    }

    send("game.playCard", { cardId: card.id });
  }

  function chooseColor(color: Color) {
    if (!selectedCard) {
      return;
    }

    send("game.playCard", { cardId: selectedCard.id, declaredColor: color });
    setSelectedCard(null);
  }

  return (
    <>
      <section className="board">
        <div className="relative">
          <RoundTable
            snapshot={snapshot}
            isMyTurn={isMyTurn}
            canDraw={canDraw}
            onDraw={() => send("game.drawCard")}
            onCatch={(targetId) => send("game.catchOne", { targetId })}
          />
          <LogTicker snapshot={snapshot} />
        </div>

        <div
          ref={anchorRef("hand")}
          className={`panel p-3 transition-shadow duration-300 ${isMyTurn ? "my-turn-glow" : ""}`}
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{t("board.yourHand")}</span>
            <span className="text-xs font-bold text-[var(--muted)]">
              {t("board.cards", { count: snapshot.self?.hand.length ?? 0 })} · {t("board.points", { score: me?.score ?? 0 })}
            </span>
          </div>
          <Hand
            snapshot={snapshot}
            isMyTurn={isMyTurn}
            onPlay={play}
            onPassDrawn={() => send("game.playDrawn", { play: false })}
          />
        </div>
      </section>

      <FlightLayer />
      <TurnBanner isMyTurn={isMyTurn} />
      <GameEventOverlay />
      <ChallengeModal snapshot={snapshot} send={send} />
      <RoundEndOverlay snapshot={snapshot} send={send} />
      <UnoButton
        canCallOne={Boolean(canCallOne)}
        onCallOne={() => send("game.callOne")}
        catchTarget={
          oneTarget && snapshot.oneWindow
            ? { id: oneTarget.id, nickname: oneTarget.nickname, deadline: snapshot.oneWindow.deadline }
            : undefined
        }
        onCatch={(targetId) => send("game.catchOne", { targetId })}
      />
      <AnimatePresence>
        {selectedCard ? <ColorPicker onPick={chooseColor} onCancel={() => setSelectedCard(null)} /> : null}
      </AnimatePresence>
    </>
  );
}

function LogTicker({ snapshot }: { snapshot: GameSnapshot }) {
  const t = useTranslations();
  const entries = snapshot.actionLog.slice(-5);

  return (
    <aside className="absolute left-1 top-1 z-20 hidden w-60 rounded-xl bg-black/45 p-2.5 backdrop-blur-sm md:block">
      <h2 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">{t("board.log")}</h2>
      <div className="grid gap-1 text-xs leading-snug">
        {entries.map((entry, index) => (
          <div
            key={entry.seq}
            className="flex items-start gap-1.5"
            style={{ opacity: 0.45 + 0.55 * ((index + 1) / entries.length) }}
          >
            <span aria-hidden="true">{LOG_ICON[entry.type] ?? "•"}</span>
            <span className="min-w-0 flex-1">{translateLog(entry.message, t as Translate)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
