"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { bulkCreateMenuItems } from "@/actions/menu";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuImportExportProps {
    items: any[];
}

export function MenuImportExport({ items }: MenuImportExportProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const XLSX = await import("xlsx");

            // Format data for export
            const exportData = items.map(item => ({
                Name: item.name,
                Category: item.category,
                Price: item.price,
                Description: item.description || "",
                "Is Available": item.isAvailable ? "Yes" : "No",
                "Business Unit": item.businessUnit || "shared"
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Menu Items");

            // Generate filename with date
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `menu_export_${date}.xlsx`);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            const XLSX = await import("xlsx");
            const reader = new FileReader();

            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) {
                        alert("No data found in file");
                        return;
                    }

                    // Map Excel columns back to data structure
                    // Flexible mapping keys to handle different casing?
                    // For now assume template matches export
                    const mappedData = data.map((row: any) => ({
                        name: row.Name || row.name,
                        category: row.Category || row.category,
                        price: row.Price || row.price,
                        description: row.Description || row.description,
                        isAvailable: (row["Is Available"] === "Yes" || row.isAvailable === true || row.isAvailable === "true"),
                        businessUnit: row["Business Unit"] || row.businessUnit || "cafe"
                    })).filter(item => item.name && item.price); // Basic validation

                    if (confirm(`Ready to import ${mappedData.length} items? This will add new items.`)) {
                        const result = await bulkCreateMenuItems(mappedData);
                        if (result.success) {
                            alert(`Successfully imported ${result.count} items!`);
                            router.refresh();
                        } else {
                            alert(`Import failed: ${result.error}`);
                        }
                    }
                } catch (err: any) {
                    console.error("Parse error:", err);
                    alert("Error parsing file: " + err.message);
                } finally {
                    setImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            };
            reader.readAsBinaryString(file);

        } catch (error) {
            console.error("Import process failed:", error);
            setImporting(false);
        }
    };

    return (
        <>
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Import / Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a20] border-white/10 text-white">
                    <DropdownMenuItem onClick={handleExport} disabled={exporting} className="cursor-pointer hover:bg-white/10">
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleImportClick} disabled={importing} className="cursor-pointer hover:bg-white/10">
                        {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import from Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
