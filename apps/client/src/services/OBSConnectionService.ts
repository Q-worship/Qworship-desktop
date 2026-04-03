import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';

export interface OBSStatus {
  connected: boolean;
  recording: boolean;
  streaming: boolean;
  currentScene?: string;
  scenes?: string[];
}

export interface OBSSettings {
  host: string;
  port: number;
  password: string;
  isEnabled: boolean;
  autoConnect: boolean;
  sceneMappings?: Record<string, string>;
}

type StatusCallback = (status: OBSStatus) => void;
type ErrorCallback = (error: Error) => void;

class OBSConnectionService {
  private obs: OBSWebSocket;
  private status: OBSStatus;
  private statusCallbacks: Set<StatusCallback>;
  private errorCallbacks: Set<ErrorCallback>;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private currentSettings?: OBSSettings;

  constructor() {
    this.obs = new OBSWebSocket();
    this.status = {
      connected: false,
      recording: false,
      streaming: false,
      scenes: []
    };
    this.statusCallbacks = new Set();
    this.errorCallbacks = new Set();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Connection events
    this.obs.on('ConnectionOpened', () => {
      console.log('OBS WebSocket connected');
      this.reconnectAttempts = 0;
      this.updateStatus({ connected: true });
      this.refreshStatus();
    });

    this.obs.on('ConnectionClosed', () => {
      console.log('OBS WebSocket disconnected');
      this.updateStatus({ 
        connected: false,
        recording: false,
        streaming: false 
      });
      this.attemptReconnect();
    });

    this.obs.on('ConnectionError', (error) => {
      console.error('OBS WebSocket error:', error);
      this.notifyError(new Error(`Connection error: ${error.message || 'Unknown error'}`));
    });

    // Recording events
    this.obs.on('RecordStateChanged', (data) => {
      this.updateStatus({ recording: data.outputActive });
    });

    // Streaming events
    this.obs.on('StreamStateChanged', (data) => {
      this.updateStatus({ streaming: data.outputActive });
    });

    // Scene events
    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this.updateStatus({ currentScene: data.sceneName });
    });

    // Scene list changed
    this.obs.on('SceneListChanged', () => {
      this.refreshSceneList();
    });
  }

  private attemptReconnect() {
    if (!this.currentSettings?.autoConnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyError(new Error('Maximum reconnection attempts reached'));
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      if (this.currentSettings) {
        this.connect(this.currentSettings).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  async connect(settings: OBSSettings): Promise<void> {
    try {
      this.currentSettings = settings;
      
      if (!settings.isEnabled) {
        throw new Error('OBS integration is not enabled');
      }

      const url = `ws://${settings.host}:${settings.port}`;
      
      await this.obs.connect(url, settings.password, {
        eventSubscriptions: EventSubscription.All
      });

      // Get initial status
      await this.refreshStatus();
    } catch (error: any) {
      console.error('Failed to connect to OBS:', error);
      this.notifyError(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      
      this.reconnectAttempts = 0;
      this.currentSettings = undefined;
      
      await this.obs.disconnect();
      
      this.updateStatus({
        connected: false,
        recording: false,
        streaming: false,
        currentScene: undefined,
        scenes: []
      });
    } catch (error: any) {
      console.error('Error disconnecting from OBS:', error);
      throw error;
    }
  }

  private async refreshStatus(): Promise<void> {
    try {
      // Get recording status
      const recordStatus = await this.obs.call('GetRecordStatus');
      
      // Get streaming status
      const streamStatus = await this.obs.call('GetStreamStatus');
      
      // Get current scene
      const sceneInfo = await this.obs.call('GetCurrentProgramScene');
      
      // Get scene list
      await this.refreshSceneList();

      this.updateStatus({
        recording: recordStatus.outputActive,
        streaming: streamStatus.outputActive,
        currentScene: sceneInfo.currentProgramSceneName
      });
    } catch (error) {
      console.error('Failed to refresh OBS status:', error);
    }
  }

  private async refreshSceneList(): Promise<void> {
    try {
      const sceneList = await this.obs.call('GetSceneList');
      this.updateStatus({
        scenes: sceneList.scenes.map((scene: any) => scene.sceneName)
      });
    } catch (error) {
      console.error('Failed to get scene list:', error);
    }
  }

  async startRecording(): Promise<void> {
    try {
      await this.obs.call('StartRecord');
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    try {
      await this.obs.call('StopRecord');
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async startStreaming(): Promise<void> {
    try {
      await this.obs.call('StartStream');
    } catch (error: any) {
      console.error('Failed to start streaming:', error);
      throw error;
    }
  }

  async stopStreaming(): Promise<void> {
    try {
      await this.obs.call('StopStream');
    } catch (error: any) {
      console.error('Failed to stop streaming:', error);
      throw error;
    }
  }

  async setScene(sceneName: string): Promise<void> {
    try {
      await this.obs.call('SetCurrentProgramScene', {
        sceneName
      });
    } catch (error: any) {
      console.error('Failed to set scene:', error);
      throw error;
    }
  }

  async getScenes(): Promise<string[]> {
    try {
      const sceneList = await this.obs.call('GetSceneList');
      return sceneList.scenes.map((scene: any) => scene.sceneName);
    } catch (error: any) {
      console.error('Failed to get scenes:', error);
      return [];
    }
  }

  async sendCustomEvent(eventName: string, eventData: any): Promise<void> {
    try {
      await this.obs.call('CallVendorRequest', {
        vendorName: 'obs-browser',
        requestType: 'emit_event',
        requestData: {
          event_name: eventName,
          event_data: eventData
        }
      });
    } catch (error: any) {
      console.error('Failed to send custom event:', error);
      throw error;
    }
  }

  async sendSlideUpdate(slideData: {
    type: 'song' | 'bible' | 'announcement' | 'custom';
    title?: string;
    sectionTitle?: string;
    content: string;
    reference?: string;
    version?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  }): Promise<void> {
    try {
      await this.sendCustomEvent('qworship-slide-change', slideData);
      console.log('Sent slide update to OBS presentation view:', slideData);
    } catch (error: any) {
      console.error('Failed to send slide update:', error);
      throw error;
    }
  }

  async clearSlide(): Promise<void> {
    try {
      await this.sendCustomEvent('qworship-clear-slide', {});
      console.log('Cleared slide in OBS presentation view');
    } catch (error: any) {
      console.error('Failed to clear slide:', error);
      throw error;
    }
  }

  async updatePresentationStyle(styleData: {
    textColor?: string;
    fontFamily?: string;
    fontSize?: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  }): Promise<void> {
    try {
      await this.sendCustomEvent('qworship-style-update', styleData);
      console.log('Updated presentation style in OBS:', styleData);
    } catch (error: any) {
      console.error('Failed to update presentation style:', error);
      throw error;
    }
  }

  private updateStatus(updates: Partial<OBSStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Immediately call with current status
    callback(this.status);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  getStatus(): OBSStatus {
    return { ...this.status };
  }

  isConnected(): boolean {
    return this.status.connected;
  }
}

// Export singleton instance
export const obsService = new OBSConnectionService();
