import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import LinearProgress from "@mui/joy/LinearProgress";

export default function LoadingModal({ open, message = "Memproses data..." }) {
  return (
    <Modal
      open={open}
      // onClose dikosongkan agar pengguna tidak bisa menutup modal dengan mengeklik area luar
      onClose={() => {}}
    >
      <ModalDialog
        variant="outlined"
        className="animate-in zoom-in-95 duration-200 outline-none"
        sx={{
          maxWidth: 320,
          width: "100%",
          borderRadius: "xl",
          p: 4,
          boxShadow: "lg",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography
          level="title-md"
          fontWeight="bold"
          textAlign="center"
          textColor="neutral.700"
        >
          {message}
        </Typography>

        {/* Progress Bar animasi dari Joy UI */}
        <LinearProgress
          color="primary"
          size="md"
          sx={{ width: "100%", borderRadius: "full" }}
        />

        <Typography
          level="body-xs"
          textColor="text.tertiary"
          textAlign="center"
        >
          Mohon tunggu sebentar, jangan tutup halaman ini.
        </Typography>
      </ModalDialog>
    </Modal>
  );
}
