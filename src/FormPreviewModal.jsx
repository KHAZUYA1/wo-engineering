import React, { useEffect, useRef, useState } from "react";
import { X, Printer, Download, PenTool, Eraser } from "lucide-react";

function TickBox({ checked }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center w-5 h-4 border border-black bg-white text-[10px] font-bold leading-none align-middle"
    >
      {checked ? "V" : ""}
    </span>
  );
}

// Kotak TTD yang mendukung TTD Manual (kosong saat cetak) & TTD Elektronik (canvas gambar)
function SignatureSlot({
  slotKey,
  esignEnabled,
  signatureData,
  onChangeSignature,
  className = "h-14",
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(60, Math.floor(rect.width || 120));
    const h = Math.max(36, Math.floor(rect.height || 56));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = signatureData;
    }
  }, [signatureData, esignEnabled]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    if (!esignEnabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    lastPosRef.current = getPoint(e);
  };

  const moveDraw = (e) => {
    if (!esignEnabled || !drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pt = getPoint(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPosRef.current = pt;
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChangeSignature(slotKey, canvas.toDataURL("image/png"));
  };

  return (
    <div className={`relative w-full ${className} select-none`}>
      {esignEnabled ? (
        <>
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
            className="w-full h-full touch-none cursor-crosshair bg-sky-50/40 print:bg-transparent"
          />
          {signatureData && (
            <button
              type="button"
              onClick={() => onChangeSignature(slotKey, "")}
              className="no-print absolute top-0.5 right-0.5 px-1.5 py-0.5 text-[9px] rounded bg-white/90 hover:bg-rose-50 text-rose-700 border border-slate-300 cursor-pointer"
              title="Hapus TTD ini"
            >
              Hapus
            </button>
          )}
        </>
      ) : signatureData ? (
        <img
          src={signatureData}
          alt="TTD Elektronik"
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : null}
    </div>
  );
}

export default function FormPreviewModal({ ticket, settings, onClose }) {
  const [esignEnabled, setEsignEnabled] = useState(false);
  const [signatures, setSignatures] = useState({});
  const [signedBy, setSignedBy] = useState(
    ticket.divisionHeadSignedBy ||
      ticket.reqGm ||
      ticket.reqManager ||
      ticket.reqChief ||
      ticket.reqSupervisor ||
      "",
  );

  const docNumber = settings?.docNumber || "FM-IT-SOP-01-01";
  const companyName = settings?.companyName || "PT. Sino Indah Jaya";
  const issueDate = settings?.docIssueDate || "01 Desember 2025";
  const revision = settings?.docRevision || "01";
  const pageLabel = settings?.docPage || "1 dari 1";
  const presidentDirector =
    settings?.presidentDirectorName || "Mr. KANG BYOUNGHA";

  const handleSignatureChange = (slotKey, dataUrl) => {
    setSignatures((prev) => {
      const next = { ...prev };
      if (dataUrl) {
        next[slotKey] = dataUrl;
      } else {
        delete next[slotKey];
      }
      return next;
    });
  };

  const clearAllSignatures = () => {
    setSignatures({});
  };

  const manPowerRows = Array.from({ length: 7 }, (_, idx) => {
    const item = Array.isArray(ticket.manPowerLogs)
      ? ticket.manPowerLogs[idx]
      : null;
    return (
      item || {
        name: "",
        nip: "",
        date: "",
        startTime: "",
        endTime: "",
        total: "",
        sign: "",
      }
    );
  });

  const materialRows = Array.from({ length: 10 }, (_, idx) => {
    const item = Array.isArray(ticket.materialLogs)
      ? ticket.materialLogs[idx]
      : null;
    return (
      item || {
        name: "",
        qty: "",
        unit: "",
        description: "",
        remark: "",
        whSign: "",
      }
    );
  });

  const handlePrintOrSavePdf = () => {
    window.print();
  };

  const hasAnySignature = Object.keys(signatures).length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-5 print:p-0 print:bg-white print:static print:block">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm;
          }
          body * {
            visibility: hidden;
          }
          .wo-print-root, .wo-print-root * {
            visibility: visible;
          }
          .wo-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .wo-sheet {
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            padding: 5px !important;
            font-size: 9.5px !important;
          }
        }
      `}</style>

      <div className="wo-print-root m-auto bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:shadow-none">
        {/* Toolbar Preview */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
                {docNumber}
              </span>
              <h3 className="text-sm sm:text-base font-bold">
                Preview &amp; Cetak Form — {ticket.id}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Mendukung <strong>TTD Manual</strong> (kosong untuk tanda tangan cetak) dan{" "}
              <strong>TTD Elektronik</strong> (gambar langsung di kotak TTD).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setEsignEnabled((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition ${
                esignEnabled
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-white/10 hover:bg-white/20 text-teal-200 border-white/15"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              {esignEnabled ? "Mode TTD Elektronik: Aktif" : "TTD Elektronik"}
            </button>

            {hasAnySignature && (
              <button
                type="button"
                onClick={clearAllSignatures}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                Reset TTD
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Form
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input catatan tambahan approval sebelum cetak */}
        <div className="no-print bg-teal-50/70 border-b border-teal-200 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-teal-950 font-medium">
            {esignEnabled
              ? "Klik & seret mouse / jari / stylus di dalam kotak TTD untuk membubuhkan TTD Elektronik."
              : "Mode TTD Manual aktif: kotak TTD kosong siap ditandatangani secara manual (atau aktifkan TTD Elektronik)."}
          </span>
          <input
            type="text"
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            className="px-3 py-1 rounded-lg border border-teal-300 bg-white text-slate-800 text-xs w-full sm:w-72"
            placeholder="Catatan tambahan (opsional)"
          />
        </div>

        {/* Lembar Form Standar */}
        <div className="p-3 sm:p-6 overflow-x-auto bg-slate-100/70 print:bg-white print:p-0">
          <div className="wo-sheet min-w-[780px] bg-white text-black border-2 border-black p-2.5 text-[10.5px] leading-tight">
            {/* Kop Atas Standar */}
            <table className="w-full border-collapse border border-black mb-2">
              <tbody>
                <tr>
                  <td
                    rowSpan={3}
                    className="border border-black px-2 py-1.5 text-center align-middle w-[22%]"
                  >
                    {settings?.brandSymbol === "custom" &&
                    settings?.customLogoDataUrl ? (
                      <img
                        src={settings.customLogoDataUrl}
                        alt={companyName}
                        className="max-h-11 mx-auto object-contain mb-1"
                      />
                    ) : (
                      <div className="font-extrabold text-sm tracking-tight text-slate-900 mb-0.5">
                        {companyName}
                      </div>
                    )}
                    <div className="text-[10px] font-bold">{companyName}</div>
                  </td>
                  <td className="border border-black px-2 py-1 font-bold text-center text-xs w-[48%]">
                    FORMULIR/양식
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-semibold w-[14%]">
                    No. Dokumen
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-bold w-[16%]">
                    : {docNumber}
                  </td>
                </tr>
                <tr>
                  <td
                    rowSpan={2}
                    className="border border-black px-2 py-1.5 font-bold text-center text-xs sm:text-sm align-middle"
                  >
                    SURAT PERMINTAAN PEKERJAAN/작업 의뢰서
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-semibold">
                    Tanggal Terbit
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px]">
                    : {issueDate}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-semibold">
                    No. Revisi
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px]">
                    : {revision}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-mono font-bold">
                    No. Form: {ticket.id}
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px] text-right pr-3">
                    Kategori: <strong>{ticket.category}</strong> · Lokasi:{" "}
                    <strong>{ticket.lineLocation || "-"}</strong>
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px] font-semibold">
                    Halaman
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[10px]">
                    : {pageLabel}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Identitas Pemohon & Jenis Pekerjaan */}
            <div className="grid grid-cols-12 gap-2 mb-2 items-start">
              <div className="col-span-6">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="py-0.5 font-semibold w-[36%]">
                        Name/성명
                      </td>
                      <td className="py-0.5">: {ticket.requesterName || ""}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">NIP/사번</td>
                      <td className="py-0.5">: {ticket.requesterNip || ""}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">
                        Departement/부서
                      </td>
                      <td className="py-0.5 font-semibold">
                        : {ticket.department || ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">
                        Section과 / 섹션
                      </td>
                      <td className="py-0.5">
                        : {ticket.section || ticket.lineLocation || ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">
                        Request Date/신청일
                      </td>
                      <td className="py-0.5">
                        : {ticket.requestDate || ticket.createdAt || ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-span-6">
                <div className="border border-black text-center font-bold text-[10px] py-0.5 mb-1">
                  Jenis Pekerjaan/작업 유형
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-[10%] py-0.5 text-center">
                        <TickBox checked={ticket.jobType === "Repair"} />
                      </td>
                      <td className="py-0.5 pl-2 font-medium">Repair/수리</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-center">
                        <TickBox
                          checked={ticket.jobType === "Remove & Install"}
                        />
                      </td>
                      <td className="py-0.5 pl-2 font-medium">
                        Remove &amp; Install/제거 및 설치
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-center">
                        <TickBox checked={ticket.jobType === "Service"} />
                      </td>
                      <td className="py-0.5 pl-2 font-medium">
                        Service/서비스 / 점검
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-center">
                        <TickBox checked={ticket.jobType === "Trouble"} />
                      </td>
                      <td className="py-0.5 pl-2 font-medium">
                        Trouble/장애 / 문제
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blok Persetujuan Departement yang Meminta: TTD Manual / Elektronik + Nama di bawah */}
            <div className="text-[10px] font-semibold mb-0.5">
              Departement yang meminta :/요청 부서 :
            </div>
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr className="bg-emerald-100/80 text-[10px]">
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    Request By/요청자
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    SUPERVISOR
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    CHIEF
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    MANAGER
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    GM
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[
                    "req_by",
                    "req_spv",
                    "req_chief",
                    "req_mgr",
                    "req_gm",
                  ].map((key) => (
                    <td key={key} className="border border-black p-0.5">
                      <SignatureSlot
                        slotKey={key}
                        esignEnabled={esignEnabled}
                        signatureData={signatures[key]}
                        onChangeSignature={handleSignatureChange}
                        className="h-14"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="h-5 text-[9.5px] font-medium text-center">
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.requesterName || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.reqSupervisor || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.reqChief || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.reqManager || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.reqGm || ""}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Blok Persetujuan Departement yang Mengerjakan: TTD Manual / Elektronik + Nama di bawah */}
            <div className="text-[10px] font-semibold mb-0.5">
              Departement yang mengerjalan : /작업 부서 :
            </div>
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr className="bg-emerald-100/80 text-[10px]">
                  <th className="border border-black px-1.5 py-1 w-[18%]">
                    Admin
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    SUPERVISOR
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[20%]">
                    CHIEF
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[21%]">
                    MANAGER HRD
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[21%]">
                    PRESIDENT DIRECTOR
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[
                    "eng_admin",
                    "eng_spv",
                    "eng_chief",
                    "eng_hrd",
                    "eng_presdir",
                  ].map((key) => (
                    <td key={key} className="border border-black p-0.5">
                      <SignatureSlot
                        slotKey={key}
                        esignEnabled={esignEnabled}
                        signatureData={signatures[key]}
                        onChangeSignature={handleSignatureChange}
                        className="h-14"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="h-5 text-[9.5px] font-medium text-center">
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.engAdmin || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.engSupervisor || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.engChief || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5">
                    {ticket.engManagerHrd || ""}
                  </td>
                  <td className="border border-black px-1.5 py-0.5 font-semibold">
                    {presidentDirector}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Description / Photo / Layout & Uraian Pekerjaan */}
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr className="text-[10px]">
                  <th className="border border-black px-2 py-1 w-[50%]">
                    Description/Photo/Layout/설명 / 사진 / 배치도
                  </th>
                  <th className="border border-black px-2 py-1 w-[50%]">
                    Uraian Pekerjaan/작업 내용 설명
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-24 align-top text-[10px]">
                  <td className="border border-black p-2">
                    {ticket.photoDataUrl ? (
                      <img
                        src={ticket.photoDataUrl}
                        alt="Lampiran Foto / Layout"
                        className="max-h-20 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-slate-700">
                        {ticket.layoutNote || ""}
                      </div>
                    )}
                  </td>
                  <td className="border border-black p-2 whitespace-pre-wrap">
                    {ticket.description || ""}
                    {signedBy ? (
                      <div className="text-[9.5px] text-slate-700 mt-1">
                        Catatan: {signedBy}
                      </div>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Diisi Oleh Penerima */}
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr>
                  <th
                    colSpan={4}
                    className="border border-black bg-emerald-100/80 px-2 py-1 font-bold text-center text-[10px]"
                  >
                    Diisi Oleh Penerima/수신자 작성란
                  </th>
                </tr>
              </thead>
              <tbody className="text-[10px]">
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold w-[22%]">
                    Tanggal Terima/접수일
                  </td>
                  <td className="border border-black px-2 py-1 w-[28%]">
                    : {ticket.receivedDate || ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-semibold w-[22%]">
                    Waktu / 시간
                  </td>
                  <td className="border border-black px-2 py-1 w-[28%]">
                    : {ticket.receivedTime || ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Nama Penerima/수신자 성명
                  </td>
                  <td className="border border-black px-2 py-1">
                    : {ticket.receiverName || ticket.assignedPic || ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Pelaksana / 작업자
                  </td>
                  <td className="border border-black px-2 py-1">
                    <span className="mr-3">
                      <TickBox
                        checked={ticket.executorType === "Team Engineer"}
                      />{" "}
                      Team Engineer
                    </span>
                    <span>
                      <TickBox checked={ticket.executorType === "Vendor"} />{" "}
                      Vendor
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabel Man Power */}
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr>
                  <th
                    colSpan={8}
                    className="border border-black px-2 py-1 font-bold text-center text-[10px]"
                  >
                    Man Power Team Engineer / 엔지니어 투입 인원
                  </th>
                </tr>
                <tr className="text-[10px]">
                  <th className="border border-black px-1.5 py-1 w-[5%]">No</th>
                  <th className="border border-black px-1.5 py-1 w-[21%]">
                    Nama / 성명
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[13%]">
                    NIP / 사번
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[14%]">
                    Tanggal / 일자
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[11%]">
                    Mulai
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[11%]">
                    Selesai
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[12%]">
                    Total Jam
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[15%]">
                    Paraf / 서명
                  </th>
                </tr>
              </thead>
              <tbody>
                {manPowerRows.map((row, idx) => (
                  <tr key={idx} className="h-5 text-[10px]">
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {row.name || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {row.nip || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {row.date || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {row.startTime || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {row.endTime || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {row.total || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {row.sign || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tabel Material yang Terpakai */}
            <table className="w-full border-collapse border border-black mb-2">
              <thead>
                <tr>
                  <th
                    colSpan={7}
                    className="border border-black px-2 py-1 font-bold text-center text-[10px]"
                  >
                    Material yang terpakai/사용 자재 / 소모품
                  </th>
                </tr>
                <tr className="text-[10px]">
                  <th className="border border-black px-1.5 py-1 w-[7%]">
                    No/번호
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[19%]">
                    Material/자재명
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[9%]">
                    Qty/수량
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[9%]">
                    Unit/단위
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[24%]">
                    Description/설명
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[18%]">
                    Remark/비고
                  </th>
                  <th className="border border-black px-1.5 py-1 w-[14%]">
                    Paraf Warehouse/창고 확인 서명
                  </th>
                </tr>
              </thead>
              <tbody>
                {materialRows.map((mat, idx) => (
                  <tr key={idx} className="h-5 text-[10px]">
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {mat.name || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {mat.qty || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center">
                      {mat.unit || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {mat.description || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {mat.remark || ""}
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      {mat.whSign || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Blok Khusus Dikerjakan Oleh Team Vendor + Ruang TTD Manual / Elektronik */}
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr>
                  <td
                    colSpan={3}
                    className="border border-black px-2 py-1 font-bold text-center text-[10.5px]"
                  >
                    Diisi Apabila Dikerjakan Oleh Team Vendor/외부 업체(벤더)가
                    작업한 경우 작성
                  </td>
                </tr>
                <tr>
                  {[
                    { key: "vendor_sec", w: "w-[33.33%]" },
                    { key: "vendor_proj", w: "w-[33.33%]" },
                    { key: "vendor_pic", w: "w-[33.34%]" },
                  ].map((item) => (
                    <td
                      key={item.key}
                      className={`border border-black p-1 ${item.w}`}
                    >
                      <SignatureSlot
                        slotKey={item.key}
                        esignEnabled={esignEnabled}
                        signatureData={signatures[item.key]}
                        onChangeSignature={handleSignatureChange}
                        className="h-24"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="text-[10.5px] font-semibold text-center">
                  <td className="border border-black px-2 py-1">
                    Section Head
                    {ticket.vendorSectionHead
                      ? ` (${ticket.vendorSectionHead})`
                      : ""}
                  </td>
                  <td className="border border-black px-2 py-1">
                    Project Section head
                    {ticket.vendorProjectHead
                      ? ` (${ticket.vendorProjectHead})`
                      : ""}
                  </td>
                  <td className="border border-black px-2 py-1">
                    Vendor
                    {ticket.vendorName ? ` (${ticket.vendorName})` : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}