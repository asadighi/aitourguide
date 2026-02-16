/**
 * PlaylistPlayerContext – lifts the playlist player to App level
 * so audio playback persists across camera ↔ playlist ↔ results navigation.
 */

import React, { createContext, useContext } from "react";
import {
  usePlaylistPlayer,
  type PlaylistPlayerControls,
  type PlaylistPlayerInfo,
} from "./usePlaylistPlayer";

export type PlaylistPlayerContextValue = PlaylistPlayerControls &
  PlaylistPlayerInfo;

const PlaylistPlayerCtx =
  createContext<PlaylistPlayerContextValue | null>(null);

export function PlaylistPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = usePlaylistPlayer();
  return (
    <PlaylistPlayerCtx.Provider value={player}>
      {children}
    </PlaylistPlayerCtx.Provider>
  );
}

/**
 * Access the playlist player from any screen inside `<PlaylistPlayerProvider>`.
 */
export function usePlaylistPlayerContext(): PlaylistPlayerContextValue {
  const ctx = useContext(PlaylistPlayerCtx);
  if (!ctx) {
    throw new Error(
      "usePlaylistPlayerContext must be used within a <PlaylistPlayerProvider>"
    );
  }
  return ctx;
}

