export class WebAudioEnhancer {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  constructor(private stream: MediaStream) {}

  init() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.setValueAtTime(85, this.audioContext.currentTime);

    this.lowpassNode = this.audioContext.createBiquadFilter();
    this.lowpassNode.type = 'lowpass';
    this.lowpassNode.frequency.setValueAtTime(8000, this.audioContext.currentTime);

    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-22, this.audioContext.currentTime);
    this.compressorNode.knee.setValueAtTime(25, this.audioContext.currentTime);
    this.compressorNode.ratio.setValueAtTime(3.5, this.audioContext.currentTime);
    this.compressorNode.attack.setValueAtTime(0.005, this.audioContext.currentTime);
    this.compressorNode.release.setValueAtTime(0.20, this.audioContext.currentTime);

    this.sourceNode.connect(this.filterNode);
    this.filterNode.connect(this.lowpassNode);
    this.lowpassNode.connect(this.compressorNode);

    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.compressorNode.connect(this.destinationNode);
  }

  getEnhancedStream(): MediaStream {
    if (!this.destinationNode) {
      this.init();
    }
    return this.destinationNode ? this.destinationNode.stream : this.stream;
  }

  close() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}