/**
 * Creator data: the static fallback array AND the API-backed hooks.
 *
 * Pre-PR #7 this file just exported the static array. PR #7 adds a real
 * `/api/creators` backend (see server/routes/creators.routes.ts), so:
 *
 *   - `creatorsData` (export) - the static fallback. Still exported as-is
 *     so any code that imports it directly keeps working.
 *   - `useCreators()` (hook)  - fetches `/api/creators`. On 4xx/5xx OR while
 *     the request is in flight, returns the static array so the UI never
 *     looks empty.
 *   - `useCreator(id)` (hook) - fetches `/api/creators/:id` with the same
 *     fallback semantics.
 *
 * The fallback design is deliberate: the demo deploys to a free Render
 * tier, where the first request after 15 min idle takes ~30s to wake the
 * container. During that 30s the API returns a connection error - but the
 * static array gives the home page something to render anyway, so the
 * UX doesn't feel broken.
 */

import { useQuery } from "@tanstack/react-query";

export interface Creator {
  id: string;
  name: string;
  price: number;
  country: string;
  followers: number;
  languages: string[];
  isOnline: boolean;
  randomMatchEnabled: boolean;
  allowedCallTypes: "audio" | "video" | "both";
  aboutMe?: string;
  talksAbout?: string[];
  hobbies?: string[];
  foodPreferences?: string[];
  sportsInterests?: string[];
  photoUrl?: string;
}

// Static fallback. Mirrors the seeded creators in MemStorage and
// scripts/seed.ts (creator IDs 1..9 with the same names, prices, etc).
export const creatorsData: Creator[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    price: 45,
    country: "India",
    followers: 1250,
    languages: ["English", "Hindi", "Tamil"],
    isOnline: true,
    randomMatchEnabled: true,
    allowedCallTypes: "both",
    aboutMe: "Friendly conversationalist who loves discussing life experiences and offering advice on personal growth.",
    talksAbout: ["Life coaching", "Relationships", "Career guidance", "Mental wellness"],
    hobbies: ["Reading", "Yoga", "Traveling", "Cooking"],
    foodPreferences: ["Vegetarian", "Italian cuisine", "Indian sweets"],
    sportsInterests: ["Cricket", "Badminton", "Running"],
  },
  {
    id: "2",
    name: "Rahul Verma",
    price: 38,
    country: "India",
    followers: 890,
    languages: ["Hindi", "English"],
    isOnline: false,
    randomMatchEnabled: false,
    allowedCallTypes: "video",
    aboutMe: "Tech enthusiast and startup mentor with 10 years of experience in software development.",
    talksAbout: ["Technology", "Startups", "Programming", "Career advice"],
    hobbies: ["Gaming", "Photography", "Blogging"],
    foodPreferences: ["Non-vegetarian", "North Indian", "Chinese"],
    sportsInterests: ["Football", "Chess", "Table tennis"],
  },
  {
    id: "3",
    name: "Priya Sharma",
    price: 52,
    country: "India",
    followers: 2100,
    languages: ["English", "Hindi", "Marathi"],
    isOnline: true,
    randomMatchEnabled: true,
    allowedCallTypes: "both",
    aboutMe: "Business consultant and motivational speaker passionate about empowering entrepreneurs.",
    talksAbout: ["Business strategy", "Entrepreneurship", "Marketing", "Leadership"],
    hobbies: ["Public speaking", "Writing", "Gardening"],
    foodPreferences: ["Vegetarian", "South Indian", "Continental"],
    sportsInterests: ["Tennis", "Swimming", "Cycling"],
  },
  {
    id: "4",
    name: "Amit Patel",
    price: 40,
    country: "India",
    followers: 1500,
    languages: ["Gujarati", "Hindi", "English"],
    isOnline: true,
    randomMatchEnabled: false,
    allowedCallTypes: "audio",
    aboutMe: "Finance expert helping people make smart investment decisions and achieve financial freedom.",
    talksAbout: ["Investment", "Stock market", "Personal finance", "Real estate"],
    hobbies: ["Reading", "Playing guitar", "Hiking"],
    foodPreferences: ["Vegetarian", "Gujarati cuisine", "Street food"],
    sportsInterests: ["Cricket", "Volleyball", "Jogging"],
  },
  {
    id: "5",
    name: "Neha Kapoor",
    price: 48,
    country: "India",
    followers: 1780,
    languages: ["English", "Hindi", "Punjabi"],
    isOnline: true,
    randomMatchEnabled: true,
    allowedCallTypes: "both",
    aboutMe: "Fashion designer and lifestyle blogger who loves sharing creative ideas and style tips.",
    talksAbout: ["Fashion", "Lifestyle", "Beauty", "Social media"],
    hobbies: ["Sketching", "Shopping", "Dancing", "Photography"],
    foodPreferences: ["Vegetarian", "Punjabi cuisine", "Fusion food"],
    sportsInterests: ["Zumba", "Yoga", "Badminton"],
  },
  {
    id: "6",
    name: "Vikram Singh",
    price: 35,
    country: "India",
    followers: 750,
    languages: ["Hindi", "English"],
    isOnline: false,
    randomMatchEnabled: false,
    allowedCallTypes: "video",
    aboutMe: "Fitness trainer and nutrition coach dedicated to helping people achieve their health goals.",
    talksAbout: ["Fitness", "Nutrition", "Weight loss", "Muscle building"],
    hobbies: ["Gym training", "Sports", "Cooking healthy meals"],
    foodPreferences: ["High protein", "Salads", "Smoothies"],
    sportsInterests: ["Bodybuilding", "Boxing", "Running", "Basketball"],
  },
  {
    id: "7",
    name: "Anjali Mehta",
    price: 42,
    country: "India",
    followers: 1320,
    languages: ["English", "Hindi", "Bengali"],
    isOnline: true,
    randomMatchEnabled: true,
    allowedCallTypes: "audio",
    aboutMe: "Psychologist and counselor specializing in stress management and emotional well-being.",
    talksAbout: ["Mental health", "Stress management", "Relationships", "Self-care"],
    hobbies: ["Meditation", "Reading", "Painting", "Listening to music"],
    foodPreferences: ["Vegetarian", "Bengali cuisine", "Organic food"],
    sportsInterests: ["Walking", "Swimming", "Yoga"],
  },
  {
    id: "8",
    name: "Karan Malhotra",
    price: 50,
    country: "India",
    followers: 1950,
    languages: ["Hindi", "English", "Urdu"],
    isOnline: true,
    randomMatchEnabled: false,
    allowedCallTypes: "both",
    aboutMe: "Digital marketing expert helping brands grow their online presence and reach their audience.",
    talksAbout: ["Digital marketing", "SEO", "Content creation", "Brand building"],
    hobbies: ["Traveling", "Photography", "Blogging", "Music"],
    foodPreferences: ["Non-vegetarian", "Mughlai", "Italian"],
    sportsInterests: ["Cricket", "Football", "Snooker"],
  },
  {
    id: "9",
    name: "Kavya Iyer",
    price: 46,
    country: "India",
    followers: 1650,
    languages: ["English", "Tamil", "Hindi"],
    isOnline: false,
    randomMatchEnabled: false,
    allowedCallTypes: "video",
    aboutMe: "Classical dancer and arts enthusiast sharing insights on Indian culture and performing arts.",
    talksAbout: ["Dance", "Indian culture", "Arts", "Music", "Traditions"],
    hobbies: ["Dancing", "Teaching", "Traveling", "Cooking"],
    foodPreferences: ["Vegetarian", "South Indian", "Traditional sweets"],
    sportsInterests: ["Badminton", "Swimming", "Yoga"],
  },
];

/**
 * Fetch the creator catalog from the API. Falls back to the static array
 * on any failure - including the initial loading window before the first
 * fetch resolves - so the UI never renders an empty/blank state.
 */
export function useCreators(): { data: Creator[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
    queryFn: async () => {
      const res = await fetch("/api/creators");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    // 5-min stale time - the catalog rarely changes during a session.
    staleTime: 5 * 60 * 1000,
    // Don't retry forever in the background; one retry is enough to
    // shake out a transient cold-start blip on the free Render tier.
    retry: 1,
  });

  return {
    // If the request errored OR is still in flight with no cached data,
    // fall through to the static array. Otherwise prefer the live data.
    data: data && data.length > 0 ? data : creatorsData,
    isLoading,
    isError,
  };
}

/**
 * Fetch a single creator by id. Falls back to the static lookup on
 * failure - same UX rationale as `useCreators`.
 */
export function useCreator(id: string | undefined): { data: Creator | undefined; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useQuery<Creator>({
    queryKey: ["/api/creators", id],
    queryFn: async () => {
      const res = await fetch(`/api/creators/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    data: data ?? creatorsData.find((c) => c.id === id),
    isLoading,
    isError,
  };
}
