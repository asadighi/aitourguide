# Milestone BA – Snap Queue + Sequential Narration

## milestone metadata

```json
{
  "milestone_id": "ba",
  "milestone_name": "Snap Queue + Sequential Narration",
  "status": "done",
  "current_focus_task_id": null,
  "started_at": "2026-02-16",
  "completed_at": "2026-02-16T12:15:00Z",
  "definition_of_done": [
    "User can take multiple snaps without the camera blocking",
    "Each snap is processed in the background and joins a queue",
    "Queue/playlist screen shows all snapped landmarks with their status",
    "Narrations play sequentially in snap order",
    "Each narration is introduced with the landmark name before playing",
    "Errors on individual snaps don't block the rest of the queue"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-ba",
    "last_run_at": null,
    "last_result": null
  },
  "notes": []
}
```

## current focus

All tasks complete ✅

---

## context

Currently the app processes one snap at a time: the camera blocks while the image is identified + guide content generated + TTS rendered — a round-trip that can take several seconds. The user must wait for the full result before snapping again. For a walking tour where the user passes many landmarks, this is painfully slow.

Milestone BA introduces a **snap queue** so the user can keep snapping while previous snaps process in the background. Results accumulate in a playlist and narrations play sequentially, each one announcing which landmark it's about before diving into the content.

### Current flow (blocking)
```
Camera → [snap, block 5-15s] → Results → Back → Camera → [snap, block] → ...
```

### Target flow (queued)
```
Camera → snap → snap → snap → (switch to Playlist)
                                 ↓
                          ┌─────────────┐
                          │  🏛️ Eiffel   │ ▶ playing
                          │  🗽 Statue   │ ⏳ processing
                          │  🏰 Tower    │ ● ready
                          └─────────────┘
```

---

## tasks

### BA-1: Snap Queue State Management

```json
{
  "task_id": "BA-1",
  "title": "Create snap queue data model and state management",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Define SnapQueueItem interface (id, status, snapResult, error, timestamp, locale)",
    "Define queue item statuses: pending → processing → ready → error",
    "Create useSnapQueue hook or React context for queue state",
    "Implement queue operations: enqueue, remove, clear, updateStatus",
    "Expose derived state: pendingCount, readyCount, currentItem, allItems",
    "Unit tests for queue state transitions"
  ],
  "acceptance_criteria": [
    "Queue items transition through statuses correctly",
    "Multiple items can be in different states simultaneously",
    "Queue maintains insertion order (FIFO for playback)",
    "Removing/clearing items works correctly",
    "Queue state is reactive (components re-render on changes)"
  ],
  "tests_required": [
    "Unit test: enqueue adds item in pending state",
    "Unit test: status transitions (pending → processing → ready)",
    "Unit test: error state is set correctly with error message",
    "Unit test: queue maintains FIFO order",
    "Unit test: remove and clear operations"
  ],
  "progress_log": [
    "Created queue/types.ts: SnapQueueItem, SnapQueueItemStatus, SnapQueueCounts, SnapResult",
    "Created queue/SnapQueueContext.tsx: React context, provider, useSnapQueue hook, queueReducer",
    "Created queue/index.ts: barrel export",
    "Created __tests__/snap-queue.test.ts: 20 tests covering all reducer actions, FIFO order, mixed states, extractLandmarkName, generateQueueId",
    "All 31 frontend tests pass (20 queue + 11 locale)"
  ],
  "error": null
}
```

---

### BA-2: Non-blocking Camera with Background Snap Processing

```json
{
  "task_id": "BA-2",
  "title": "Modify camera to dispatch snaps to queue without blocking UI",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["BA-1"],
  "subtasks": [
    "Refactor CameraScreen: snap dispatches to queue, camera stays active",
    "Fire snap API call in background (no await blocking the camera)",
    "On API success → update queue item to 'ready' with snapResult",
    "On API error → update queue item to 'error' with message",
    "Show toast/haptic feedback on snap (confirming it was queued)",
    "Add queue badge on camera UI showing count (processing / ready)",
    "Tapping queue badge navigates to playlist screen",
    "Limit concurrent in-flight API calls to prevent overload (max 3)"
  ],
  "acceptance_criteria": [
    "Camera never leaves view after snapping — user can immediately snap again",
    "Each snap creates a queue item that processes in the background",
    "Camera shows a live badge with queue count",
    "Failed snaps show brief error toast but don't block camera",
    "Concurrent snap limit prevents API overload"
  ],
  "tests_required": [
    "Unit test: snap dispatches to queue and does not navigate away",
    "Unit test: queue badge reflects correct counts",
    "Integration test: multiple rapid snaps all produce queue items"
  ],
  "progress_log": [
    "Created queue/useBackgroundSnap.ts: hook with MAX_CONCURRENT=3, pending job queue, auto-drain",
    "Refactored CameraScreen: removed blocking processImage/onResult/onClarification, uses dispatchSnap instead",
    "Added flash overlay animation on snap for instant feedback",
    "Added queue badge (top-left) with count + processing/ready indicator",
    "Added playlist button (bottom-right) with mini count badge",
    "Updated App.tsx: wrapped with SnapQueueProvider, added 'playlist' screen type, placeholder playlist screen",
    "Created __tests__/background-snap.test.ts: 8 tests covering concurrency limiting, error handling, FIFO drain, lifecycle",
    "All 142 tests pass across full codebase (39 frontend + 54 mcp + 49 backend)"
  ],
  "error": null
}
```

---

### BA-3: Queue Playlist Screen

```json
{
  "task_id": "BA-3",
  "title": "Build playlist screen showing all queued snap results",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["BA-1"],
  "subtasks": [
    "Create PlaylistScreen component with scrollable list of queue items",
    "Each card shows: landmark name (or 'Identifying…'), status icon, locale flag",
    "Status states: ⏳ processing, ✅ ready, ❌ error, ▶️ playing, ✓ played",
    "Tapping a 'ready' card expands to show full result (facts, summary, etc.)",
    "Swipe-to-dismiss or delete button to remove items",
    "Empty state: 'No snaps yet — go back and snap some landmarks!'",
    "Add navigation: camera ↔ playlist (bottom tab or toggle button)",
    "Wire up App.tsx screen state to include 'playlist' screen"
  ],
  "acceptance_criteria": [
    "Playlist shows all queue items in snap order",
    "Item status updates in real time as processing completes",
    "User can view full details of any ready item",
    "User can remove individual items",
    "Navigation between camera and playlist is smooth"
  ],
  "tests_required": [
    "Unit test: playlist renders items in correct order",
    "Unit test: status indicators match queue item state",
    "Unit test: empty state renders when queue is empty",
    "Unit test: expand/collapse works for ready items"
  ],
  "progress_log": [],
  "error": null
}
```

---

### BA-4: Sequential Narration Playback with Landmark Announcements

```json
{
  "task_id": "BA-4",
  "title": "Implement sequential audio playback across queue with landmark intros",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["BA-2", "BA-3"],
  "subtasks": [
    "Create usePlaylistPlayer hook managing sequential audio playback",
    "Player finds next 'ready' item in queue order, loads its audio",
    "Before each narration, play a short TTS intro: 'Next up: [landmark name]'",
    "Generate intro TTS clips via existing TTS pipeline (short, cached)",
    "Add backend endpoint or extend /snap to also return intro audio",
    "Auto-advance: when one narration finishes, move to next ready item",
    "Playlist-level controls: play/pause all, skip to next, skip to previous",
    "Highlight currently-playing item in playlist UI",
    "Handle edge case: new items become ready while playlist is playing",
    "Handle edge case: skip over error items automatically",
    "Playback state persists across camera ↔ playlist navigation"
  ],
  "acceptance_criteria": [
    "Narrations play in queue order without user intervention",
    "Each narration is preceded by a spoken intro identifying the landmark",
    "User can pause, resume, skip forward, and skip backward",
    "Currently playing item is visually highlighted in playlist",
    "New items that become ready are appended to the playback queue",
    "Error items are skipped automatically",
    "Audio continues when switching between camera and playlist screens"
  ],
  "tests_required": [
    "Unit test: playlist player advances to next item on finish",
    "Unit test: error items are skipped",
    "Unit test: pause/resume preserves position",
    "Unit test: skip forward/backward works correctly",
    "Integration test: intro + narration play in correct sequence"
  ],
  "progress_log": [
    "Created playlistPlayerReducer.ts: pure state machine with PlaybackPhase (idle/intro/narration/paused), playerReducer, findNextPlayableItemId, findPrevPlayableItemId",
    "Created usePlaylistPlayer.ts: hook wiring reducer to expo-av (Audio.Sound) for narration and expo-speech for landmark intros ('Next up: [name]')",
    "Added expo-speech dependency for device-local intro announcements (instant, no server roundtrip)",
    "Updated PlaylistScreen: transport controls (⏮ ⏸/▶️ ⏹ ⏭), currently-playing card highlight (border + accent color), played items shown dimmed with ✓",
    "Status indicators updated: ▶️ Playing / Introducing… for current item, ✓ Played for completed items",
    "Auto-advance: when narration finishes, automatically plays next ready item in queue order",
    "Edge cases: skips error items, handles item removal mid-playback, staysActiveInBackground=true for camera↔playlist nav",
    "Created __tests__/playlist-player.test.ts: 38 tests covering full reducer lifecycle, PLAY_ITEM, INTRO_FINISHED, NARRATION_FINISHED, PAUSE/RESUME, STOP, ITEM_REMOVED, RESET, findNextPlayableItemId (skips errors/processing/no-audio/played), findPrevPlayableItemId",
    "All 207 tests pass across full codebase (94 frontend + 54 mcp + 49 backend + 10 shared)"
  ],
  "error": null
}
```


