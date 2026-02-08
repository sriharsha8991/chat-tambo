"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCurrentUser } from "@/contexts/PersonaContext";

interface SalarySlipFormProps {
  employeeName?: string;
  employeeId?: string;
  department?: string;
  defaultMode?: "single" | "multiple";
  defaultMonth?: string;
  defaultYear?: number;
}

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const formatMonthLabel = (value: string) => {
  const match = monthOptions.find((item) => item.value === value);
  return match?.label ?? value;
};

const buildSlipText = (params: {
  employeeName: string;
  employeeId: string;
  department: string;
  month: string;
  year: number;
}) => {
  const grossPay = 75000;
  const deductions = 12000;
  const netPay = grossPay - deductions;

  return [
    "Salary Slip",
    "============",
    `Employee: ${params.employeeName}`,
    `Employee ID: ${params.employeeId}`,
    `Department: ${params.department}`,
    `Month: ${formatMonthLabel(params.month)} ${params.year}`,
    "",
    `Gross Pay: ${grossPay}`,
    `Deductions: ${deductions}`,
    `Net Pay: ${netPay}`,
    "",
    "This is a demo salary slip for hackathon purposes.",
  ].join("\n");
};

const downloadFile = (fileName: string, content: string) => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export function SalarySlipForm({
  employeeName,
  employeeId,
  department,
  defaultMode = "single",
  defaultMonth,
  defaultYear,
}: SalarySlipFormProps) {
  const currentUser = useCurrentUser();
  const now = useMemo(() => new Date(), []);
  const initialMonth = defaultMonth ?? String(now.getMonth() + 1).padStart(2, "0");
  const initialYear = defaultYear ?? now.getFullYear();

  const [mode, setMode] = useState<"single" | "multiple">(defaultMode);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(String(initialYear));
  const [startMonth, setStartMonth] = useState(initialMonth);
  const [endMonth, setEndMonth] = useState(initialMonth);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolvedName = employeeName || currentUser.name || "Employee";
  const resolvedId = employeeId || currentUser.employeeId || "EMP-000";
  const resolvedDepartment = department || currentUser.department || "General";

  const parseYear = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < 2000 || parsed > 2100) return null;
    return parsed;
  };

  const getMonthRange = (start: string, end: string) => {
    const startIndex = monthOptions.findIndex((item) => item.value === start);
    const endIndex = monthOptions.findIndex((item) => item.value === end);
    if (startIndex === -1 || endIndex === -1) return [] as string[];

    const rangeStart = Math.min(startIndex, endIndex);
    const rangeEnd = Math.max(startIndex, endIndex);

    return monthOptions.slice(rangeStart, rangeEnd + 1).map((item) => item.value);
  };

  const handleDownload = () => {
    setError(null);
    setSuccess(null);

    const parsedYear = parseYear(year);
    if (!parsedYear) {
      setError("Enter a valid year between 2000 and 2100.");
      return;
    }

    if (mode === "single") {
      const content = buildSlipText({
        employeeName: resolvedName,
        employeeId: resolvedId,
        department: resolvedDepartment,
        month,
        year: parsedYear,
      });
      const fileName = `salary-slip-${resolvedId}-${parsedYear}-${month}.txt`;
      downloadFile(fileName, content);
      setSuccess(`Downloaded salary slip for ${formatMonthLabel(month)} ${parsedYear}.`);
      return;
    }

    const range = getMonthRange(startMonth, endMonth);
    if (range.length === 0) {
      setError("Select a valid month range.");
      return;
    }

    range.forEach((rangeMonth) => {
      const content = buildSlipText({
        employeeName: resolvedName,
        employeeId: resolvedId,
        department: resolvedDepartment,
        month: rangeMonth,
        year: parsedYear,
      });
      const fileName = `salary-slip-${resolvedId}-${parsedYear}-${rangeMonth}.txt`;
      downloadFile(fileName, content);
    });

    setSuccess(`Downloaded ${range.length} salary slip(s) for ${parsedYear}.`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Salary Slip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="slip-mode">Slip Type</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as "single" | "multiple")}>
            <SelectTrigger id="slip-mode">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single month</SelectItem>
              <SelectItem value="multiple">Multiple months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "single" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[initialYear - 1, initialYear, initialYear + 1].map((itemYear) => (
                    <SelectItem key={itemYear} value={String(itemYear)}>
                      {itemYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-month">Start Month</Label>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger id="start-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-month">End Month</Label>
                <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger id="end-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-range">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year-range">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[initialYear - 1, initialYear, initialYear + 1].map((itemYear) => (
                    <SelectItem key={itemYear} value={String(itemYear)}>
                      {itemYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Salary Slip
        </Button>
      </CardFooter>
    </Card>
  );
}
