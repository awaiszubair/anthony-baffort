import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useTrackedBrands } from "@/hooks/useTrackedBrands";
import { useI18n } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GOOGLE_FONTS = [
  "DM Sans", "Inter", "Poppins", "Roboto", "Open Sans", "Montserrat",
  "Lato", "Playfair Display", "Merriweather", "Raleway", "Nunito",
  "Work Sans", "Outfit", "Plus Jakarta Sans", "Space Grotesk", "Sora",
  "Manrope", "Cormorant Garamond", "Libre Baskerville", "Josefin Sans",
];

const Settings = () => {
  const { brand, updateBrand } = useBrandSettings();
  const { brands: trackedBrands, addBrand: addTrackedBrand, removeBrand: removeTrackedBrand } = useTrackedBrands();
  const [newTrackedName, setNewTrackedName] = useState("");
  const [newTrackedPageId, setNewTrackedPageId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleAddTrackedBrand = () => {
    const trimmed = newTrackedName.trim();
    if (!trimmed) return;
    addTrackedBrand(trimmed, newTrackedPageId.trim());
    setNewTrackedName("");
    setNewTrackedPageId("");
    toast({ title: t.brandAdded });
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t.imagesOnly, variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t.maxFileSize, variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateBrand({ logoUrl: reader.result as string });
      toast({ title: t.logoSaved });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.settingsTitle}</h1>
        <p className="text-muted-foreground mb-8">{t.settingsDescription}</p>

        <div className="space-y-6">
          {/* Default logo */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">{t.defaultLogo}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t.defaultLogoDescription}</p>
            {brand.logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                  <img src={brand.logoUrl} alt="Brand logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> {t.replaceLogo}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { updateBrand({ logoUrl: null }); toast({ title: t.logoRemoved }); }}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" /> {t.removeBrandLogo}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">{t.uploadLogo}</span>
                <span className="text-xs">{t.uploadLogoHint}</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Default font */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">{t.defaultFont}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t.defaultFontDescription}</p>
            <Select value={brand.fontFamily} onValueChange={(font) => { updateBrand({ fontFamily: font }); toast({ title: t.fontSaved }); }}>
              <SelectTrigger className="w-full max-w-xs bg-background">
                <SelectValue placeholder={t.chooseFont} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 rounded-lg border border-border bg-background p-4" style={{ fontFamily: brand.fontFamily }}>
              <p className="text-lg font-bold text-foreground">{t.fontPreview}</p>
              <p className="text-sm text-muted-foreground">{t.fontPreviewText}</p>
            </div>
          </div>

          {/* Tracked brands for Inspiration Ads */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">{t.inspirationBrands}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t.inspirationBrandsDescription}</p>

            {trackedBrands.length > 0 && (
              <div className="space-y-2 mb-4">
                {trackedBrands.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.name}</p>
                      {b.pageId && <p className="text-xs text-muted-foreground">Page ID: {b.pageId}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { removeTrackedBrand(b.id); toast({ title: t.brandRemoved }); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder={t.brandName}
                  value={newTrackedName}
                  onChange={(e) => setNewTrackedName(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTrackedBrand()}
                />
              </div>
              <div className="w-36">
                <Input
                  placeholder="Page ID"
                  value={newTrackedPageId}
                  onChange={(e) => setNewTrackedPageId(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTrackedBrand()}
                />
              </div>
              <Button onClick={handleAddTrackedBrand} disabled={!newTrackedName.trim()} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {t.add}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
