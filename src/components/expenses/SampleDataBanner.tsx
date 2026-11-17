import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useExpenses } from "@/lib/expenses/store";

export function RemoveSampleButton({ variant = "outline" }: { variant?: "outline" | "secondary" }) {
  const { removeSampleData, expenses } = useExpenses();
  const count = expenses.filter((e) => e.isSample).length;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm">Remove sample data</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove sample expenses?</AlertDialogTitle>
          <AlertDialogDescription>
            {count} sample transactions will be deleted. Expenses you added yourself are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants()}
            onClick={() => {
              removeSampleData();
              toast.success("Sample data removed");
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SampleDataBanner() {
  const { hasSampleData } = useExpenses();
  if (!hasSampleData) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border-2 border-outline bg-warning-soft p-4 shadow-pop sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
        <div className="text-sm text-warning-foreground">
          <p className="font-semibold">You're looking at sample expenses</p>
          <p className="opacity-90">They're marked “Sample” so you can explore. Remove them whenever you're ready to start fresh.</p>
        </div>
      </div>
      <RemoveSampleButton />
    </div>
  );
}
