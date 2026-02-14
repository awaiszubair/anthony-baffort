import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Brand {
  id: string;
  name: string;
  page_id: string | null;
  user_id: string | null;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBrands(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const hasBrand = brands.some((b) => b.user_id === user?.id);

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
      toast({ title: "Brand added" });
    }
    setAdding(false);
  };

  const deleteBrand = async (id: string) => {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Brand removed" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Beheer je merk en Facebook Page ID.
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
                Vind het op <a href="https://findmyfbid.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">findmyfbid.com</a> — plak de Facebook-pagina-URL om het numerieke ID te krijgen.
              </p>
              <Button onClick={addBrand} disabled={adding || !newName.trim()} className="gap-2 self-start">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Merk toevoegen
              </Button>
            </div>
          </div>
        )}

        {/* Brand list */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Je merk</h2>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : brands.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nog geen merk toegevoegd. Voeg hierboven je merk toe.</p>
          ) : (
            <div className="divide-y divide-border">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">{brand.name}</p>
                    {brand.page_id && (
                      <p className="text-xs text-muted-foreground">Page ID: {brand.page_id}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBrand(brand.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
