import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export const useRecordingManager = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordingDropdownOpen, setRecordingDropdownOpen] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const queryClient = useQueryClient();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Recording data available:", event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setIsPaused(false);
        setRecordingDropdownOpen(true);
        setShowRecordingControls(false);
        const timer = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        setRecordingTimer(timer);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setRecordingDropdownOpen(false);
        setShowRecordingControls(false);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        stream.getTracks().forEach((track) => track.stop());

        // Notify backend that recording was saved
        apiRequest("POST", "/api/notifications/trigger-recording-saved", {
          recordingName: `Session ${new Date().toLocaleDateString()}`,
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
          })
          .catch((err) => console.error("Failed to notify recording saved:", err));
      };

      setMediaRecorder(recorder);
      recorder.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access microphone. Please ensure microphone permissions are granted.",
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    recordingTime,
    setRecordingTime,
    mediaRecorder,
    setMediaRecorder,
    recordingDropdownOpen,
    setRecordingDropdownOpen,
    recordingTimer,
    setRecordingTimer,
    showRecordingControls,
    setShowRecordingControls,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    formatRecordingTime,
  };
};
