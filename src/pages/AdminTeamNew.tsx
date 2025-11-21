import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { adminCreateTeam, adminListTeams } from "@/lib/api";
import type { CreateTeamRequest } from "@/lib/types";

const AdminTeamNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTeamRequest>({
    num_equipe: "",
    nom_equipe: "",
  });
  const [existingNums, setExistingNums] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teams = await adminListTeams();
        setExistingNums(new Set(teams.map((team) => team.num_equipe.toLowerCase())));
      } catch (error) {
        console.error("Failed to load existing teams", error);
      }
    };
    fetchTeams();
  }, []);

  const handleInputChange = (field: keyof CreateTeamRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const trimmedNum = formData.num_equipe.trim();
      const trimmedName = formData.nom_equipe.trim();

      if (!trimmedNum || !trimmedName) {
        toast({
          title: "Champs manquants",
          description: "Veuillez renseigner le numéro et le nom de l'équipe.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (existingNums.has(trimmedNum.toLowerCase())) {
        toast({
          title: "Numéro déjà utilisé",
          description: `Le numéro d'équipe "${trimmedNum}" existe déjà.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const submitData: CreateTeamRequest = {
        num_equipe: trimmedNum,
        nom_equipe: trimmedName,
      };

      await adminCreateTeam(submitData);
      setExistingNums((prev) => new Set(prev).add(trimmedNum.toLowerCase()));
      
      toast({
        title: "Équipe créée",
        description: `L'équipe "${trimmedName}" a été ajoutée avec succès`,
      });
      
      navigate("/admin/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de la création de l'équipe";
      toast({
        title: "Échec de la création de l'équipe",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Créer Nouvelle Équipe</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Ajouter une nouvelle équipe à la compétition
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Équipe</CardTitle>
          <CardDescription>
            Remplissez les détails de la nouvelle équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="num_equipe">Numéro d'Équipe *</Label>
              <Input
                id="num_equipe"
                value={formData.num_equipe}
                onChange={(e) => handleInputChange("num_equipe", e.target.value)}
                placeholder="Ex: EQ-01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_equipe">Nom de l'Équipe *</Label>
              <Input
                id="nom_equipe"
                value={formData.nom_equipe}
                onChange={(e) => handleInputChange("nom_equipe", e.target.value)}
                placeholder="Entrez le nom de l'équipe"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/teams")}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Création..." : "Créer Équipe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamNew;

