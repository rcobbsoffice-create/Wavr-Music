export interface Beat {
  id: string;
  title: string;
  producer: string;
  producerId: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  tags: string[];
  priceBasic: number;
  pricePremium: number;
  priceExclusive: number;
  plays: number;
  featured: boolean;
  status: string;
  artwork?: string | null;
  audioFile?: string | null;
}

export interface MerchItem {
  id: string;
  name: string;
  artist: string;
  category: string;
  price: number;
  color: string;
  sizes?: string[];
}

export interface DayData {
  date: string;
  streams: number;
  revenue: number;
}

export interface TrackMetric {
  id: string;
  title: string;
  streams: number;
  revenue: number;
  skipRate: number;
  saveRate: number;
  platform: string;
}

export const beats: Beat[] = [
  { id: "b1", title: "Midnight Drip", producer: "DJ Phantom", producerId: "", genre: "Trap", bpm: 140, key: "C# Min", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 14823, tags: ["dark", "heavy", "melodic"], mood: "Dark", featured: true, status: "active" },
  { id: "b2", title: "Summer Haze", producer: "WaveGod", producerId: "", genre: "R&B", bpm: 88, key: "F Maj", priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 349.99, plays: 9214, tags: ["smooth", "chill", "vibes"], mood: "Chill", featured: true, status: "active" },
  { id: "b3", title: "Lagos Nights", producer: "Afro King", producerId: "", genre: "Afrobeats", bpm: 102, key: "A Maj", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 22100, tags: ["afro", "dance", "vibrant"], mood: "Energetic", featured: true, status: "active" },
  { id: "b4", title: "Brooklyn Drill", producer: "ColdBeat", producerId: "", genre: "Drill", bpm: 144, key: "G Min", priceBasic: 49.99, pricePremium: 149.99, priceExclusive: 499.99, plays: 31450, tags: ["drill", "street", "hard"], mood: "Aggressive", featured: true, status: "active" },
  { id: "b5", title: "Neon Dreams", producer: "SynthMaster", producerId: "", genre: "Pop", bpm: 128, key: "D Maj", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 7823, tags: ["pop", "bright", "catchy"], mood: "Happy", featured: false, status: "active" },
  { id: "b6", title: "Hustler's Anthem", producer: "BeatKing", producerId: "", genre: "Hip-Hop", bpm: 96, key: "E Min", priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 399.99, plays: 18600, tags: ["boom bap", "classic", "gritty"], mood: "Motivated", featured: false, status: "active" },
  { id: "b7", title: "Crimson Clouds", producer: "MysticProd", producerId: "", genre: "R&B", bpm: 72, key: "B♭ Min", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 5340, tags: ["emotional", "soul", "deep"], mood: "Melancholic", featured: false, status: "active" },
  { id: "b8", title: "Flex Season", producer: "TrapGod", producerId: "", genre: "Trap", bpm: 138, key: "F# Min", priceBasic: 49.99, pricePremium: 149.99, priceExclusive: 499.99, plays: 25900, tags: ["flex", "808s", "hard hitting"], mood: "Aggressive", featured: false, status: "active" },
  { id: "b9", title: "Ivory Coast Rhythm", producer: "Afro King", producerId: "", genre: "Afrobeats", bpm: 106, key: "G Maj", priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 399.99, plays: 12480, tags: ["afro", "tropical", "vibrant"], mood: "Energetic", featured: false, status: "active" },
  { id: "b10", title: "City Lights", producer: "UrbanCraft", producerId: "", genre: "Hip-Hop", bpm: 90, key: "C Maj", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 8900, tags: ["melodic", "urban", "smooth"], mood: "Chill", featured: false, status: "active" },
  { id: "b11", title: "Glacier", producer: "FrostBeats", producerId: "", genre: "Pop", bpm: 118, key: "A Min", priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 6720, tags: ["cold", "ethereal", "cinematic"], mood: "Dark", featured: false, status: "active" },
  { id: "b12", title: "Fire & Smoke", producer: "DJ Phantom", producerId: "", genre: "Drill", bpm: 142, key: "D Min", priceBasic: 59.99, pricePremium: 179.99, priceExclusive: 599.99, plays: 41200, tags: ["fire", "drill", "aggressive"], mood: "Aggressive", featured: true, status: "active" },
];

export const merchItems: MerchItem[] = [
  {
    id: "m1",
    name: "WAVR Classic Tee",
    artist: "WAVR Official",
    category: "T-Shirts",
    price: 34.99,
    color: "from-purple-900 to-violet-800",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    id: "m2",
    name: "Midnight Drip Hoodie",
    artist: "DJ Phantom",
    category: "Hoodies",
    price: 69.99,
    color: "from-gray-800 to-gray-900",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "m3",
    name: "Lagos Nights Cap",
    artist: "Afro King",
    category: "Hats",
    price: 29.99,
    color: "from-orange-700 to-red-800",
    sizes: ["One Size"],
  },
  {
    id: "m4",
    name: "WaveGod Phone Case",
    artist: "WaveGod",
    category: "Phone Cases",
    price: 24.99,
    color: "from-blue-700 to-cyan-600",
  },
  {
    id: "m5",
    name: "Trap Season Zip-Up",
    artist: "TrapGod",
    category: "Hoodies",
    price: 79.99,
    color: "from-yellow-700 to-orange-700",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "m6",
    name: "BeatKing Vintage Tee",
    artist: "BeatKing",
    category: "T-Shirts",
    price: 39.99,
    color: "from-green-800 to-teal-700",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "m7",
    name: "Frostbeats Snapback",
    artist: "FrostBeats",
    category: "Hats",
    price: 32.99,
    color: "from-sky-700 to-blue-800",
    sizes: ["One Size"],
  },
  {
    id: "m8",
    name: "WAVR Oversized Hoodie",
    artist: "WAVR Official",
    category: "Hoodies",
    price: 74.99,
    color: "from-fuchsia-800 to-purple-900",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
];

export const analyticsData: DayData[] = [
  { date: "Mar 1", streams: 4200, revenue: 312 },
  { date: "Mar 2", streams: 3800, revenue: 280 },
  { date: "Mar 3", streams: 5100, revenue: 390 },
  { date: "Mar 4", streams: 6200, revenue: 470 },
  { date: "Mar 5", streams: 5800, revenue: 420 },
  { date: "Mar 6", streams: 7200, revenue: 560 },
  { date: "Mar 7", streams: 8100, revenue: 650 },
  { date: "Mar 8", streams: 7400, revenue: 590 },
  { date: "Mar 9", streams: 6900, revenue: 510 },
  { date: "Mar 10", streams: 8500, revenue: 680 },
  { date: "Mar 11", streams: 9200, revenue: 740 },
  { date: "Mar 12", streams: 10100, revenue: 820 },
  { date: "Mar 13", streams: 9800, revenue: 790 },
  { date: "Mar 14", streams: 11200, revenue: 910 },
  { date: "Mar 15", streams: 12400, revenue: 980 },
  { date: "Mar 16", streams: 11800, revenue: 950 },
  { date: "Mar 17", streams: 10500, revenue: 840 },
  { date: "Mar 18", streams: 13200, revenue: 1060 },
  { date: "Mar 19", streams: 14100, revenue: 1140 },
  { date: "Mar 20", streams: 13600, revenue: 1090 },
  { date: "Mar 21", streams: 15200, revenue: 1230 },
  { date: "Mar 22", streams: 16800, revenue: 1380 },
  { date: "Mar 23", streams: 15900, revenue: 1290 },
  { date: "Mar 24", streams: 17400, revenue: 1420 },
  { date: "Mar 25", streams: 18200, revenue: 1490 },
  { date: "Mar 26", streams: 17100, revenue: 1380 },
  { date: "Mar 27", streams: 19400, revenue: 1580 },
  { date: "Mar 28", streams: 21000, revenue: 1720 },
  { date: "Mar 29", streams: 20200, revenue: 1650 },
  { date: "Mar 30", streams: 22800, revenue: 1870 },
];

export const topTracks: TrackMetric[] = [
  {
    id: "t1",
    title: "Fire & Smoke",
    streams: 41200,
    revenue: 1842.50,
    skipRate: 12,
    saveRate: 34,
    platform: "Exclusive",
  },
  {
    id: "t2",
    title: "Brooklyn Drill",
    streams: 31450,
    revenue: 1124.80,
    skipRate: 18,
    saveRate: 28,
    platform: "Premium",
  },
  {
    id: "t3",
    title: "Lagos Nights",
    streams: 22100,
    revenue: 890.20,
    skipRate: 9,
    saveRate: 42,
    platform: "Basic",
  },
  {
    id: "t4",
    title: "Flex Season",
    streams: 25900,
    revenue: 976.40,
    skipRate: 21,
    saveRate: 22,
    platform: "Premium",
  },
  {
    id: "t5",
    title: "Hustler's Anthem",
    streams: 18600,
    revenue: 712.30,
    skipRate: 15,
    saveRate: 31,
    platform: "Basic",
  },
];
