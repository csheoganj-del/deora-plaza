/**
 * Lightweight stub — full notification system optional.
 * Avoids pulling heavy client-only deps into server actions.
 */

type Listener = (...args: any[]) => void;

class IntegratedNotificationSystem {
  private listeners: Map<string, Listener[]> = new Map();

  setupRealtimeListener() {
    // no-op in demo / when realtime unavailable
  }

  async notify(_payload: any) {
    return { success: true };
  }

  on(event: string, fn: Listener) {
    const list = this.listeners.get(event) || [];
    list.push(fn);
    this.listeners.set(event, list);
  }

  off(event: string, fn: Listener) {
    const list = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      list.filter((x) => x !== fn)
    );
  }
}

let instance: IntegratedNotificationSystem | null = null;

export function getIntegratedNotificationSystem() {
  if (!instance) instance = new IntegratedNotificationSystem();
  return instance;
}

export default getIntegratedNotificationSystem;
