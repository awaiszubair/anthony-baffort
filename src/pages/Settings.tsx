import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useTrackedBrands } from "@/hooks/useTrackedBrands";
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

  const handleAddTrackedBrand = () => {
    const trimmed = newTrackedName.trim();
    if (!trimmed) return;
    addTrackedBrand(trimmed, newTrackedPageId.trim());
    setNewTrackedName("");
    setNewTrackedPageId("");
    toast({ title: "Merk toegevoegd aan inspiratie" });
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Alleen afbeeldingen", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Maximaal 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateBrand({ logoUrl: reader.result as string });
      toast({ title: "Logo opgeslagen" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Stel je standaard logo en lettertype in voor de Resizer, en beheer merken voor Inspiration Ads.
        </p>

        <div className="space-y-6">
          {/* Default logo */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Standaard logo</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Dit logo wordt automatisch toegepast wanneer je een afbeelding uploadt in de Resizer.
            </p>
            {brand.logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                  <img src={brand.logoUrl} alt="Brand logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Vervangen
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { updateBrand({ logoUrl: null }); toast({ title: "Logo verwijderd" }); }}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" /> Verwijderen
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Upload je logo</span>
                <span className="text-xs">PNG, JPG of SVG — max 2MB</span>
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
            <h2 className="text-lg font-semibold text-foreground mb-1">Standaard lettertype</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Dit lettertype wordt automatisch ingesteld voor tekst-overlays in de Resizer.
            </p>
            <Select value={brand.fontFamily} onValueChange={(font) => { updateBrand({ fontFamily: font }); toast({ title: "Lettertype opgeslagen" }); }}>
              <SelectTrigger className="w-full max-w-xs bg-background">
                <SelectValue placeholder="Kies een lettertype" />
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
              <p className="text-lg font-bold text-foreground">Preview tekst</p>
              <p className="text-sm text-muted-foreground">Het snelle bruine vos springt over de luie hond.</p>
            </div>
          </div>

          {/* Tracked brands for Inspiration Ads */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Inspiratie merken</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Merken die je wilt volgen in Inspiration Ads. Je kunt ze daar ook ter plaatse toevoegen.
            </p>

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
                      onClick={() => { removeTrackedBrand(b.id); toast({ title: "Merk verwijderd" }); }}
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
                  placeholder="Merknaam"
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
                Toevoegen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
