
export const STREAM_URL = "https://watch.mistlive.tv/hls/yeeps/playlist.m3u8";
export const HLSJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js";

export const API_BASE = "https://api.bloomnetworks.net";

const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
export const ADMIN_ENABLED = Boolean(API_BASE) || isLocalHost;

export const REDIRECT_HOSTS = ["bloomnetworks.net", "yeeps.bloomnetworks.net", "monarch.bloomnetworks.net"];

export const SITES = {
  ch: { key: "ch", name: "Yeeps Channel", file: "channel.json" },
  ds: { key: "ds", name: "Yeeps Don’t Sleep", file: "dont-sleep.json" },
};

export const ROUTES = {
  "/dmca": "legal",
  "/terms": "legal",
  "/privacy": "legal",
  "/schedule": "schedule",
  "/watch": "watch",
  "/fundings": "fund",
  "/news": "blog",
  "/admin": "admin",
};

export const VIEW_TITLES = {
  schedule: "Schedule",
  watch: "Watch",
  fund: "Fundings",
  blog: "News",
  admin: "Admin",
};

export const MENU_UNDERLINE = {
  home: [3.744, 22.832, 23.305],
  schedule: [3.534, 34.336, 44.89],
  watch: [3.534, 45.044, 25.788],
  fund: [3.534, 55.75, 44.0],
  blog: [3.534, 66.2, 21.0],
  post: [3.534, 66.2, 21.0],
};

export const DESIGN_WIDTH = 1047;
export const SITE_STORAGE_KEY = "ypch-site";
