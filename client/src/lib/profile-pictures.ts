export const USER_PROFILE_PICTURE_KEY = "linky_user_profile_picture";
export const CREATOR_PROFILE_PICTURE_KEY = "linky_creator_profile_picture";

export const PROFILE_AVATARS = [
  { id: "nova", label: "Nova", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Nova&backgroundColor=b6e3f4" },
  { id: "maya", label: "Maya", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Maya&backgroundColor=ffd5dc" },
  { id: "zara", label: "Zara", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Zara&backgroundColor=c0aede" },
  { id: "veer", label: "Veer", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Veer&backgroundColor=d1d4f9" },
  { id: "kiara", label: "Kiara", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Kiara&backgroundColor=ffdfbf" },
  { id: "arjun", label: "Arjun", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Arjun&backgroundColor=c5f3d8" },
  { id: "tara", label: "Tara", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Tara&backgroundColor=fde68a" },
  { id: "kabir", label: "Kabir", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Kabir&backgroundColor=fbcfe8" },
];

export function creatorAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getStoredProfilePicture(key: string, fallback = PROFILE_AVATARS[0].url) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return localStorage.getItem(key) || fallback;
}

export function saveStoredProfilePicture(key: string, imageUrl: string) {
  localStorage.setItem(key, imageUrl);
  window.dispatchEvent(new CustomEvent("linky-profile-picture-updated", { detail: { key, imageUrl } }));
}

export function resizeProfilePicture(file: File, maxSize = 512, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process the selected image."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not prepare the image processor."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
