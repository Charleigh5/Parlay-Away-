class AudioService {
  private audio: HTMLAudioElement;
  private isPlaying: boolean = false;

  constructor() {
    this.audio = new Audio('src/assets/sounds/stadium-ambience.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.3;
  }

  play() {
    if (!this.isPlaying) {
      this.audio.play().catch(error => console.error("Audio play failed:", error));
      this.isPlaying = true;
    }
  }

  pause() {
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

// Export a singleton instance
const audioService = new AudioService();
export default audioService;