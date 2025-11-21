import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { adminCreateTeam } from "@/lib/api";
import type { CreateTeamRequest } from "@/lib/types";

const AdminTeamNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTeamRequest>({
    project_name: "",
    short_description: "",
    members: "",
  });

  const handleInputChange = (field: keyof CreateTeamRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: CreateTeamRequest = {
        ...formData,
      };

      await adminCreateTeam(submitData);
      
      toast({
        title: "Équipe créée",
        description: `"${formData.project_name}" a été ajoutée avec succès`,
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
              <Label htmlFor="project_name">Nom du Projet *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => handleInputChange("project_name", e.target.value)}
                placeholder="Entrez le nom du projet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Courte Description *</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => handleInputChange("short_description", e.target.value)}
                placeholder="Brève description du projet"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_name">Nom du Chef d'Équipe</Label>
              <Input
                id="team_leader_name"
                value={formData.team_leader_name || ""}
                onChange={(e) => handleInputChange("team_leader_name", e.target.value)}
                placeholder="Entrez le nom complet du chef d'équipe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_year">Année d'Études du Chef d'Équipe</Label>
              <Input
                id="team_leader_year"
                value={formData.team_leader_year || ""}
                onChange={(e) => handleInputChange("team_leader_year", e.target.value)}
                placeholder="ex: 3ème année"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_email">Email du Chef d'Équipe</Label>
              <Input
                id="team_leader_email"
                type="email"
                value={formData.team_leader_email || ""}
                onChange={(e) => handleInputChange("team_leader_email", e.target.value)}
                placeholder="Entrez l'email du chef d'équipe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_phone">Téléphone du Chef d'Équipe</Label>
              <Input
                id="team_leader_phone"
                value={formData.team_leader_phone || ""}
                onChange={(e) => handleInputChange("team_leader_phone", e.target.value)}
                placeholder="Entrez le numéro de téléphone du chef d'équipe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_domain">Domaine du Projet</Label>
              <Input
                id="project_domain"
                value={formData.project_domain || ""}
                onChange={(e) => handleInputChange("project_domain", e.target.value)}
                placeholder="ex: Agriculture, Santé"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="members">Membres de l'Équipe *</Label>
              <Input
                id="members"
                value={formData.members}
                onChange={(e) => handleInputChange("members", e.target.value)}
                placeholder="Entrez les noms séparés par des points-virgules (ex: Jean;Sarah;Michel)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Séparez plusieurs membres avec des points-virgules (;)
              </p>
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

