import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Shield, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FileUploadRestrictionsProps {
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "destructive" | "warning";
}

export function FileUploadRestrictions({
  className = "",
  showIcon = true,
  variant = "default"
}: FileUploadRestrictionsProps) {
  const { t } = useLanguage();

  const restrictions = [
    "Maximum file size: 5MB",
    "Accepted formats: JPEG, PNG, GIF, PDF",
    "Files are scanned for security",
    "Only secure file types allowed"
  ];

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200";
      default:
        return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={`${getVariantStyles()} ${className}`}>
      {showIcon && (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">File Upload Security</span>
        </div>
      )}
      <AlertDescription className="mt-2">
        <div className="space-y-1 text-sm">
          <p className="font-medium mb-2">For your security, uploaded files must meet these requirements:</p>
          <ul className="space-y-1 ml-4">
            {restrictions.map((restriction, index) => (
              <li key={index} className="flex items-start gap-2">
                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{restriction}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2 opacity-75">
            These restrictions help protect against malicious files and ensure system security.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}