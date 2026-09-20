import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useColorScheme } from "@/components/ColorSchemeProvider";
import type { ColorSchemeId } from "@/lib/colorSchemes";

/** Homepage header control — live preview of brand color schemes. */
export function ColorSchemePicker() {
  const { schemeId, schemes, setSchemeId } = useColorScheme();

  return (
    <div className="flex items-center gap-1.5" data-testid="color-scheme-picker">
      <span className="text-xs text-muted-foreground hidden mobile-m:inline">Look</span>
      <Select
        value={schemeId}
        onValueChange={(v) => setSchemeId(v as ColorSchemeId)}
      >
        <SelectTrigger
          className="h-8 w-[9.5rem] mobile-m:w-[11rem] text-xs bg-background/80 border-border"
          aria-label="Theme color scheme"
          data-testid="select-color-scheme"
        >
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent align="end">
          {schemes.map((s) => (
            <SelectItem key={s.id} value={s.id} data-testid={`scheme-option-${s.id}`}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
