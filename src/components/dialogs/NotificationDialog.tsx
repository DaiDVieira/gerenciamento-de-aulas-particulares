import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentNames: string[];
  date: string;
  time: string;
}

export const NotificationDialog = ({
  open,
  onOpenChange,
  studentNames,
  date,
  time,
}: NotificationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            Notificação Enviada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-base">
            Mensagem de notificação enviada via WhatsApp para o(s) responsável(is) do(s) aluno(s):
            <div className="mt-3 space-y-1">
              {studentNames.map((name, index) => (
                <div key={index} className="font-medium text-foreground">
                  • {name}
                </div>
              ))}
            </div>
            <div className="mt-3">
              Aula agendada para: <span className="font-medium text-foreground">{date}</span> às{" "}
              <span className="font-medium text-foreground">{time}</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#2d5f4a] hover:bg-[#2d5f4a]/90"
          >
            Ok
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
