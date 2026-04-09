(() => {
  class LocalPlayerEngine {
    constructor(audioEl) {
      this.audio = audioEl;
      this.currentTrack = null;
      this.listeners = new Set();
      this.mode = 'local';
      this.bindEvents();
    }

    bindEvents() {
      if (!this.audio) return;
      this.audio.addEventListener('timeupdate', () => this.emitStatus());
      this.audio.addEventListener('loadedmetadata', () => this.emitStatus());
      this.audio.addEventListener('play', () => this.emitStatus());
      this.audio.addEventListener('pause', () => this.emitStatus());
      this.audio.addEventListener('ended', () => this.emitStatus({ ended: true, state: 'ended' }));
      this.audio.addEventListener('error', () => {
        this.emit('error', {
          message: 'Playback could not be started.',
          code: this.audio?.error?.code ?? null,
        });
      });
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
        state: this.audio?.paused ? 'paused' : 'playing',
        position: this.audio?.currentTime || 0,
        duration: Number.isFinite(this.audio?.duration) ? this.audio.duration : 0,
        volume: this.audio?.volume ?? 1,
        track: this.currentTrack,
        connected: true,
        ...extra,
      });
    }

    async play(track) {
      if (!this.audio) throw new Error('Audio element is missing.');
      this.currentTrack = track;
      this.audio.src = track.audio_url || '';
      this.audio.load();
      await this.audio.play();
      this.emitStatus();
    }

    async pause() {
      this.audio?.pause();
      this.emitStatus();
    }

    async resume() {
      if (!this.audio) return;
      await this.audio.play();
      this.emitStatus();
    }

    async stop() {
      if (!this.audio) return;
      this.audio.pause();
      this.audio.currentTime = 0;
      this.emitStatus({ state: 'stopped' });
    }

    async seek(seconds) {
      if (!this.audio || !Number.isFinite(seconds)) return;
      this.audio.currentTime = Math.max(0, seconds);
      this.emitStatus();
    }

    async setVolume(value) {
      if (!this.audio) return;
      this.audio.volume = Math.max(0, Math.min(1, value));
      this.emitStatus();
    }

    getStatus() {
      return {
        mode: this.mode,
        state: this.audio?.paused ? 'paused' : 'playing',
        position: this.audio?.currentTime || 0,
        duration: Number.isFinite(this.audio?.duration) ? this.audio.duration : 0,
        volume: this.audio?.volume ?? 1,
        track: this.currentTrack,
        connected: true,
      };
    }
  }

  window.TuneDeckLocalPlayer = LocalPlayerEngine;
})();
