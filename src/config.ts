export const CONFIG = {
  streamUrl:
    import.meta.env?.VITE_STREAM_URL ||
    "http://10.178.148.76:8080/stream?topic=/vision/image_display",
  snapshotUrl:
    import.meta.env?.VITE_SNAPSHOT_URL ||
    "http://10.178.148.76:8080/snapshot?topic=/vision/image_display",
  overlayUrl: import.meta.env?.VITE_OVERLAY_URL || "/overlay.png",
};
