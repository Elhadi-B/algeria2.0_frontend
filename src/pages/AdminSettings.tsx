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
    key: "",
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
        key: criterion.key,
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight,
        order: criterion.order,
      });
    } else {
      setEditingCriterion(null);
      setFormData({
        key: "",
        name: "",
        description: "",
        weight: 1.0,
        order: criteria.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCriterion(null);
    setFormData({
      key: "",
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Paramètres de l'Événement</h1>
          <p className="text-muted-foreground mt-1">
            Gérer les critères d'évaluation et les pondérations de notation
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
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
            <div className="text-sm">
              <span className="font-medium">Poids Total : </span>
              <span className={totalWeight === 1 ? "text-green-600" : "text-yellow-600"}>
                {totalWeight.toFixed(2)}
              </span>
              {totalWeight !== 1 && (
                <span className="text-xs text-muted-foreground ml-2">
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
                    <div className="flex items-start gap-4">
                      <div className="flex items-center">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{criterion.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Clé : <code className="bg-muted px-1 rounded">{criterion.key}</code>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(criterion)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(criterion)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`weight-${criterion.id}`} className="text-xs">
                              Weight:
                            </Label>
                            <Input
                              id={`weight-${criterion.id}`}
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={criterion.weight}
                              onChange={(e) =>
                                handleQuickWeightUpdate(
                                  criterion.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({(criterion.weight * 100).toFixed(0)}%)
                            </span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
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
        <DialogContent className="max-w-2xl">
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
              <Label htmlFor="key">Clé du Critère *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ex : innovation, impact, faisabilité"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique (minuscules, pas d'espaces)
              </p>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Poids *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
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
                  Poids dans le score final (0.0 - 1.0)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordre d'Affichage *</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  required
                  disabled={isSubmitting}
                />
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
