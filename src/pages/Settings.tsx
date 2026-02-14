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
  const { brand, updateBrand, clearBrand, hasBrand } = useBrandSettings();
  const { brands: trackedBrands, addBrand: addTrackedBrand, removeBrand: removeTrackedBrand } = useTrackedBrands();
  const [newName, setNewName] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newTrackedName, setNewTrackedName] = useState("");
  const [newTrackedPageId, setNewTrackedPageId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBrand = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    updateBrand({ name: trimmed, pageId: newPageId.trim() });
    setNewName("");
    setNewPageId("");
    toast({ title: "Merk opgeslagen" });
  };

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
          Beheer je merk, logo, lettertype en gevolgde merken voor inspiratie.
        </p>

        {/* Add brand form */}
        {!hasBrand && (
          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Je merk</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Merknaam (bijv. Nike)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Facebook Page ID (numeriek, bijv. 123456789)"
                value={newPageId}
                onChange={(e) => setNewPageId(e.target.value)}
                maxLength={50}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground -mt-1">
                Vind het op{" "}
                <a href="https://findmyfbid.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                  findmyfbid.com
                </a>{" "}
                — plak de Facebook-pagina-URL om het numerieke ID te krijgen.
              </p>
              <Button onClick={addBrand} disabled={!newName.trim()} className="gap-2 self-start">
                <Plus className="h-4 w-4" />
                Merk opslaan
              </Button>
            </div>
          </div>
        )}

        {/* Brand details + customization */}
        {hasBrand && (
          <div className="space-y-6">
            {/* Brand info card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Je merk</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { clearBrand(); toast({ title: "Merk verwijderd" }); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="font-medium text-foreground">{brand.name}</p>
                {brand.pageId && (
                  <p className="text-xs text-muted-foreground">Page ID: {brand.pageId}</p>
                )}
              </div>
            </div>

            {/* Logo upload */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Logo</h2>
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

            {/* Font selection */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Lettertype</h2>
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
              <p className="text-xs text-muted-foreground mt-2">
                Dit lettertype wordt gebruikt in de tool-interface voor jouw merk.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-background p-4" style={{ fontFamily: brand.fontFamily }}>
                <p className="text-lg font-bold text-foreground">Preview tekst</p>
                <p className="text-sm text-muted-foreground">Het snelle bruine vos springt over de luie hond.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tracked brands for Inspiration Ads */}
        <div className="rounded-lg border border-border bg-card p-6 mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Inspiratie merken</h2>
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
  );
};

export default Settings;
