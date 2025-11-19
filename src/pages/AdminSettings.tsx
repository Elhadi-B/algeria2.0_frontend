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
        title: "Failed to load criteria",
        description: error?.error || error?.detail || "Please try again",
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
          title: "Criterion updated",
          description: `"${formData.name}" has been updated successfully`,
        });
      } else {
        // Create new criterion
        await adminCreateCriterion(formData);
        toast({
          title: "Criterion created",
          description: `"${formData.name}" has been added successfully`,
        });
      }
      
      handleCloseDialog();
      loadCriteria();
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Failed to save criterion";
      toast({
        title: editingCriterion ? "Failed to update criterion" : "Failed to create criterion",
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
        title: "Weight updated",
        description: "Criterion weight has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update weight",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (criterion: Criterion) => {
    try {
      await adminDeleteCriterion(criterion.id);
      toast({
        title: "Criterion deleted",
        description: `"${criterion.name}" has been removed`,
      });
      setDeleteConfirm(null);
      loadCriteria();
    } catch (error: any) {
      toast({
        title: "Failed to delete criterion",
        description: error?.error || error?.detail || "Please try again",
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
          <h1 className="text-3xl font-bold">Event Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage evaluation criteria and scoring weights
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Criterion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>
                Configure the criteria judges will use to evaluate teams
              </CardDescription>
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Weight: </span>
              <span className={totalWeight === 1 ? "text-green-600" : "text-yellow-600"}>
                {totalWeight.toFixed(2)}
              </span>
              {totalWeight !== 1 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Should equal 1.0)
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
              <p className="text-muted-foreground">No criteria defined yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Criterion
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
                              Key: <code className="bg-muted px-1 rounded">{criterion.key}</code>
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
              {editingCriterion ? "Edit Criterion" : "Create New Criterion"}
            </DialogTitle>
            <DialogDescription>
              {editingCriterion
                ? "Update the criterion details below"
                : "Add a new evaluation criterion for judges"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Criterion Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., innovation, impact, feasibility"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Criterion Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Innovation"
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
                placeholder="Describe what judges should evaluate"
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight *</Label>
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
                  Weight in final score (0.0 - 1.0)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order *</Label>
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
                  Order in evaluation form
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? "Saving..."
                  : editingCriterion
                  ? "Update Criterion"
                  : "Create Criterion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the criterion "{deleteConfirm?.name}". All existing
              evaluations using this criterion will be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;
