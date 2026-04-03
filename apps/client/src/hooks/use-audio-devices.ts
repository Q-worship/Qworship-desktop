import { useState, useEffect, useCallback, useRef } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

const AUDIO_DEVICE_STORAGE_KEY = 'qworship-audio-device';

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const permissionGrantedRef = useRef(false);

  const loadSavedDevice = useCallback(() => {
    try {
      const saved = localStorage.getItem(AUDIO_DEVICE_STORAGE_KEY);
      if (saved) {
        setSelectedDeviceId(saved);
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load saved audio device:', e);
    }
    return null;
  }, []);

  const saveDevice = useCallback((deviceId: string) => {
    try {
      localStorage.setItem(AUDIO_DEVICE_STORAGE_KEY, deviceId);
      setSelectedDeviceId(deviceId);
    } catch (e) {
      console.warn('Failed to save audio device:', e);
    }
  }, []);

  const clearDevice = useCallback(() => {
    try {
      localStorage.removeItem(AUDIO_DEVICE_STORAGE_KEY);
      setSelectedDeviceId(null);
    } catch (e) {
      console.warn('Failed to clear audio device:', e);
    }
  }, []);

  const enumerateDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Audio device enumeration not supported');
      }

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const rawAudioInputs = deviceList.filter(device => device.kind === 'audioinput');

      const hasLabels = rawAudioInputs.some(d => d.label && d.label !== '');

      if (hasLabels) {
        permissionGrantedRef.current = true;
      }

      if (hasLabels || permissionGrantedRef.current) {
        const audioInputs = rawAudioInputs.map((device, index) => ({
          deviceId: device.deviceId || `device-${index}`,
          label: device.label || `Microphone ${index + 1}`,
          isDefault: device.deviceId === 'default' || index === 0
        }));

        setHasPermission(true);
        setDevices(audioInputs);

        const savedId = loadSavedDevice();
        if (savedId) {
          const stillExists = audioInputs.some(d => d.deviceId === savedId);
          if (!stillExists && audioInputs.length > 0) {
            clearDevice();
          }
        }
      } else {
        setHasPermission(false);
        setDevices([]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to enumerate devices';
      setError(message);
      console.error('Error enumerating audio devices:', e);
    } finally {
      setIsLoading(false);
    }
  }, [loadSavedDevice, clearDevice]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      permissionGrantedRef.current = true;
      setHasPermission(true);
      await enumerateDevices();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Permission denied';
      setError(message);
      setHasPermission(false);
      return false;
    }
  }, [enumerateDevices]);

  const selectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (device) {
      saveDevice(deviceId);
    }
  }, [devices, saveDevice]);

  const getSelectedDevice = useCallback((): AudioDevice | null => {
    if (selectedDeviceId) {
      const device = devices.find(d => d.deviceId === selectedDeviceId);
      if (device) return device;
    }
    const defaultDevice = devices.find(d => d.isDefault);
    return defaultDevice || devices[0] || null;
  }, [devices, selectedDeviceId]);

  const refreshDevices = useCallback(async () => {
    await enumerateDevices();
  }, [enumerateDevices]);

  useEffect(() => {
    const checkPermissionAndEnumerate = async () => {
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (status.state === 'granted') {
            permissionGrantedRef.current = true;
          }
        }
      } catch {
      }
      await enumerateDevices();
    };

    checkPermissionAndEnumerate();

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    devices,
    selectedDeviceId,
    hasPermission,
    isLoading,
    error,
    selectDevice,
    getSelectedDevice,
    requestPermission,
    refreshDevices,
    clearDevice
  };
}
