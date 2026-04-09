(() => {
  class TuneDeckPlayerAdapter {
    constructor({ audioEl }) {
      this.local = new window.TuneDeckLocalPlayer(audioEl);
      this.broadcast = new window.TuneDeckBroadcastPlayer();
      this.listeners = new Set();
      this.mode = 'dual-output-prep';

      this.local.on('status', (status) => this.emit('status', status));
      this.local.on('error', (error) => this.emit('error', error));
      this.broadcast.on('status', (status) => this.emit('broadcast-status', status));
      this.broadcast.on('warning', (warning) => this.emit('warning', warning));
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

    async play(track) {
      await this.local.play(track);
      await this.broadcast.play(track);
    }

    async pause() {
      await this.local.pause();
      await this.broadcast.pause();
    }

    async resume() {
      await this.local.resume();
      await this.broadcast.resume();
    }

    async stop() {
      await this.local.stop();
      await this.broadcast.stop();
    }

    async seek(seconds) {
      await this.local.seek(seconds);
      await this.broadcast.seek(seconds);
    }

    async setVolume(value) {
      await this.local.setVolume(value);
      await this.broadcast.setVolume(value);
    }

    getStatus() {
      return this.local.getStatus();
    }

    getDebugState() {
      return {
        adapterMode: this.mode,
        local: this.local.getStatus(),
        broadcast: this.broadcast.getStatus(),
      };
    }
  }

  window.TuneDeckPlayerAdapter = TuneDeckPlayerAdapter;
})();
