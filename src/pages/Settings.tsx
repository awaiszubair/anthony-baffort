import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GOOGLE_FONTS = [
  "DM Sans",
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Lato",
  "Playfair Display",
  "Merriweather",
  "Raleway",
  "Nunito",
  "Work Sans",
  "Outfit",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "Sora",
  "Manrope",
  "Cormorant Garamond",
  "Libre Baskerville",
  "Josefin Sans",
];

interface Brand {
  id: string;
  name: string;
  page_id: string | null;
  user_id: string | null;
  logo_url: string | null;
  font_family: string | null;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBrands((data as Brand[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const hasBrand = brands.some((b) => b.user_id === user?.id);
  const userBrand = brands.find((b) => b.user_id === user?.id);

  const addBrand = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !user) return;

    setAdding(true);
    const { error } = await supabase
      .from("brands")
      .insert({ name: trimmed, page_id: newPageId.trim() || null, user_id: user.id });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setNewPageId("");
      fetchBrands();
      toast({ title: "Merk toegevoegd" });
    }
    setAdding(false);
  };

  const deleteBrand = async (id: string) => {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Merk verwijderd" });
    }
  };

  const uploadLogo = async (file: File) => {
    if (!user || !userBrand) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Alleen afbeeldingen", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Maximaal 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload mislukt", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("brand-logos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("brands")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", userBrand.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      fetchBrands();
      toast({ title: "Logo opgeslagen" });
    }
    setUploading(false);
  };

  const removeLogo = async () => {
    if (!user || !userBrand) return;

    const { error } = await supabase
      .from("brands")
      .update({ logo_url: null })
      .eq("id", userBrand.id);

    if (!error) {
      fetchBrands();
      toast({ title: "Logo verwijderd" });
    }
  };

  const updateFont = async (font: string) => {
    if (!userBrand) return;

    const { error } = await supabase
      .from("brands")
      .update({ font_family: font })
      .eq("id", userBrand.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchBrands();
      toast({ title: "Lettertype opgeslagen" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Beheer je merk, logo en lettertype.
        </p>

        {/* Add brand form — only show if user has no brand yet */}
        {!hasBrand && (
          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Merk toevoegen</h2>
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
              <Button onClick={addBrand} disabled={adding || !newName.trim()} className="gap-2 self-start">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Merk toevoegen
              </Button>
            </div>
          </div>
        )}

        {/* Brand details + customization */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : userBrand ? (
          <div className="space-y-6">
            {/* Brand info card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Je merk</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteBrand(userBrand.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="font-medium text-foreground">{userBrand.name}</p>
                {userBrand.page_id && (
                  <p className="text-xs text-muted-foreground">Page ID: {userBrand.page_id}</p>
                )}
              </div>
            </div>

            {/* Logo upload */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Logo</h2>
              {userBrand.logo_url ? (
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                    <img
                      src={userBrand.logo_url}
                      alt="Brand logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-2"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Vervangen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span className="text-sm font-medium">Upload je logo</span>
                      <span className="text-xs">PNG, JPG of SVG — max 2MB</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Font selection */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Lettertype</h2>
              <Select
                value={userBrand.font_family || "DM Sans"}
                onValueChange={updateFont}
              >
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
              {/* Preview */}
              <div
                className="mt-4 rounded-lg border border-border bg-background p-4"
                style={{ fontFamily: userBrand.font_family || "DM Sans" }}
              >
                <p className="text-lg font-bold text-foreground">Preview tekst</p>
                <p className="text-sm text-muted-foreground">
                  Het snelle bruine vos springt over de luie hond.
                </p>
              </div>
            </div>
          </div>
        ) : (
          !hasBrand && (
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-muted-foreground text-sm">
                Voeg hierboven je merk toe om logo en lettertype in te stellen.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Settings;
