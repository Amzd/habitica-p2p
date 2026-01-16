export function sleep (user, req = {}) {
  user.preferences.sleep = !user.preferences.sleep;

  return [user.preferences.sleep];
}
