import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * @returns resolves when all the pending updates have been applied
 */
function initWebxdcSyncProvider (ydoc) {
  const lastAppliedWebxdcUpdateSerialNum = 0;

  const setListenerP = window.webxdc.setUpdateListener(
    update => {
      console.log('Received webxdc update', update.serial);
      // Apply the update to the Yjs document
      Y.applyUpdate(ydoc, new Uint8Array(update.payload.update), 'webxdcUpdateHandler');
    },
    lastAppliedWebxdcUpdateSerialNum || 0,
  );

  // Listen for local changes and broadcast them via webxdc
  ydoc.on('update', (update, origin) => {
    if (origin === 'webxdcUpdateHandler') {
      // Don't send updates that came from webxdc
      return;
    }
    // Convert Uint8Array to regular array for serialization
    const serializableArray = Array.from(update);
    window.webxdc.sendUpdate(
      {
        payload: {
          update: serializableArray,
          sender: window.webxdc.selfAddr,
        },
      },
      'Data sync',
    );
  });

  return setListenerP;
}

async function createSyncedYDoc () {
  const ydoc = new Y.Doc();

  // Initialize IndexedDB persistence
  const indexeddbProvider = new IndexeddbPersistence('habitica-p2p-db', ydoc);
  await indexeddbProvider.whenSynced;

  // Initialize webxdc sync if available
  if (window.webxdc) {
    await initWebxdcSyncProvider(ydoc);
  }

  return ydoc;
}

let _ydoc = null;
export const ensureCreateSyncedYDoc = () => {
  if (!_ydoc) {
    _ydoc = createSyncedYDoc();
  }
  return _ydoc;
};

export const isWebxdcEnvironment = () => typeof window !== 'undefined' && window.webxdc;
