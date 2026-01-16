# Habitica P2P / WebXDC Implementation

This directory contains the local backend implementation for Habitica to support peer-to-peer synchronization using webxdc.

## Overview

The local backend uses [Yjs](https://github.com/yjs/yjs) for CRDT-based data synchronization and IndexedDB for local persistence. When running in a webxdc environment, updates are automatically synchronized between peers using [y-webxdc](https://www.npmjs.com/package/y-webxdc).

## Architecture

### Files

- **sync.js**: Manages the Yjs document and synchronization
  - Creates and maintains a Yjs document
  - Handles IndexedDB persistence via y-indexeddb
  - Uses y-webxdc provider for automatic peer-to-peer sync
  - Auto-saves changes every 5 seconds

- **tasks.js**: Local task management
  - CRUD operations for tasks (create, read, update, delete)
  - Task scoring with game mechanics
  - Task reordering and filtering
  - Applies server-side effects locally using common/script/ops

- **user.js**: Local user data management
  - User data storage and retrieval
  - User preferences and stats
  - Default user creation for new installations
  - User operations (changeClass, equip, etc.)

- **webxdc.d.ts**: TypeScript definitions for webxdc API

## How It Works

### Detection
The system automatically detects if it's running in a webxdc environment by checking for `window.webxdc`.

### Data Flow
1. **Normal Web App**: API calls go to the Habitica server via axios
2. **WebXDC Environment**: 
   - All operations use the local backend
   - Data is stored in a Yjs document
   - Changes are persisted to IndexedDB
   - Updates are broadcast to other peers via webxdc

### Store Actions
The store actions in `src/store/actions/` have been updated to route operations based on the environment:

```javascript
if (isWebxdcEnvironment()) {
  // Use localBackend
  await localBackend.someOperation();
} else {
  // Use server API
  await axios.post('/api/v4/...');
}
```

## Key Features

✅ **Offline-first**: Works without an internet connection
✅ **Peer-to-peer**: Synchronizes data between users in the same webxdc chat
✅ **CRDT**: Conflict-free replicated data types ensure consistency
✅ **Game mechanics**: All Habitica game logic (scoring, stats, etc.) works locally
✅ **Seamless integration**: Minimal changes to existing code

## Server-Side Effects

The implementation ensures that all server-side effects are replicated locally:
- Task scoring applies game mechanics (XP, gold, mana, etc.)
- User stats are updated correctly
- Task defaults are applied
- All operations from `common/script/ops` are available

## Limitations

Some features that require server infrastructure are not available in the local backend:
- Social features (parties, guilds, chat with external users)
- Challenges
- Premium features requiring payment
- Authentication with external services
- Push notifications

## Future Enhancements

Potential improvements:
- Add support for more operations
- Implement cron job locally for dailies
- Add conflict resolution UI
- Support for data import/export
- Syncing with server when online (hybrid mode)
