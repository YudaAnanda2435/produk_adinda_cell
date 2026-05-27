import { useState } from "react";
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
  confirmPhrase = "",
  confirmPhraseLabel = "",
}) {
  const [typedPhrase, setTypedPhrase] = useState("");
  const needsTypedConfirm = Boolean(confirmPhrase);
  const isConfirmDisabled =
    needsTypedConfirm &&
    typedPhrase.trim().toLowerCase() !== confirmPhrase.toLowerCase();

  const handleClose = () => {
    setTypedPhrase("");
    onClose();
  };

  const handleConfirm = () => {
    setTypedPhrase("");
    onConfirm();
  };

  return (
    <Modal open={open} onClose={handleClose}>
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

        {needsTypedConfirm && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-300">
              {confirmPhraseLabel || `Ketik "${confirmPhrase}" untuk konfirmasi`}
            </label>
            <input
              value={typedPhrase}
              onChange={(event) => setTypedPhrase(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-borderDark dark:bg-cardDark dark:text-fontDark"
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button
            variant="plain"
            color="neutral"
            onClick={handleClose}
            className="font-bold dark:text-fontDark! dark:hover:text-darkMode!"
          >
            {cancelText}
          </Button>
          <Button
            variant="solid"
            color={color}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="font-bold shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  );
}
