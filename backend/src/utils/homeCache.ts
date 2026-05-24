interface CachedData {
  data: any;
  timestamp: number;
}

let cachedHomeData: CachedData | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes standard TTL fallback

export const getCachedHomeData = (): any | null => {
  if (cachedHomeData && (Date.now() - cachedHomeData.timestamp < CACHE_TTL)) {
    return cachedHomeData.data;
  }
  return null;
};

export const setCachedHomeData = (data: any) => {
  cachedHomeData = {
    data,
    timestamp: Date.now(),
  };
};

export const invalidateHomeCache = () => {
  cachedHomeData = null;
  console.log("⚡ [Cache] Home page data cache invalidated successfully.");
};
