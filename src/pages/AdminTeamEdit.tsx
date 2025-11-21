import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { adminGetTeam, adminUpdateTeam } from "@/lib/api";
import type { UpdateTeamRequest, Team } from "@/lib/types";

const AdminTeamEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateTeamRequest>({
    num_equipe: "",
    nom_equipe: "",
  });

  useEffect(() => {
    if (id) {
      loadTeam();
    }
  }, [id]);

  const loadTeam = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const team = await adminGetTeam(id);
      setFormData({
        num_equipe: team.num_equipe,
        nom_equipe: team.nom_equipe,
      });
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec du chargement de l'équipe";
      toast({
        title: "Échec du chargement de l'équipe",
        description: errorMessage,
        variant: "destructive",
      });
      navigate("/admin/teams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateTeamRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);

    try {
      const submitData: UpdateTeamRequest = {
        ...formData,
      };

      await adminUpdateTeam(id, submitData);
      
      toast({
        title: "Équipe mise à jour",
        description: `"${formData.nom_equipe}" a été mise à jour avec succès`,
      });
      
      navigate("/admin/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de la mise à jour de l'équipe";
      toast({
        title: "Échec de la mise à jour de l'équipe",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chargement des détails de l'équipe...</p>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Modifier Équipe</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Mettre à jour les informations de l'équipe
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Équipe</CardTitle>
          <CardDescription>
            Mettre à jour les détails de cette équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="num_equipe">Numéro d'Équipe</Label>
              <Input
                id="num_equipe"
                value={formData.num_equipe || ""}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Le numéro est défini lors de la création et ne peut pas être modifié.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_equipe">Nom de l'Équipe *</Label>
              <Input
                id="nom_equipe"
                value={formData.nom_equipe || ""}
                onChange={(e) => handleInputChange("nom_equipe", e.target.value)}
                placeholder="Mettre à jour le nom de l'équipe"
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
                {isSubmitting ? "Mise à jour..." : "Mettre à Jour Équipe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamEdit;

