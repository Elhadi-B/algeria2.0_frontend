import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2, Edit, X, GripVertical, Loader2 } from "lucide-react";
import {
  adminListCriteria,
  adminCreateCriterion,
  adminUpdateCriterion,
  adminPatchCriterion,
  adminDeleteCriterion,
} from "@/lib/api";
import type { Criterion, CreateCriterionRequest, UpdateCriterionRequest } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminSettings = () => {
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Criterion | null>(null);
  const [formData, setFormData] = useState<CreateCriterionRequest>({
    name: "",
    description: "",
    weight: 1.0,
    order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    setIsLoading(true);
    try {
      const data = await adminListCriteria();
      // Sort by order
      const sorted = data.sort((a, b) => a.order - b.order);
      setCriteria(sorted);
    } catch (error: any) {
      toast({
        title: "Échec du chargement des critères",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (criterion?: Criterion) => {
    if (criterion) {
      setEditingCriterion(criterion);
      setFormData({
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight,
        order: criterion.order,
      });
    } else {
      setEditingCriterion(null);
      setFormData({
        name: "",
        description: "",
        weight: 1.0,
        order: criteria.length > 0 ? Math.max(...criteria.map(c => c.order)) + 1 : 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCriterion(null);
    setFormData({
      name: "",
      description: "",
      weight: 1.0,
      order: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate weight is not 0
      if (Number(formData.weight) <= 0) {
        toast({
          title: "Erreur de validation",
          description: "Le poids ne peut pas être égal à 0. Veuillez entrer un poids supérieur à 0.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate weight sum
      const otherCriteria = criteria.filter(c => editingCriterion ? c.id !== editingCriterion.id : true);
      const currentTotalWeight = otherCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      const newTotalWeight = currentTotalWeight + (Number(formData.weight) || 0);
      
      if (newTotalWeight > 1) {
        toast({
          title: "Erreur de validation",
          description: `La somme des poids ne peut pas dépasser 1.0. Poids total actuel avec ce critère: ${newTotalWeight.toFixed(2)}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate order uniqueness
      const orderExists = criteria.some(c => {
        if (editingCriterion && c.id === editingCriterion.id) return false;
        return c.order === formData.order;
      });
      
      if (orderExists) {
        toast({
          title: "Erreur de validation",
          description: `Un critère avec l'ordre ${formData.order} existe déjà. Veuillez choisir un autre ordre.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (editingCriterion) {
        // Update existing criterion
        await adminUpdateCriterion(editingCriterion.id, formData);
        toast({
          title: "Critère mis à jour",
          description: `"${formData.name}" a été mis à jour avec succès`,
        });
      } else {
        // Create new criterion
        await adminCreateCriterion(formData);
        toast({
          title: "Critère créé",
          description: `"${formData.name}" a été ajouté avec succès`,
        });
      }
      
      handleCloseDialog();
      loadCriteria();
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de l'enregistrement du critère";
      toast({
        title: editingCriterion ? "Échec de la mise à jour du critère" : "Échec de la création du critère",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickWeightUpdate = async (id: number, newWeight: number) => {
    try {
      await adminPatchCriterion(id, { weight: newWeight });
      setCriteria((prev) =>
        prev.map((c) => (c.id === id ? { ...c, weight: newWeight } : c))
      );
      toast({
        title: "Poids mis à jour",
        description: "Le poids du critère a été mis à jour",
      });
    } catch (error: any) {
      toast({
        title: "Échec de la mise à jour du poids",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (criterion: Criterion) => {
    try {
      await adminDeleteCriterion(criterion.id);
      toast({
        title: "Critère supprimé",
        description: `"${criterion.name}" a été retiré`,
      });
      setDeleteConfirm(null);
      loadCriteria();
    } catch (error: any) {
      toast({
        title: "Échec de la suppression du critère",
        description: error?.error || error?.detail || "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  const totalWeight = Array.isArray(criteria) 
    ? criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Paramètres de l'Événement</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gérer les critères d'évaluation et les pondérations de notation
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter Critère
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Critères d'Évaluation</CardTitle>
              <CardDescription>
                Configurer les critères que les jurys utiliseront pour évaluer les équipes
              </CardDescription>
            </div>
            <div className="text-sm mt-2 sm:mt-0">
              <span className="font-medium">Poids Total : </span>
              <span className={totalWeight === 1 ? "text-green-600" : "text-yellow-600"}>
                {totalWeight.toFixed(2)}
              </span>
              {totalWeight !== 1 && (
                <span className="text-xs text-muted-foreground ml-2 block sm:inline">
                  (Devrait égaler 1.0)
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : criteria.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun critère défini pour le moment</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Premier Critère
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {criteria.map((criterion) => (
                <Card key={criterion.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="flex items-center shrink-0">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      </div>
                      
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg break-words">{criterion.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(criterion)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(criterion)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground break-words">
                          {criterion.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`weight-${criterion.id}`} className="text-xs whitespace-nowrap">
                              Weight:
                            </Label>
                            <Input
                              id={`weight-${criterion.id}`}
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={criterion.weight}
                              disabled
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              ({(criterion.weight * 100).toFixed(0)}%)
                            </span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            Order: {criterion.order}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCriterion ? "Modifier Critère" : "Créer Nouveau Critère"}
            </DialogTitle>
            <DialogDescription>
              {editingCriterion
                ? "Mettre à jour les détails du critère ci-dessous"
                : "Ajouter un nouveau critère d'évaluation pour les jurys"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du Critère *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex : Innovation"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez ce que les jurys doivent évaluer"
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Poids *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })
                  }
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Le poids doit être supérieur à 0
                </p>
                <p className="text-xs text-muted-foreground">
                  Poids dans le score final (0.0 - 1.0)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordre d'Affichage *</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 1 })
                  }
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  L'ordre commence à 1
                </p>
                <p className="text-xs text-muted-foreground">
                  Ordre dans le formulaire d'évaluation
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? "Enregistrement..."
                  : editingCriterion
                  ? "Mettre à Jour Critère"
                  : "Créer Critère"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela supprimera définitivement le critère "{deleteConfirm?.name}". Toutes les
              évaluations existantes utilisant ce critère seront affectées. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;
