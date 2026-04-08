import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(line => {
    // Handle quoted commas
    const cols = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else { cur += line[i]; }
    }
    cols.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));
  });
  return { headers, rows };
}

function mapRow(row, fieldMap) {
  const result = {};
  Object.entries(fieldMap).forEach(([entityField, csvField]) => {
    if (csvField && row[csvField] !== undefined) {
      result[entityField] = row[csvField];
    }
  });
  return result;
}

export default function CsvImport({ open, onClose, entityName, fields, onImport, sampleHeaders }) {
  const [parsed, setParsed] = useState(null);
  const [fieldMap, setFieldMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      setParsed({ headers, rows });
      setResult(null);
      // Auto-map fields where names match
      const autoMap = {};
      fields.forEach(f => {
        const match = headers.find(h => h === f.key || h === f.label.toLowerCase().replace(/\s+/g, "_") || h === f.label.toLowerCase());
        autoMap[f.key] = match || "";
      });
      setFieldMap(autoMap);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    const records = parsed.rows.map(row => mapRow(row, fieldMap)).filter(r => Object.keys(r).length > 0);
    let success = 0, failed = 0;
    for (const record of records) {
      try {
        await onImport(record);
        success++;
      } catch {
        failed++;
      }
    }
    setResult({ success, failed });
    setImporting(false);
    if (success > 0) toast.success(`Imported ${success} ${entityName}(s)`);
    if (failed > 0) toast.error(`${failed} row(s) failed`);
  };

  const handleClose = () => {
    setParsed(null);
    setFieldMap({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  const sampleCSV = sampleHeaders.join(",") + "\n" + sampleHeaders.map(() => "example").join(",");
  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample_${entityName}.csv`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityName}s from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Upload area */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload CSV file</p>
            <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          <button onClick={downloadSample} className="text-xs text-primary underline underline-offset-2 hover:no-underline">
            Download sample CSV template
          </button>

          {/* Column mapping */}
          {parsed && (
            <div>
              <p className="text-sm font-semibold mb-3">
                <FileText className="h-4 w-4 inline mr-1.5" />
                Map CSV columns ({parsed.rows.length} rows detected)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-36 shrink-0 text-muted-foreground">{f.label}{f.required && " *"}</span>
                    <select
                      className="flex-1 h-8 rounded-md border bg-background px-2 text-xs"
                      value={fieldMap[f.key] || ""}
                      onChange={e => setFieldMap(m => ({ ...m, [f.key]: e.target.value }))}
                    >
                      <option value="">— skip —</option>
                      {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {parsed.rows.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-lg border">
                  <table className="text-xs w-full">
                    <thead className="bg-secondary/60">
                      <tr>
                        {parsed.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t">
                          {parsed.headers.map(h => <td key={h} className="px-3 py-1.5 text-muted-foreground truncate max-w-[120px]">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 3 && (
                    <p className="px-3 py-1.5 text-xs text-muted-foreground bg-secondary/30">+{parsed.rows.length - 3} more rows</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              {result.failed === 0
                ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
              }
              <span className="text-sm">
                {result.success > 0 && <><strong>{result.success}</strong> imported successfully. </>}
                {result.failed > 0 && <><strong>{result.failed}</strong> rows failed.</>}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>Close</Button>
            {parsed && !result && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${parsed.rows.length} rows`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}