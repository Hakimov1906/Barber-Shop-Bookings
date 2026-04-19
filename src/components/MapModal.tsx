import { X } from "lucide-react";

const MapModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Наши салоны на карте</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <iframe
            src="https://www.google.com/maps?q=barbershop&output=embed"
            className="w-full h-[400px] rounded-lg"
            loading="lazy"
            title="Наши салоны на карте"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/75"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
