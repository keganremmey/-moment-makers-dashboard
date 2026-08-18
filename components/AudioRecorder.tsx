"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_RECORDING_SECONDS = 10 * 60;

type UploadState = "idle" | "uploading" | "success" | "error";

function formatTimer(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  token,
  onUploaded,
}: {
  token: string;
  onUploaded?: () => void;
}) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function upload(blob: Blob, durationSeconds: number) {
    setUploadState("uploading");
    try {
      const body = new FormData();
      body.append("token", token);
      body.append("audio", blob, "entry.webm");
      body.append("durationSeconds", String(durationSeconds));

      const res = await fetch("/api/journal/upload", { method: "POST", body });
      if (!res.ok) {
        setUploadState("error");
        return;
      }

      setUploadState("success");
      router.refresh();
      onUploaded?.();
    } catch {
      setUploadState("error");
    }
  }

  function stopRecording() {
    stopTimer();
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  async function startRecording() {
    setPermissionError(null);
    setUploadState("idle");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionError(
        "Microphone access is blocked. Allow microphone access in your browser settings to record a journal entry."
      );
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      void upload(blob, durationSeconds);
    };

    mediaRecorderRef.current = recorder;
    startedAtRef.current = Date.now();
    recorder.start();
    setIsRecording(true);
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }

  return (
    <div className="card p-5">
      <p className="label">Record a journal entry</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={uploadState === "uploading"}
          className={`btn btn-primary${isRecording ? " is-engaged" : ""}`}
        >
          {isRecording ? "Stop" : "Record"}
        </button>
        {isRecording && (
          <span className="font-mono text-sm text-ink-dim">{formatTimer(elapsedSeconds)}</span>
        )}
        {uploadState === "uploading" && (
          <span className="text-sm text-ink-dim">Saving...</span>
        )}
        {uploadState === "success" && (
          <span className="text-sm text-gold">Saved</span>
        )}
        {uploadState === "error" && (
          <span className="text-sm text-red-400">Couldn&apos;t save, try again.</span>
        )}
      </div>
      {permissionError && (
        <p className="mt-2 text-sm text-red-400">{permissionError}</p>
      )}
    </div>
  );
}
