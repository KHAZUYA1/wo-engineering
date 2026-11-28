import React, { useEffect, useState } from "react";
import { X, Upload, Trash2, Image as ImageIcon } from "lucide-react";

export async function compressImageToDataUrl(
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = {},
) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("File yang dipilih harus berupa gambar.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Gagal memuat gambar."));
      el.src = objectUrl;
    });

    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function estimateDataUrlSizeKb(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return 0;
  const base64Part = dataUrl.split(",")[1] || "";
  const bytes = Math.round((base64Part.length * 3) / 4);
  return Math.max(1, Math.round(bytes / 1024));
}

const emptyForm = {
  requesterName: "",
  requesterNip: "",
  department: "",
  section: "",
  lineLocation: "",
  category: "Umum",
  jobType: "Repair",
  executorType: "Team Engineer",
  receiverName: "",
  receivedDate: "",
  description: "",
  layoutNote: "",
  photoDataUrl: "",
};

export default function TicketFormModal({
  initialTicket = null,
  onSave,
  onClose,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (initialTicket) {
      setFormData({ ...emptyForm, ...initialTicket });
    } else {
      setFormData(emptyForm);
    }
  }, [initialTicket]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageToDataUrl(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
      });

      setFormData((prev) => ({
        ...prev,
        photoDataUrl: compressedDataUrl,
      }));
    } catch (err) {
      console.error("Gagal mengompresi gambar:", err);
      alert(err?.message || "Gagal memproses gambar.");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photoDataUrl: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCompressing) return;
    onSave?.({
      ...formData,
      requestDate:
        formData.requestDate ||
        new Date().toISOString().slice(0, 16).replace("T", " "),
    });
  };

  const photoSizeKb = estimateDataUrlSizeKb(formData.photoDataUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold">
            {initialTicket
              ? `Edit Form — ${initialTicket.id}`
              : "Buat Form Work Order"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Name / 성명
              </label>
              <input
                type="text"
                value={formData.requesterName}
                onChange={(e) =>
                  handleFieldChange("requesterName", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP / 사번
              </label>
              <input
                type="text"
                value={formData.requesterNip}
                onChange={(e) =>
                  handleFieldChange("requesterNip", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Departement / 부서
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleFieldChange("department", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Section / Lokasi
              </label>
              <input
                type="text"
                value={formData.lineLocation}
                onChange={(e) => {
                  handleFieldChange("lineLocation", e.target.value);
                  handleFieldChange("section", e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Pekerjaan
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => handleFieldChange("jobType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Repair">Repair / 수리</option>
                <option value="Service">Service / 서비스 / 점검</option>
                <option value="Remove & Install">
                  Remove &amp; Install / 제거 및 설치
                </option>
                <option value="Trouble">Trouble / 장애 / 문제</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pelaksana
              </label>
              <select
                value={formData.executorType}
                onChange={(e) =>
                  handleFieldChange("executorType", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Team Engineer">Team Engineer</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Uraian Pekerjaan
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Jelaskan detail pekerjaan atau perbaikan..."
            />
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-700" />
                  Foto / Layout (Auto-Compress)
                </div>
                <p className="text-[11px] text-slate-500">
                  Otomatis diperkecil (maks. 1200px) &amp; dikompresi JPEG agar
                  hemat kuota.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {isCompressing ? "Mengompresi..." : "Pilih Gambar"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isCompressing}
                    className="hidden"
                  />
                </label>

                {formData.photoDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {formData.photoDataUrl ? (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                <img
                  src={formData.photoDataUrl}
                  alt="Preview Lampiran"
                  className="h-16 w-24 object-contain rounded border border-slate-100 bg-slate-50"
                />
                <div className="text-[11px] text-slate-600">
                  <div className="font-semibold text-emerald-700">
                    Gambar siap (sudah terkompresi)
                  </div>
                  <div>Estimasi ukuran: ~{photoSizeKb} KB</div>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={formData.layoutNote}
                onChange={(e) => handleFieldChange("layoutNote", e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                placeholder="Catatan layout / lokasi (opsional jika tidak ada foto)"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold cursor-pointer"
            >
              {isCompressing ? "Menunggu Kompresi..." : "Simpan Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}