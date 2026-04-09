(() => {
  class BroadcastPlayerEngine {
    constructor() {
      this.listeners = new Set();
      this.mode = 'broadcast-prep';
      this.currentTrack = null;
      this.connected = false;
    }

    on(event, callback) {
      const listener = { event, callback };
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    emit(event, payload) {
      this.listeners.forEach((listener) => {
        if (listener.event === event) listener.callback(payload);
      });
    }

    emitStatus(extra = {}) {
      this.emit('status', {
        mode: this.mode,
        state: 'idle',
        position: 0,
        duration: 0,
        volume: 1,
        track: this.currentTrack,
        connected: this.connected,
        ...extra,
      });
    }

    async connect() {
      this.connected = false;
      this.emitStatus();
      return false;
    }

    async play(track) {
      this.currentTrack = track;
      this.emit('warning', {
        message: 'Broadcast output is prepared but not connected yet.',
      });
      this.emitStatus();
    }

    async pause() {}
    async resume() {}
    async stop() {}
    async seek() {}
    async setVolume() {}

    getStatus() {
      return {
        mode: this.mode,
        state: 'idle',
        position: 0,
        duration: 0,
        volume: 1,
        track: this.currentTrack,
        connected: this.connected,
      };
    }
  }

  window.TuneDeckBroadcastPlayer = BroadcastPlayerEngine;
})();
