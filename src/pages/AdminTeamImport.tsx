import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { adminUploadTeamsCSV } from "@/lib/api";
import type { CSVUploadPreviewResponse, CSVUploadCommitResponse } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminTeamImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<CSVUploadPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CSVUploadCommitResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Type de fichier invalide",
          description: "Veuillez sélectionner un fichier CSV",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setPreview(null);
      setCommitResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez d'abord sélectionner un fichier CSV",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminUploadTeamsCSV({
        file,
        commit: false, // Preview mode
      });
      setPreview(result as CSVUploadPreviewResponse);
      setCommitResult(null);
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de l'aperçu du CSV";
      toast({
        title: "Échec de l'aperçu",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    if (!preview) {
      toast({
        title: "Aucun aperçu",
        description: "Veuillez d'abord prévisualiser le fichier CSV",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminUploadTeamsCSV({
        file,
        commit: true, // Commit mode
      });
      setCommitResult(result as CSVUploadCommitResponse);
      
      toast({
        title: "Équipes importées avec succès",
        description: result.message,
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/admin/teams");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de l'importation des équipes";
      toast({
        title: "Échec de l'importation",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Importer Équipes depuis CSV</h1>
          <p className="text-muted-foreground mt-1">
            Téléchargez un fichier CSV pour importer plusieurs équipes à la fois
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Téléchargement Fichier CSV</CardTitle>
          <CardDescription>
            Sélectionnez un fichier CSV et prévisualisez-le avant l'importation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Fichier CSV</Label>
            <div className="flex items-center gap-4">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isLoading}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Le format CSV doit contenir uniquement deux colonnes: <strong>num_equipe</strong> (identifiant unique saisi par l'utilisateur) et <strong>nom_equipe</strong>.
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Voir les exigences de format CSV
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs mb-2">Colonnes requises :</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li><code>num_equipe</code> — identifiant unique fourni par l'organisateur</li>
                    <li><code>nom_equipe</code> — nom complet de l'équipe</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/teams")}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handlePreview}
              disabled={!file || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Traitement..." : "Prévisualiser"}
            </Button>
          </div>

          {preview && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Mode Prévisualisation</AlertTitle>
                <AlertDescription>
                  {preview.message || "Vérifiez les données ci-dessous. Cliquez sur 'Importer Équipes' pour valider."}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Total Lignes : {preview.total_rows}
                  {preview.errors.length > 0 && (
                    <span className="text-destructive ml-2">
                      ({preview.errors.length} erreurs)
                    </span>
                  )}
                </p>

                {preview.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreurs Trouvées</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2">
                        {preview.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {preview.preview_rows.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Nom de l'Équipe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.preview_rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {row.num_equipe}
                            </TableCell>
                            <TableCell>
                              {row.nom_equipe}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleCommit}
                  disabled={isLoading || preview.errors.length > 0}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Importer {preview.total_rows} Équipes
                </Button>
              </div>
            </div>
          )}

          {commitResult && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Importation Réussie !</AlertTitle>
              <AlertDescription>
                <p className="mt-2">{commitResult.message}</p>
                {commitResult.created.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Équipes Créées :</p>
                    <ul className="list-disc list-inside">
                      {commitResult.created.map((team) => (
                        <li key={team.num_equipe}>
                          #{team.num_equipe} — {team.nom_equipe}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {commitResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-destructive mb-2">Erreurs :</p>
                    <ul className="list-disc list-inside">
                      {commitResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamImport;

