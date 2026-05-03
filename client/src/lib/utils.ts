/**
 * Re-export shared utilities so the client only has one source of truth.
 * Per Manus review §2.3 - keeps `import { cn } from "@/lib/utils"` working
 * for existing components without duplicating logic.
 */
export { cn } from '@foodiefinds/shared'
