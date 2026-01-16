# Habitica P2P WebXDC - Implementation Summary

## Overview

This implementation converts Habitica into a peer-to-peer application that can run in webxdc environments. Users can track their habits, dailies, todos, and rewards collaboratively without needing a central server.

## What Was Changed

### New Dependencies
- **yjs**: CRDT library for conflict-free data synchronization
- **y-indexeddb**: IndexedDB persistence provider for Yjs
- **y-webxdc**: Official Yjs bindings for webxdc apps
- **js-base64**: Base64 encoding/decoding for y-webxdc

### New Files Created
```
website/client/src/localBackend/
├── sync.js           # Yjs document and webxdc sync management using y-webxdc
├── tasks.js          # Local task operations (CRUD + game mechanics)
├── user.js           # Local user data management
├── webxdc.d.ts       # TypeScript definitions for webxdc API
└── README.md         # Detailed documentation
```

### Modified Files
- `website/client/src/store/actions/tasks.js` - Routes task operations to localBackend in webxdc
- `website/client/src/store/actions/user.js` - Routes user operations to localBackend in webxdc
- `website/client/package.json` - Added yjs and y-webxdc dependencies

## How It Works

### Environment Detection
The system automatically detects if it's running in a webxdc environment by checking for `window.webxdc`.

### Data Flow

**Normal Web App:**
```
User Action → Store Action → Axios API Call → Server → Response → State Update
```

**WebXDC Environment:**
```
User Action → Store Action → LocalBackend → Yjs Document → IndexedDB
                                                ↓
                                         webxdc.sendUpdate()
                                                ↓
                                    Other Peers Receive Update
```

### Synchronization
1. All data is stored in a Yjs document (CRDT)
2. Changes are persisted to IndexedDB immediately
3. y-webxdc provider automatically batches and sends updates every 5 seconds
4. Updates are broadcast to peers via webxdc API
5. Peers receive updates and apply them to their local Yjs document
6. Conflicts are automatically resolved by CRDT properties

## Features Supported

### ✅ Fully Supported
- Task management (create, update, delete, reorder)
- Task scoring with full game mechanics (XP, gold, mana)
- User stats and progression
- User preferences
- Task types: habits, dailies, todos, rewards
- Task checklists
- Tags
- Offline functionality
- Multi-user synchronization

### ❌ Not Supported (Require Server Infrastructure)
- Social features (parties, guilds, external chat)
- Challenges
- Premium/subscription features
- Authentication with external providers
- Push notifications
- Server-based webhooks

## How to Test

### In a Regular Browser
The app will continue to work normally, using the server API. No changes to the user experience.

### In WebXDC Environment
1. Package the Habitica client as a webxdc app
2. Share it in a Delta Chat conversation
3. Each user will have their own local data
4. All changes are automatically synchronized between users in the chat

### Testing Locally (Simulated WebXDC)
You can simulate a webxdc environment for testing:

```javascript
// Add to index.html or main.js before app initialization
window.webxdc = {
  selfAddr: 'test@example.com',
  selfName: 'Test User',
  sendUpdate: (update, description) => {
    console.log('WebXDC Update:', update, description);
    // In real webxdc, this would broadcast to peers
  },
  setUpdateListener: (callback, serial) => {
    console.log('WebXDC Listener Set, serial:', serial);
    // In real webxdc, this would receive updates from peers
    return Promise.resolve();
  }
};
```

## Technical Details

### Yjs Document Structure
```javascript
ydoc.getArray('tasks')   // Array of task objects
ydoc.getMap('user')      // User data as key-value pairs
```

### CRDT Properties
- **Convergence**: All peers eventually reach the same state
- **Commutativity**: Operation order doesn't matter
- **Idempotency**: Applying the same update multiple times is safe

### Serial Number Tracking
The last processed webxdc update serial is stored in localStorage as `habitica-webxdc-last-serial` to avoid reprocessing updates on app restart.

## Future Enhancements

Possible improvements for future iterations:
1. **Cron Job Support**: Implement local cron for daily resets
2. **Data Import/Export**: Allow users to backup and restore data
3. **Conflict Resolution UI**: Show when conflicts are resolved
4. **Hybrid Mode**: Sync with server when online, work offline when not
5. **More Operations**: Support additional game features locally
6. **Optimistic Updates**: Improve perceived performance
7. **WebRTC Fallback**: Direct peer-to-peer sync outside webxdc

## Resources

- [Yjs Documentation](https://docs.yjs.dev/)
- [WebXDC Specification](https://webxdc.org/)
- [Vikunja Frontend Reference](https://github.com/WofWca/vikunja-frontend/tree/webxdc-prototype)
- [Habitica API Documentation](https://habitica.com/apidoc/)

## Development Notes

### Code Style
- All localBackend files use ES6 modules
- Async/await pattern for all async operations
- Error handling for missing data
- Deep copying for nested object updates

### Best Practices Followed
- No await in loops (use Promise.all)
- Consistent use of helper functions (isWebxdcEnvironment)
- Proper Yjs array operations
- CRDT-safe mutations
- Serial number tracking to prevent duplicate processing

## Support

For issues or questions:
1. Check the localBackend/README.md for detailed information
2. Review the code comments in sync.js, tasks.js, and user.js
3. Refer to the Yjs and webxdc documentation
4. Open an issue on the repository
