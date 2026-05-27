import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  color = "danger", // default warna merah
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        className="animate-in zoom-in-95 dark:border-borderDark! duration-200 dark:bg-darkMode!"
        sx={{ maxWidth: 400, borderRadius: "md", p: 3, boxShadow: "lg" }}
      >
        <Typography
          level="h2"
          fontSize="lg"
          fontWeight="bold"
          startDecorator={
            <AlertTriangle
              className={color === "danger" ? "text-red-500" : "text-blue-500"}
              size={24}
            />
          }
          mb={1}
        >
          {title}
        </Typography>

        <Typography textColor="text.tertiary" fontSize="sm" sx={{ mb: 3 }}>
          {message}
        </Typography>

        <div className="flex justify-end gap-3 mt-2">
          <Button
            variant="plain"
            color="neutral"
            onClick={onClose}
            className="font-bold dark:text-fontDark! dark:hover:text-darkMode!"
          >
            {cancelText}
          </Button>
          <Button
            variant="solid"
            color={color}
            onClick={onConfirm}
            className="font-bold shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  );
}
