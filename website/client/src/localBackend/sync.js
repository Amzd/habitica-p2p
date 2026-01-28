import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import WebxdcProvider from 'y-webxdc';

async function createSyncedYDoc () {
  const ydoc = new Y.Doc();

  // Initialize IndexedDB persistence
  const indexeddbProvider = new IndexeddbPersistence('habitica-p2p-db', ydoc);
  await indexeddbProvider.whenSynced;

  // Initialize webxdc sync if available
  if (window.webxdc) {
    // eslint-disable-next-line no-new
    new WebxdcProvider({
      webxdc: window.webxdc,
      ydoc,
      getEditInfo: () => ({
        document: 'Habitica Data',
        summary: 'Data updated',
        startinfo: 'Started editing Habitica data',
      }),
      autosaveInterval: 5000, // Auto-save every 5 seconds
      resendAllUpdates: false,
    });
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
