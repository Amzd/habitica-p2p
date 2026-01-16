import { ensureCreateSyncedYDoc } from './sync';
import { v4 as uuid } from 'uuid';

/**
 * Get user data from local storage
 */
export async function getUser() {
  const ydoc = await ensureCreateSyncedYDoc();
  const userMap = ydoc.getMap('user');
  
  // If user doesn't exist, create default user
  if (userMap.size === 0) {
    const defaultUser = createDefaultUser();
    Object.keys(defaultUser).forEach(key => {
      userMap.set(key, defaultUser[key]);
    });
    return defaultUser;
  }
  
  // Convert Yjs Map to plain object
  const user = {};
  userMap.forEach((value, key) => {
    user[key] = value;
  });
  
  return user;
}

/**
 * Update user data
 */
export async function updateUser(updates) {
  const ydoc = await ensureCreateSyncedYDoc();
  const userMap = ydoc.getMap('user');
  
  Object.keys(updates).forEach(key => {
    // Handle nested updates (e.g., 'preferences.language')
    if (key.includes('.')) {
      const keys = key.split('.');
      const currentValue = userMap.get(keys[0]) || {};
      let nested = currentValue;
      
      for (let i = 1; i < keys.length - 1; i++) {
        nested[keys[i]] = nested[keys[i]] || {};
        nested = nested[keys[i]];
      }
      
      nested[keys[keys.length - 1]] = updates[key];
      userMap.set(keys[0], currentValue);
    } else {
      userMap.set(key, updates[key]);
    }
  });
  
  return getUser();
}

/**
 * Create a default user object
 */
function createDefaultUser() {
  const userId = uuid();
  
  return {
    _id: userId,
    stats: {
      hp: 50,
      mp: 10,
      exp: 0,
      gp: 0,
      lvl: 1,
      class: 'warrior',
      points: 0,
      str: 0,
      con: 0,
      int: 0,
      per: 0,
      toNextLevel: 150,
      maxHealth: 50,
      maxMP: 10,
    },
    items: {
      gear: {
        equipped: {},
        costume: {},
      },
      currentMount: '',
      currentPet: '',
      pets: {},
      mounts: {},
      food: {},
      hatchingPotions: {},
      eggs: {},
      quests: {},
      special: {},
    },
    preferences: {
      hair: {
        color: 'blond',
        base: 0,
        bangs: 0,
        beard: 0,
        mustache: 0,
        flower: 0,
      },
      skin: 'ddc994',
      shirt: 'blue',
      chair: 'none',
      size: 'broad',
      background: '',
      costume: false,
      sleep: false,
      dayStart: 0,
      language: 'en',
      newTaskEdit: false,
      timezoneOffset: new Date().getTimezoneOffset(),
    },
    profile: {
      name: window.webxdc ? window.webxdc.selfName : 'Player',
    },
    tasksOrder: {
      habits: [],
      dailys: [],
      todos: [],
      rewards: [],
    },
    tags: [],
    achievements: {},
    backer: {},
    contributor: {},
    flags: {},
    history: {
      exp: [],
      todos: [],
    },
    lastCron: new Date(),
    needsCron: false,
    _tmp: {},
  };
}

/**
 * Apply server-side operations locally (replicate server effects)
 */
export async function applyUserOperation(operation, params) {
  const user = await getUser();
  
  // Import the operation from common script
  const ops = require('@/../../common/script/ops');
  
  if (ops[operation]) {
    const result = ops[operation](user, params);
    
    // Update the user in local storage
    await updateUser(user);
    
    return result;
  }
  
  throw new Error(`Unknown operation: ${operation}`);
}
