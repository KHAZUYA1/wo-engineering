import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Printer,
  Download,
  PenTool,
  Eraser,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function TickBox({ checked }) {
  return (
    <span
      aria-hidden="true"
      className="wo-tickbox inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white align-middle shrink-0"
      style={{ lineHeight: 0 }}
    >
      {checked ? (
        <svg
          viewBox="0 0 12 12"
          className="w-2.5 h-2.5 text-black block"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2.2 6.4 4.8 9 9.8 3.2" />
        </svg>
      ) : null}
    </span>
  );
}

function SignatureSlot({
  slotKey,
  esignEnabled,
  signatureData,
  onChangeSignature,
  className = "h-12",
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
    const h = Math.max(32, Math.floor(rect.height || 48));

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
            className="w-full h-full touch-none cursor-crosshair bg-sky-50/40 no-print"
          />
          {signatureData && (
            <>
              <img
                src={signatureData}
                alt="TTD Elektronik"
                className="hidden print:block w-full h-full object-contain pointer-events-none"
              />
              <button
                type="button"
                onClick={() => onChangeSignature(slotKey, "")}
                className="no-print absolute top-0.5 right-0.5 px-1.5 py-0.5 text-[9px] rounded bg-white/90 hover:bg-rose-50 text-rose-700 border border-slate-300 cursor-pointer"
                title="Hapus TTD ini"
              >
                Hapus
              </button>
            </>
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

function addBase64ImageToExcel(
  wb,
  ws,
  dataUrl,
  col,
  row,
  boxWidthPx,
  boxHeightPx,
  offsetXRatio = 0.2,
  offsetYRatio = 0.12,
) {
  if (
    !dataUrl ||
    typeof dataUrl !== "string" ||
    !dataUrl.startsWith("data:image/")
  ) {
    return;
  }
  const match = dataUrl.match(
    /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i,
  );
  if (!match) return;

  const ext =
    match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const imageId = wb.addImage({
    base64: match[2],
    extension: ext === "webp" ? "png" : ext,
  });

  ws.addImage(imageId, {
    tl: { col: col - 1 + offsetXRatio, row: row - 1 + offsetYRatio },
    ext: {
      width: Math.max(24, boxWidthPx),
      height: Math.max(18, boxHeightPx),
    },
    editAs: "oneCell",
  });
}

export default function FormPreviewModal({ ticket, settings, onClose }) {
  const [esignEnabled, setEsignEnabled] = useState(false);
  const [signatures, setSignatures] = useState({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [signedBy, setSignedBy] = useState(
    ticket.divisionHeadSignedBy ||
      ticket.reqGm ||
      ticket.reqManager ||
      ticket.reqChief ||
      ticket.reqSupervisor ||
      "",
  );
  const printAreaRef = useRef(null);

  const docNumber = settings?.docNumber || "FM-IT-SOP-01-01";
  const companyName = settings?.companyName || "PT SINO INDAH JAYA";
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

  const manPowerRows = Array.from({ length: 5 }, (_, idx) => {
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

  const materialRows = Array.from({ length: 6 }, (_, idx) => {
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

  // 1. DOWNLOAD EXCEL (.xlsx) SIMPLE, RAPI & MEMPERTAHANKAN ATURAN TTD
  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Work Order", {
        views: [{ showGridLines: true }],
        pageSetup: {
          paperSize: 9,
          orientation: "portrait",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: {
            left: 0.25,
            right: 0.25,
            top: 0.25,
            bottom: 0.25,
            header: 0.1,
            footer: 0.1,
          },
        },
      });

      ws.columns = [
        { width: 12 },
        { width: 20 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 18 },
        { width: 20 },
      ];

      const thinBorder = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      const softGreenFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" },
      };

      const softSlateFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };

      const styleRange = (r1, c1, r2, c2, opts = {}) => {
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            const cell = ws.getCell(r, c);
            cell.border = thinBorder;
            cell.font = {
              name: "Arial",
              size: opts.fontSize || 9.5,
              bold: Boolean(opts.bold),
              color: { argb: "FF000000" },
            };
            cell.alignment = {
              vertical: opts.vertical || "middle",
              horizontal: opts.horizontal || "left",
              wrapText: opts.wrapText !== false,
            };
            if (opts.fill) {
              cell.fill = opts.fill;
            }
          }
        }
      };

      // --- 1. KOP STANDAR IATF (TETAP SAMA) ---
      const hasCustomLogo =
        settings?.brandSymbol === "custom" && settings?.customLogoDataUrl;

      ws.mergeCells("A1:B3");
      ws.getCell("A1").value = hasCustomLogo ? `\n\n${companyName}` : companyName;
      styleRange(1, 1, 3, 2, {
        bold: true,
        fontSize: 10,
        horizontal: "center",
        vertical: hasCustomLogo ? "bottom" : "middle",
      });
      if (hasCustomLogo) {
        addBase64ImageToExcel(
          wb,
          ws,
          settings.customLogoDataUrl,
          1,
          1,
          100,
          30,
          0.35,
          0.1,
        );
      }

      ws.mergeCells("C1:F1");
      ws.getCell("C1").value = "FORMULIR/양식";
      styleRange(1, 3, 1, 6, { bold: true, fontSize: 10, horizontal: "center" });

      ws.getCell("G1").value = "No. Dokumen";
      ws.getCell("H1").value = `: ${docNumber}`;
      styleRange(1, 7, 1, 8, { bold: true, fontSize: 9 });

      ws.mergeCells("C2:F3");
      ws.getCell("C2").value = "SURAT PERMINTAAN PEKERJAAN/작업 의뢰서";
      styleRange(2, 3, 3, 6, {
        bold: true,
        fontSize: 11,
        horizontal: "center",
        vertical: "middle",
      });

      ws.getCell("G2").value = "Tanggal Terbit";
      ws.getCell("H2").value = `: ${issueDate}`;
      styleRange(2, 7, 2, 8, { fontSize: 9 });

      ws.getCell("G3").value = "No. Revisi";
      ws.getCell("H3").value = `: ${revision}`;
      styleRange(3, 7, 3, 8, { fontSize: 9 });

      ws.mergeCells("A4:B4");
      ws.getCell("A4").value = `No. Form: ${ticket.id || ""}`;
      styleRange(4, 1, 4, 2, { bold: true, fontSize: 9 });

      ws.mergeCells("C4:F4");
      ws.getCell("C4").value =
        `Kategori: ${ticket.category || ""} · Lokasi: ${ticket.lineLocation || "-"}`;
      styleRange(4, 3, 4, 6, { fontSize: 9, horizontal: "right" });

      ws.getCell("G4").value = "Halaman";
      ws.getCell("H4").value = `: ${pageLabel}`;
      styleRange(4, 7, 4, 8, { fontSize: 9 });

      ws.getRow(1).height = 19;
      ws.getRow(2).height = 19;
      ws.getRow(3).height = 19;
      ws.getRow(4).height = 20;

      // --- 2. IDENTITAS PEMOHON & JENIS PEKERJAAN ---
      let r = 5;
      const identities = [
        ["Name/성명", ticket.requesterName || ""],
        ["NIP/사번", ticket.requesterNip || ""],
        ["Departement/부서", ticket.department || ""],
        ["Section과 / 섹션", ticket.section || ticket.lineLocation || ""],
        ["Request Date/신청일", ticket.requestDate || ticket.createdAt || ""],
      ];

      const jobTypes = [
        { label: "Repair/수리", key: "Repair" },
        { label: "Remove & Install/제거 및 설치", key: "Remove & Install" },
        { label: "Service/서비스 / 점검", key: "Service" },
        { label: "Trouble/장애 / 문제", key: "Trouble" },
      ];

      ws.mergeCells(r, 5, r, 8);
      ws.getCell(r, 5).value = "Jenis Pekerjaan/작업 유형";
      styleRange(r, 5, r, 8, {
        bold: true,
        horizontal: "center",
        fill: softSlateFill,
      });

      for (let i = 0; i < identities.length; i++) {
        const curRow = r + i;
        ws.mergeCells(curRow, 1, curRow, 2);
        ws.getCell(curRow, 1).value = identities[i][0];
        ws.mergeCells(curRow, 3, curRow, 4);
        ws.getCell(curRow, 3).value = `: ${identities[i][1]}`;
        styleRange(curRow, 1, curRow, 4, {
          bold: i === 2,
          fontSize: 9,
          vertical: "middle",
        });

        if (i < jobTypes.length) {
          const jtRow = curRow + 1;
          const checked = ticket.jobType === jobTypes[i].key ? "✓" : "";
          ws.getCell(jtRow, 5).value = checked;
          ws.mergeCells(jtRow, 6, jtRow, 8);
          ws.getCell(jtRow, 6).value = jobTypes[i].label;
          styleRange(jtRow, 5, jtRow, 8, { fontSize: 9 });
          ws.getCell(jtRow, 5).alignment = {
            vertical: "middle",
            horizontal: "center",
          };
          ws.getCell(jtRow, 5).font = { name: "Arial", size: 9, bold: true };
        }
        ws.getRow(curRow).height = 18;
      }
      ws.getRow(r + identities.length).height = 18;

      // --- 3. TTD YANG MEMINTA & YANG DIMINTA/MENGERJAKAN ---
      r = r + identities.length + 1;
      ws.mergeCells(r, 1, r, 8);
      ws.getCell(r, 1).value = "Departement yang meminta :/요청 부서 :";
      ws.getCell(r, 1).font = { name: "Arial", size: 9, bold: true };
      ws.getRow(r).height = 16;

      r += 1;
      const reqHeaders = [
        "Request By/요청자",
        "SUPERVISOR",
        "CHIEF",
        "MANAGER",
        "GM",
      ];
      const reqNames = [
        ticket.requesterName || "",
        ticket.reqSupervisor || "",
        ticket.reqChief || "",
        ticket.reqManager || "",
        ticket.reqGm || "",
      ];
      const reqSigKeys = ["req_by", "req_spv", "req_chief", "req_mgr", "req_gm"];
      const spans8 = [
        [1, 1],
        [2, 3],
        [4, 5],
        [6, 7],
        [8, 8],
      ];

      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        ws.getCell(r, s).value = reqHeaders[idx];
        styleRange(r, s, r, e, {
          bold: true,
          fontSize: 9,
          horizontal: "center",
          fill: softGreenFill,
        });
      });
      ws.getRow(r).height = 20;

      r += 1;
      const reqSigRow = r;
      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        styleRange(r, s, r, e, { horizontal: "center" });
        if (signatures[reqSigKeys[idx]]) {
          addBase64ImageToExcel(
            wb,
            ws,
            signatures[reqSigKeys[idx]],
            s,
            reqSigRow,
            100,
            38,
          );
        }
      });
      ws.getRow(r).height = 38;

      r += 1;
      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        ws.getCell(r, s).value = reqNames[idx];
        styleRange(r, s, r, e, { horizontal: "center", fontSize: 9 });
      });
      ws.getRow(r).height = 17;

      r += 1;
      ws.mergeCells(r, 1, r, 8);
      ws.getCell(r, 1).value = "Departement yang mengerjalan : /작업 부서 :";
      ws.getCell(r, 1).font = { name: "Arial", size: 9, bold: true };
      ws.getRow(r).height = 16;

      r += 1;
      const engHeaders = [
        "Admin",
        "SUPERVISOR",
        "CHIEF",
        "MANAGER HRD",
        "PRESIDENT DIRECTOR",
      ];
      const engNames = [
        ticket.engAdmin || "",
        ticket.engSupervisor || "",
        ticket.engChief || "",
        ticket.engManagerHrd || "",
        presidentDirector,
      ];
      const engSigKeys = [
        "eng_admin",
        "eng_spv",
        "eng_chief",
        "eng_hrd",
        "eng_presdir",
      ];

      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        ws.getCell(r, s).value = engHeaders[idx];
        styleRange(r, s, r, e, {
          bold: true,
          fontSize: 9,
          horizontal: "center",
          fill: softGreenFill,
        });
      });
      ws.getRow(r).height = 20;

      r += 1;
      const engSigRow = r;
      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        styleRange(r, s, r, e, { horizontal: "center" });
        if (signatures[engSigKeys[idx]]) {
          addBase64ImageToExcel(
            wb,
            ws,
            signatures[engSigKeys[idx]],
            s,
            engSigRow,
            100,
            38,
          );
        }
      });
      ws.getRow(r).height = 38;

      r += 1;
      spans8.forEach(([s, e], idx) => {
        if (s !== e) ws.mergeCells(r, s, r, e);
        ws.getCell(r, s).value = engNames[idx];
        styleRange(r, s, r, e, {
          horizontal: "center",
          fontSize: 9,
          bold: idx === 4,
        });
      });
      ws.getRow(r).height = 17;

      // --- 4. URAIAN PEKERJAAN, FOTO/LAYOUT & PENERIMA ---
      r += 1;
      ws.mergeCells(r, 1, r, 4);
      ws.getCell(r, 1).value = "Description/Photo/Layout/설명 / 사진 / 배치도";
      styleRange(r, 1, r, 4, {
        bold: true,
        fontSize: 9,
        horizontal: "center",
        fill: softSlateFill,
      });

      ws.mergeCells(r, 5, r, 8);
      ws.getCell(r, 5).value = "Uraian Pekerjaan & Penerima";
      styleRange(r, 5, r, 8, {
        bold: true,
        fontSize: 9,
        horizontal: "center",
        fill: softSlateFill,
      });
      ws.getRow(r).height = 18;

      r += 1;
      const detailRow = r;
      ws.mergeCells(detailRow, 1, detailRow, 4);
      ws.getCell(detailRow, 1).value = ticket.photoDataUrl
        ? ""
        : ticket.layoutNote || "";
      styleRange(detailRow, 1, detailRow, 4, { fontSize: 9, vertical: "top" });
      if (ticket.photoDataUrl) {
        addBase64ImageToExcel(
          wb,
          ws,
          ticket.photoDataUrl,
          1,
          detailRow,
          200,
          52,
        );
      }

      const execText =
        ticket.executorType === "Team Engineer"
          ? "[✓] Team Engineer   [ ] Vendor"
          : ticket.executorType === "Vendor"
            ? "[ ] Team Engineer   [✓] Vendor"
            : "[ ] Team Engineer   [ ] Vendor";
      const descText = [
        ticket.description || "",
        `Penerima: ${ticket.receiverName || ticket.assignedPic || "-"} | Tgl/Jam: ${ticket.receivedDate || "-"} ${ticket.receivedTime || ""}`,
        `Pelaksana: ${execText}`,
        signedBy ? `Catatan: ${signedBy}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      ws.mergeCells(detailRow, 5, detailRow, 8);
      ws.getCell(detailRow, 5).value = descText;
      styleRange(detailRow, 5, detailRow, 8, { fontSize: 9, vertical: "top" });
      ws.getRow(detailRow).height = 60;

      // --- 5A. MAN POWER ---
      r += 1;
      ws.mergeCells(r, 1, r, 8);
      ws.getCell(r, 1).value = "Man Power Team Engineer / 엔지니어 투입 인원";
      styleRange(r, 1, r, 8, {
        bold: true,
        fontSize: 9,
        horizontal: "center",
        fill: softSlateFill,
      });
      ws.getRow(r).height = 18;

      r += 1;
      const mpHeaders = [
        "No",
        "Nama / 성명",
        "NIP / 사번",
        "Tanggal / 일자",
        "Mulai",
        "Selesai",
        "Total Jam",
        "Paraf / 서명",
      ];
      mpHeaders.forEach((h, idx) => {
        ws.getCell(r, idx + 1).value = h;
      });
      styleRange(r, 1, r, 8, { bold: true, fontSize: 9, horizontal: "center" });
      ws.getRow(r).height = 18;

      manPowerRows.forEach((row, idx) => {
        r += 1;
        const vals = [
          idx + 1,
          row.name || "",
          row.nip || "",
          row.date || "",
          row.startTime || "",
          row.endTime || "",
          row.total || "",
          row.sign || "",
        ];
        vals.forEach((v, cIdx) => {
          ws.getCell(r, cIdx + 1).value = v;
        });
        styleRange(r, 1, r, 8, { fontSize: 9 });
        [1, 5, 6, 7, 8].forEach((colIdx) => {
          ws.getCell(r, colIdx).alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        });
        ws.getRow(r).height = 16;
      });

      // --- 5B. MATERIAL TERPAKAI ---
      r += 1;
      ws.mergeCells(r, 1, r, 8);
      ws.getCell(r, 1).value = "Material yang terpakai/사용 자재 / 소모품";
      styleRange(r, 1, r, 8, {
        bold: true,
        fontSize: 9,
        horizontal: "center",
        fill: softSlateFill,
      });
      ws.getRow(r).height = 18;

      r += 1;
      ws.getCell(r, 1).value = "No/번호";
      ws.getCell(r, 2).value = "Material/자재명";
      ws.getCell(r, 3).value = "Qty/수량";
      ws.getCell(r, 4).value = "Unit/단위";
      ws.mergeCells(r, 5, r, 6);
      ws.getCell(r, 5).value = "Description/설명";
      ws.getCell(r, 7).value = "Remark/비고";
      ws.getCell(r, 8).value = "Paraf Warehouse/창고 확인 서명";
      styleRange(r, 1, r, 8, {
        bold: true,
        fontSize: 8.5,
        horizontal: "center",
      });
      ws.getRow(r).height = 20;

      materialRows.forEach((mat, idx) => {
        r += 1;
        ws.getCell(r, 1).value = idx + 1;
        ws.getCell(r, 2).value = mat.name || "";
        ws.getCell(r, 3).value = mat.qty || "";
        ws.getCell(r, 4).value = mat.unit || "";
        ws.mergeCells(r, 5, r, 6);
        ws.getCell(r, 5).value = mat.description || "";
        ws.getCell(r, 7).value = mat.remark || "";
        ws.getCell(r, 8).value = mat.whSign || "";

        styleRange(r, 1, r, 8, { fontSize: 9 });
        [1, 3, 4, 8].forEach((colIdx) => {
          ws.getCell(r, colIdx).alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        });
        ws.getRow(r).height = 16;
      });

      // --- 6. BLOK APABILA DIKERJAKAN OLEH VENDOR ---
      r += 1;
      ws.mergeCells(r, 1, r, 8);
      ws.getCell(r, 1).value =
        "Diisi Apabila Dikerjakan Oleh Team Vendor/외부 업체(벤더)가 작업한 경우 작성";
      styleRange(r, 1, r, 8, {
        bold: true,
        fontSize: 9,
        horizontal: "center",
        fill: softGreenFill,
      });
      ws.getRow(r).height = 18;

      r += 1;
      const vendorSigRow = r;
      const vendorSpans = [
        { s: 1, e: 2, key: "vendor_sec" },
        { s: 3, e: 5, key: "vendor_proj" },
        { s: 6, e: 8, key: "vendor_pic" },
      ];
      vendorSpans.forEach(({ s, e, key }) => {
        ws.mergeCells(r, s, r, e);
        styleRange(r, s, r, e, { horizontal: "center" });
        if (signatures[key]) {
          addBase64ImageToExcel(
            wb,
            ws,
            signatures[key],
            s,
            vendorSigRow,
            120,
            40,
          );
        }
      });
      ws.getRow(r).height = 42;

      r += 1;
      const vendorLabels = [
        `Section Head${ticket.vendorSectionHead ? ` (${ticket.vendorSectionHead})` : ""}`,
        `Project Section head${ticket.vendorProjectHead ? ` (${ticket.vendorProjectHead})` : ""}`,
        `Vendor${ticket.vendorName ? ` (${ticket.vendorName})` : ""}`,
      ];
      vendorSpans.forEach(({ s, e }, idx) => {
        ws.mergeCells(r, s, r, e);
        ws.getCell(r, s).value = vendorLabels[idx];
        styleRange(r, s, r, e, { bold: true, fontSize: 9, horizontal: "center" });
      });
      ws.getRow(r).height = 17;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeId = String(ticket.id || "WO").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.href = url;
      a.download = `WO_${safeId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 2. DOWNLOAD PDF (.pdf) RAPI, PROPORSIONAL & CENTER ATAS-BAWAH KIRI-KANAN
  const handleDownloadPdfDirect = async () => {
    const sheetEl = printAreaRef.current;
    if (!sheetEl) return;

    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 120));

      const colorCtx = document.createElement("canvas").getContext("2d");
      const colorFnRegex =
        /(?:oklab|oklch|color-mix|lab|lch)\(\s*[^()]*(?:\([^()]*\)[^()]*)*\)/gi;

      const replaceModernColors = (cssText, fallback = "rgb(0, 0, 0)") => {
        if (typeof cssText !== "string") return cssText;
        return cssText.replace(colorFnRegex, (match) => {
          try {
            colorCtx.fillStyle = fallback;
            colorCtx.fillStyle = match;
            const res = colorCtx.fillStyle;
            return colorFnRegex.test(res) ? fallback : res;
          } catch {
            return fallback;
          }
        });
      };

      const canvas = await html2canvas(sheetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: (el) => el.classList?.contains("no-print"),
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll("style").forEach((styleTag) => {
            if (styleTag.textContent) {
              styleTag.textContent = replaceModernColors(
                styleTag.textContent,
                "rgb(0, 0, 0)",
              );
            }
          });

          clonedDoc
            .querySelectorAll("link[rel='stylesheet']")
            .forEach((linkTag) => {
              try {
                const sheet = Array.from(document.styleSheets).find(
                  (s) =>
                    s.href &&
                    linkTag.href &&
                    s.href.includes(linkTag.getAttribute("href")),
                );
                if (sheet && sheet.cssRules) {
                  const rulesText = Array.from(sheet.cssRules)
                    .map((rule) =>
                      replaceModernColors(rule.cssText, "rgb(0, 0, 0)"),
                    )
                    .join("\n");
                  const cleanStyle = clonedDoc.createElement("style");
                  cleanStyle.textContent = rulesText;
                  linkTag.replaceWith(cleanStyle);
                }
              } catch {
                // Abaikan stylesheet lintas origin
              }
            });

          clonedDoc.querySelectorAll("[style]").forEach((el) => {
            const rawStyle = el.getAttribute("style");
            if (rawStyle) {
              el.setAttribute(
                "style",
                replaceModernColors(rawStyle, "rgb(0, 0, 0)"),
              );
            }
          });

          const clonedSheet = clonedDoc.querySelector(".wo-sheet");
          if (clonedSheet) {
            clonedSheet.classList.remove("leading-tight");
            clonedSheet.style.width = "794px";
            clonedSheet.style.minWidth = "794px";
            clonedSheet.style.maxWidth = "794px";
            clonedSheet.style.margin = "0 auto";
            clonedSheet.style.backgroundColor = "#ffffff";
            clonedSheet.style.color = "#000000";
            clonedSheet.style.lineHeight = "1.35";

            clonedSheet.querySelectorAll(":scope > div").forEach((divEl) => {
              if (!divEl.querySelector("table")) {
                divEl.style.lineHeight = "1.35";
                divEl.style.paddingTop = "4px";
                divEl.style.paddingBottom = "4px";
                divEl.style.color = "#000000";
              }
            });

            clonedSheet.querySelectorAll("[class*='emerald']").forEach((hdr) => {
              hdr.style.backgroundColor = "#d1fae5";
              if (hdr.tagName === "TH" || hdr.tagName === "TD") {
                hdr.style.color = "#000000";
              }
            });

            clonedSheet.querySelectorAll("[class*='bg-slate']").forEach((hdr) => {
              hdr.style.backgroundColor = "#f1f5f9";
              if (hdr.tagName === "TH" || hdr.tagName === "TD") {
                hdr.style.color = "#000000";
              }
            });

            clonedSheet.querySelectorAll(".wo-tickbox").forEach((box) => {
              box.style.display = "inline-flex";
              box.style.alignItems = "center";
              box.style.justifyContent = "center";
              box.style.verticalAlign = "middle";
              box.style.lineHeight = "0";
              box.style.paddingTop = "0";
              box.style.paddingBottom = "0";
            });

            clonedSheet.querySelectorAll("th, td").forEach((cell) => {
              const isDescCell =
                cell.closest("tbody tr.h-16, tbody tr.h-20") !== null;
              cell.style.lineHeight = "1.3";
              cell.style.verticalAlign = isDescCell ? "top" : "middle";
              cell.style.paddingTop = isDescCell ? "5px" : "4px";
              cell.style.paddingBottom = isDescCell ? "7px" : "5px";

              if (
                !isDescCell &&
                !cell.querySelector("img, canvas, svg") &&
                cell.childNodes.length > 0
              ) {
                const wrapper = clonedDoc.createElement("div");
                wrapper.style.transform = "translateY(-2.5px)";
                wrapper.style.lineHeight = "1.3";
                while (cell.firstChild) {
                  wrapper.appendChild(cell.firstChild);
                }
                cell.appendChild(wrapper);
              }
            });
          }

          const origCanvases = sheetEl.querySelectorAll("canvas");
          const cloneCanvases = clonedSheet?.querySelectorAll("canvas") || [];
          origCanvases.forEach((orig, idx) => {
            const target = cloneCanvases[idx];
            if (target) {
              const ctx = target.getContext("2d");
              target.width = orig.width;
              target.height = orig.height;
              ctx?.drawImage(orig, 0, 0);
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 4;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let renderWidth = maxWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      const offsetX = Math.max(margin, (pageWidth - renderWidth) / 2);
      const offsetY = Math.max(margin, (pageHeight - renderHeight) / 2);

      pdf.addImage(
        imgData,
        "PNG",
        offsetX,
        offsetY,
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );

      const safeId = String(ticket.id || "WO").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`WO_${safeId}.pdf`);
    } catch (err) {
      console.error("Gagal export PDF:", err);
      alert(`Gagal membuat PDF: ${err?.message || "Unknown error"}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. PRINT FORM LANGSUNG DI HALAMAN AKTIF
  const handlePrintDirect = () => {
    document.body.classList.add("wo-printing-active");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove("wo-printing-active");
      }, 300);
    }, 100);
  };

  const hasAnySignature = Object.keys(signatures).length > 0;

  return (
    <div className="wo-modal-backdrop fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-5 print:static print:inset-auto print:p-0 print:bg-white print:block">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          body.wo-printing-active > *:not(.wo-modal-backdrop) {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .wo-modal-backdrop {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            min-height: 97vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: auto !important;
          }
          .wo-print-root {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: auto !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .wo-sheet-scroll {
            overflow: visible !important;
            padding: 0 !important;
            margin: auto !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .wo-sheet {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            margin: auto !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            padding: 6px !important;
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
                Preview &amp; Cetak Work Order — {ticket.id}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Kop standar IATF dengan format Work Order simpel, TTD peminta &amp;
              pengerja, serta blok Vendor.
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
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExportingExcel ? "Membuat Excel..." : "Excel (.xlsx)"}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdfDirect}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              {isExportingPdf ? "Membuat PDF..." : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={handlePrintDirect}
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

        {/* Catatan tambahan */}
        <div className="no-print bg-teal-50/70 border-b border-teal-200 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-teal-950 font-medium">
            {esignEnabled
              ? "Klik & seret di dalam kotak TTD untuk membubuhkan TTD Elektronik."
              : "Mode TTD Manual aktif: kotak TTD kosong siap ditandatangani (atau aktifkan TTD Elektronik)."}
          </span>
          <input
            type="text"
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            className="px-3 py-1 rounded-lg border border-teal-300 bg-white text-slate-800 text-xs w-full sm:w-72"
            placeholder="Catatan tambahan (opsional)"
          />
        </div>

        {/* Lembar Form */}
        <div className="wo-sheet-scroll p-3 sm:p-6 overflow-x-auto bg-slate-100/70 print:bg-white print:p-0">
          <div
            ref={printAreaRef}
            className="wo-sheet min-w-[780px] mx-auto bg-white text-black border-2 border-black p-3 text-[10px] leading-snug"
          >
            {/* 1. KOP STANDAR IATF (TETAP SAMA) */}
            <table className="w-full border-collapse border border-black mb-2">
              <tbody>
                <tr>
                  <td
                    rowSpan={3}
                    className="border border-black px-2 py-1 text-center align-middle w-[22%]"
                  >
                    {settings?.brandSymbol === "custom" &&
                    settings?.customLogoDataUrl ? (
                      <img
                        src={settings.customLogoDataUrl}
                        alt={companyName}
                        className="max-h-10 mx-auto object-contain mb-0.5"
                      />
                    ) : null}
                    <div className="text-[10px] font-bold">{companyName}</div>
                  </td>
                  <td className="border border-black px-2 py-1 font-bold text-center text-xs w-[48%]">
                    FORMULIR/양식
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-semibold w-[14%]">
                    No. Dokumen
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-bold w-[16%]">
                    : {docNumber}
                  </td>
                </tr>
                <tr>
                  <td
                    rowSpan={2}
                    className="border border-black px-2 py-1 font-bold text-center text-xs sm:text-sm align-middle"
                  >
                    SURAT PERMINTAAN PEKERJAAN/작업 의뢰서
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-semibold">
                    Tanggal Terbit
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px]">
                    : {issueDate}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-semibold">
                    No. Revisi
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px]">
                    : {revision}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-mono font-bold">
                    No. Form: {ticket.id}
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] text-right pr-3">
                    Kategori: <strong>{ticket.category}</strong> · Lokasi:{" "}
                    <strong>{ticket.lineLocation || "-"}</strong>
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px] font-semibold">
                    Halaman
                  </td>
                  <td className="border border-black px-2 py-0.5 text-[9.5px]">
                    : {pageLabel}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2. IDENTITAS PEMOHON & JENIS PEKERJAAN */}
            <table className="w-full border-collapse border border-black mb-2 text-[9.5px]">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold w-[18%]">
                    Name/성명
                  </td>
                  <td className="border border-black px-2 py-1 w-[32%]">
                    : {ticket.requesterName || ""}
                  </td>
                  <td
                    colSpan={2}
                    className="border border-black bg-slate-100 px-2 py-1 font-bold text-center"
                  >
                    Jenis Pekerjaan/작업 유형
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold">
                    NIP/사번
                  </td>
                  <td className="border border-black px-2 py-1">
                    : {ticket.requesterNip || ""}
                  </td>
                  <td className="border border-black px-2 py-1 w-[25%]">
                    <span className="inline-flex items-center align-middle">
                      <TickBox checked={ticket.jobType === "Repair"} />
                      <span className="ml-1.5">Repair/수리</span>
                    </span>
                  </td>
                  <td className="border border-black px-2 py-1 w-[25%]">
                    <span className="inline-flex items-center align-middle">
                      <TickBox checked={ticket.jobType === "Service"} />
                      <span className="ml-1.5">Service/서비스 / 점검</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Departement/부서
                  </td>
                  <td className="border border-black px-2 py-1 font-semibold">
                    : {ticket.department || ""}
                  </td>
                  <td className="border border-black px-2 py-1">
                    <span className="inline-flex items-center align-middle">
                      <TickBox checked={ticket.jobType === "Remove & Install"} />
                      <span className="ml-1.5">
                        Remove &amp; Install/제거 및 설치
                      </span>
                    </span>
                  </td>
                  <td className="border border-black px-2 py-1">
                    <span className="inline-flex items-center align-middle">
                      <TickBox checked={ticket.jobType === "Trouble"} />
                      <span className="ml-1.5">Trouble/장애 / 문제</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Section과 / 섹션
                  </td>
                  <td className="border border-black px-2 py-1">
                    : {ticket.section || ticket.lineLocation || ""}
                  </td>
                  <td
                    colSpan={2}
                    className="border border-black bg-slate-100 px-2 py-1 font-semibold"
                  >
                    <span className="mr-3 align-middle">Pelaksana:</span>
                    <span className="mr-3 inline-flex items-center align-middle">
                      <TickBox checked={ticket.executorType === "Team Engineer"} />
                      <span className="ml-1.5">Team Engineer</span>
                    </span>
                    <span className="inline-flex items-center align-middle">
                      <TickBox checked={ticket.executorType === "Vendor"} />
                      <span className="ml-1.5">Vendor</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Request Date/신청일
                  </td>
                  <td className="border border-black px-2 py-1">
                    : {ticket.requestDate || ticket.createdAt || ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-semibold">
                    Penerima / 수신자
                  </td>
                  <td className="border border-black px-2 py-1">
                    : {ticket.receiverName || ticket.assignedPic || ""}
                    {ticket.receivedDate ? ` (${ticket.receivedDate})` : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3. TTD YANG MEMINTA */}
            <div className="text-[9.5px] font-semibold mb-1">
              Departement yang meminta :/요청 부서 :
            </div>
            <table className="w-full border-collapse border border-black mb-2 text-[9.5px]">
              <thead>
                <tr className="bg-emerald-100/80">
                  <th className="border border-black px-1 py-1 w-[20%]">
                    Request By/요청자
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
                    SUPERVISOR
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
                    CHIEF
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
                    MANAGER
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
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
                        className="h-13"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="h-5 text-[9px] font-medium text-center">
                  <td className="border border-black px-1 py-0.5">
                    {ticket.requesterName || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.reqSupervisor || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.reqChief || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.reqManager || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.reqGm || ""}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3B. TTD YANG DIMINTA / MENGERJAKAN */}
            <div className="text-[9.5px] font-semibold mb-1">
              Departement yang mengerjalan : /작업 부서 :
            </div>
            <table className="w-full border-collapse border border-black mb-2 text-[9.5px]">
              <thead>
                <tr className="bg-emerald-100/80">
                  <th className="border border-black px-1 py-1 w-[18%]">
                    Admin
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
                    SUPERVISOR
                  </th>
                  <th className="border border-black px-1 py-1 w-[20%]">
                    CHIEF
                  </th>
                  <th className="border border-black px-1 py-1 w-[21%]">
                    MANAGER HRD
                  </th>
                  <th className="border border-black px-1 py-1 w-[21%]">
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
                        className="h-13"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="h-5 text-[9px] font-medium text-center">
                  <td className="border border-black px-1 py-0.5">
                    {ticket.engAdmin || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.engSupervisor || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.engChief || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {ticket.engManagerHrd || ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    {presidentDirector}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 4. URAIAN PEKERJAAN & FOTO / LAYOUT */}
            <table className="w-full border-collapse border border-black mb-2 text-[9.5px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black px-2 py-1 w-[45%]">
                    Description/Photo/Layout/설명 / 사진 / 배치도
                  </th>
                  <th className="border border-black px-2 py-1 w-[55%]">
                    Uraian Pekerjaan/작업 내용 설명
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-20 align-top">
                  <td className="border border-black p-1.5">
                    {ticket.photoDataUrl ? (
                      <img
                        src={ticket.photoDataUrl}
                        alt="Lampiran Foto / Layout"
                        className="max-h-16 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-slate-700">
                        {ticket.layoutNote || ""}
                      </div>
                    )}
                  </td>
                  <td className="border border-black p-1.5 whitespace-pre-wrap">
                    {ticket.description || ""}
                    {signedBy ? (
                      <div className="text-[9px] text-slate-700 mt-1">
                        Catatan: {signedBy}
                      </div>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 5A. MAN POWER */}
            <table className="w-full border-collapse border border-black mb-2 text-[9px]">
              <thead>
                <tr className="bg-slate-100">
                  <th
                    colSpan={8}
                    className="border border-black px-2 py-1 font-bold text-center text-[9.5px]"
                  >
                    Man Power Team Engineer / 엔지니어 투입 인원
                  </th>
                </tr>
                <tr>
                  <th className="border border-black px-1 py-0.5 w-[5%]">No</th>
                  <th className="border border-black px-1 py-0.5 w-[22%]">
                    Nama / 성명
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[13%]">
                    NIP / 사번
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[14%]">
                    Tanggal / 일자
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[10%]">
                    Mulai
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[10%]">
                    Selesai
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[11%]">
                    Total Jam
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[15%]">
                    Paraf / 서명
                  </th>
                </tr>
              </thead>
              <tbody>
                {manPowerRows.map((row, idx) => (
                  <tr key={idx} className="h-5">
                    <td className="border border-black px-1 py-0.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {row.name || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {row.nip || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {row.date || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {row.startTime || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {row.endTime || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {row.total || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {row.sign || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 5B. MATERIAL TERPAKAI */}
            <table className="w-full border-collapse border border-black mb-2 text-[9px]">
              <thead>
                <tr className="bg-slate-100">
                  <th
                    colSpan={7}
                    className="border border-black px-2 py-1 font-bold text-center text-[9.5px]"
                  >
                    Material yang terpakai/사용 자재 / 소모품
                  </th>
                </tr>
                <tr>
                  <th className="border border-black px-1 py-0.5 w-[7%]">
                    No/번호
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[20%]">
                    Material/자재명
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[9%]">
                    Qty/수량
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[9%]">
                    Unit/단위
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[24%]">
                    Description/설명
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[17%]">
                    Remark/비고
                  </th>
                  <th className="border border-black px-1 py-0.5 w-[14%]">
                    Paraf Warehouse/창고 확인 서명
                  </th>
                </tr>
              </thead>
              <tbody>
                {materialRows.map((mat, idx) => (
                  <tr key={idx} className="h-5">
                    <td className="border border-black px-1 py-0.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {mat.name || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {mat.qty || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {mat.unit || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {mat.description || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {mat.remark || ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {mat.whSign || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 6. BLOK KHUSUS DIKERJAKAN OLEH VENDOR */}
            <table className="w-full border-collapse border border-black text-[9.5px]">
              <tbody>
                <tr className="bg-emerald-100/80">
                  <td
                    colSpan={3}
                    className="border border-black px-2 py-1 font-bold text-center text-[9.5px]"
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
                      className={`border border-black p-0.5 ${item.w}`}
                    >
                      <SignatureSlot
                        slotKey={item.key}
                        esignEnabled={esignEnabled}
                        signatureData={signatures[item.key]}
                        onChangeSignature={handleSignatureChange}
                        className="h-16"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="text-[9.5px] font-semibold text-center">
                  <td className="border border-black px-2 py-0.5">
                    Section Head
                    {ticket.vendorSectionHead
                      ? ` (${ticket.vendorSectionHead})`
                      : ""}
                  </td>
                  <td className="border border-black px-2 py-0.5">
                    Project Section head
                    {ticket.vendorProjectHead
                      ? ` (${ticket.vendorProjectHead})`
                      : ""}
                  </td>
                  <td className="border border-black px-2 py-0.5">
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