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
          title: "Invalid file type",
          description: "Please select a CSV file",
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
        title: "No file selected",
        description: "Please select a CSV file first",
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
      const errorMessage = error?.error || error?.detail || error?.message || "Failed to preview CSV";
      toast({
        title: "Preview failed",
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
        title: "No preview",
        description: "Please preview the CSV file first",
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
        title: "Teams imported successfully",
        description: result.message,
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/admin/teams");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Failed to import teams";
      toast({
        title: "Import failed",
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
          <h1 className="text-3xl font-bold">Import Teams from CSV</h1>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file to import multiple teams at once
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV File Upload</CardTitle>
          <CardDescription>
            Select a CSV file and preview it before importing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
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
                CSV format should match the application form with columns: Project Title, Team Leader info, Team Members, Project Domain, Project Summary, etc.
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View CSV format requirements
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs mb-2">Required columns:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>Project Title</li>
                    <li>Team Leader: Full Name</li>
                    <li>Team Leader: Year of Study</li>
                    <li>Team Leader: Email address</li>
                    <li>Team Leader: Phone Number</li>
                    <li>Team Members (name and year, one per line)</li>
                    <li>Project Domain</li>
                    <li>Project Summary (100-150 words)</li>
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePreview}
              disabled={!file || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Processing..." : "Preview"}
            </Button>
          </div>

          {preview && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Preview Mode</AlertTitle>
                <AlertDescription>
                  {preview.message || "Review the data below. Click 'Import Teams' to commit."}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Total Rows: {preview.total_rows}
                  {preview.errors.length > 0 && (
                    <span className="text-destructive ml-2">
                      ({preview.errors.length} errors)
                    </span>
                  )}
                </p>

                {preview.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors Found</AlertTitle>
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
                          <TableHead>Project Name</TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Team Leader</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Members</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.preview_rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {row.project_name}
                            </TableCell>
                            <TableCell>
                              {row.project_domain || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {row.team_leader_name && (
                                  <div className="font-medium">{row.team_leader_name}</div>
                                )}
                                {row.team_leader_email && (
                                  <div className="text-muted-foreground text-xs">{row.team_leader_email}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {row.short_description}
                            </TableCell>
                            <TableCell>{row.members || "-"}</TableCell>
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
                  Import {preview.total_rows} Teams
                </Button>
              </div>
            </div>
          )}

          {commitResult && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Import Successful!</AlertTitle>
              <AlertDescription>
                <p className="mt-2">{commitResult.message}</p>
                {commitResult.created.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Created Teams:</p>
                    <ul className="list-disc list-inside">
                      {commitResult.created.map((team) => (
                        <li key={team.id}>{team.project_name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {commitResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-destructive mb-2">Errors:</p>
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

