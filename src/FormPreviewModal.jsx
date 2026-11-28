import React, { useRef } from "react";
import { Printer, Download, X } from "lucide-react";

const JOB_TYPES = [
  { key: "Repair", label: "Repair/수리" },
  { key: "Remove & Install", label: "Remove & Install/제거 및 설치" },
  { key: "Service", label: "Service/서비스 / 점검" },
  { key: "Trouble", label: "Trouble/장애 / 문제" },
];

export default function FormPreviewModal({ ticket, settings, onClose }) {
  const printAreaRef = useRef(null);

  if (!ticket) return null;

  const manPowerRows = Array.isArray(ticket.manPowerLogs) ? ticket.manPowerLogs : [];
  const materialRows = Array.isArray(ticket.materialLogs) ? ticket.materialLogs : [];

  const paddedManPower = [
    ...manPowerRows,
    ...Array(Math.max(0, 10 - manPowerRows.length)).fill({
      name: "",
      nip: "",
      date: "",
      startTime: "",
      endTime: "",
      total: "",
      sign: "",
    }),
  ].slice(0, 10);

  const paddedMaterials = [
    ...materialRows,
    ...Array(Math.max(0, 8 - materialRows.length)).fill({
      name: "",
      qty: "",
      unit: "",
      description: "",
      remark: "",
      whSign: "",
    }),
  ].slice(0, 8);

  const handlePrintOrSavePdf = () => {
    const content = printAreaRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${ticket.id} - ${settings.docNumber || "FM-IT-SOP-01-01"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, "Malgun Gothic", sans-serif;
              color: #000;
              background: #fff;
            }
            .sheet-wrapper {
              width: 100%;
              max-width: 196mm;
              margin: 0 auto;
              border: 1.5px solid #000;
              padding: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            td, th {
              border: 1px solid #000;
              padding: 2px 4px;
              font-size: 8.5px;
              line-height: 1.25;
              vertical-align: middle;
              word-wrap: break-word;
            }
            .photo-preview {
              max-width: 100%;
              max-height: 56px;
              object-fit: contain;
              display: block;
              margin: 2px auto;
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4">
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold">
              Preview Formulir Standar IATF — {settings.docNumber || "FM-IT-SOP-01-01"}
            </h3>
            <p className="text-[11px] text-slate-300">
              No. Form Otomatis:{" "}
              <span className="font-mono font-bold text-amber-300">{ticket.id}</span> · Siap Preview, Download PDF & Print
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Form
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 bg-slate-200/80 overflow-x-auto max-h-[82vh] overflow-y-auto">
          <div
            ref={printAreaRef}
            className="bg-white mx-auto shadow-md"
            style={{ width: "210mm", minWidth: "760px", padding: "6mm" }}
          >
            <div
              className="sheet-wrapper"
              style={{
                border: "1.5px solid #000",
                padding: "4px",
                fontFamily: "Arial, sans-serif",
                color: "#000",
              }}
            >
              {/* HEADER FORMULIR STANDAR IATF */}
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <tbody>
                  <tr>
                    <td
                      rowSpan={3}
                      style={{ width: "21%", border: "1px solid #000", textAlign: "center", padding: "4px" }}
                    >
                      {settings.brandSymbol === "custom" && settings.customLogoDataUrl ? (
                        <img
                          src={settings.customLogoDataUrl}
                          alt="Logo"
                          style={{ maxHeight: "48px", maxWidth: "100%", objectFit: "contain", margin: "0 auto" }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "900",
                            fontStyle: "italic",
                            letterSpacing: "2px",
                            lineHeight: 1.1,
                          }}
                        >
                          <span style={{ color: "#16a34a" }}>S</span>
                          <span style={{ color: "#e11d48" }}>I</span>
                          <span style={{ color: "#2563eb" }}>J</span>
                        </div>
                      )}
                    </td>
                    <td
                      rowSpan={2}
                      style={{
                        width: "51%",
                        border: "1px solid #000",
                        textAlign: "center",
                        fontSize: "15px",
                        fontWeight: "bold",
                        padding: "4px",
                      }}
                    >
                      FORMULIR/양식
                    </td>
                    <td style={{ width: "12%", border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      No. Dokumen
                    </td>
                    <td style={{ width: "16%", border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      : {settings.docNumber || "FM-IT-SOP-01-01"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      Tanggal Terbit
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      : {settings.docIssueDate || "01 Desember 2025"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      rowSpan={2}
                      style={{
                        border: "1px solid #000",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "bold",
                        padding: "4px",
                      }}
                    >
                      SURAT PERMINTAAN PEKERJAAN/작업 의뢰서
                      <div style={{ fontSize: "8.5px", fontWeight: "normal", marginTop: "1px" }}>
                        No. Form: <strong>{ticket.id}</strong> ({ticket.priority})
                      </div>
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      No. Revisi
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      : {settings.docRevision || "01"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #000",
                        textAlign: "center",
                        fontSize: "8.5px",
                        fontWeight: "bold",
                        padding: "2px 4px",
                      }}
                    >
                      {settings.companyName || "PT. Sino Indah Jaya"}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      Halaman
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8.5px", fontWeight: "bold", padding: "2px 4px" }}>
                      : {settings.docPage || "1 dari 1"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* IDENTITAS PEMOHON & JENIS PEKERJAAN */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", gap: "8px" }}>
                <table style={{ width: "58%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "36%", fontSize: "8.5px", padding: "1.5px 3px" }}>Name/성명</td>
                      <td style={{ width: "3%", fontSize: "8.5px" }}>:</td>
                      <td style={{ fontSize: "8.5px", fontWeight: "bold" }}>{ticket.requesterName}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "8.5px", padding: "1.5px 3px" }}>NIP/사번</td>
                      <td style={{ fontSize: "8.5px" }}>:</td>
                      <td style={{ fontSize: "8.5px" }}>{ticket.requesterNip || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "8.5px", padding: "1.5px 3px" }}>Departement/부서</td>
                      <td style={{ fontSize: "8.5px" }}>:</td>
                      <td style={{ fontSize: "8.5px", fontWeight: "bold" }}>{ticket.department}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "8.5px", padding: "1.5px 3px" }}>Section과 / 섹션</td>
                      <td style={{ fontSize: "8.5px" }}>:</td>
                      <td style={{ fontSize: "8.5px" }}>{ticket.section || ticket.lineLocation}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "8.5px", padding: "1.5px 3px" }}>Request Date/신청일</td>
                      <td style={{ fontSize: "8.5px" }}>:</td>
                      <td style={{ fontSize: "8.5px" }}>{ticket.requestDate || ticket.createdAt}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ width: "40%" }}>
                  <div
                    style={{
                      border: "1px solid #000",
                      textAlign: "center",
                      fontSize: "8.5px",
                      fontWeight: "bold",
                      padding: "2px",
                      marginBottom: "3px",
                    }}
                  >
                    Jenis Pekerjaan/작업 유형
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {JOB_TYPES.map((jt) => {
                        const checked = (ticket.jobType || "Repair") === jt.key;
                        return (
                          <tr key={jt.key}>
                            <td
                              style={{
                                width: "36px",
                                border: "1px solid #000",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: "9px",
                                padding: "1px",
                              }}
                            >
                              {checked ? "V" : ""}
                            </td>
                            <td style={{ fontSize: "8.5px", padding: "1px 6px" }}>{jt.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KOLOM TANDA TANGAN DEPARTEMENT YANG MEMINTA */}
              <div style={{ fontSize: "8.5px", fontWeight: "bold", marginTop: "4px", marginBottom: "1px" }}>
                Departement yang meminta :/요청 부서 : {ticket.department}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ backgroundColor: "#dcfce7" }}>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>Request By/요청자</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>SUPERVISOR</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>CHIEF</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>MANAGER</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>GM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center", height: "14px" }}>
                      {ticket.requesterName}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.reqSupervisor || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.reqChief || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.reqManager || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.reqGm || ""}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* KOLOM TANDA TANGAN DEPARTEMENT YANG MENGERJAKAN */}
              <div style={{ fontSize: "8.5px", fontWeight: "bold", marginTop: "4px", marginBottom: "1px" }}>
                Departement yang mengerjakan : /작업 부서 : ENGINEERING
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ backgroundColor: "#dcfce7" }}>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>Admin</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>SUPERVISOR</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>CHIEF</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>MANAGER HRD</th>
                    <th style={{ border: "1px solid #000", fontSize: "8.5px", padding: "2px" }}>PRESIDENT DIRECTOR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                    <td style={{ border: "1px solid #000", height: "34px" }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center", height: "14px" }}>
                      {ticket.engAdmin || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.engSupervisor || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.engChief || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                      {ticket.engManagerHrd || ""}
                    </td>
                    <td style={{ border: "1px solid #000", fontSize: "8px", fontWeight: "bold", textAlign: "center" }}>
                      {settings.presidentDirectorName || "Mr. KANG BYOUNGHA"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* DESCRIPTION / PHOTO / LAYOUT & URAIAN PEKERJAAN */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
                <div style={{ width: "49%" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "bold", textAlign: "center", marginBottom: "1px" }}>
                    Description/Photo/Layout/설명 / 사진 / 배치도
                  </div>
                  <div
                    style={{
                      border: "1px solid #000",
                      height: "74px",
                      padding: "4px",
                      fontSize: "8.5px",
                      overflow: "hidden",
                    }}
                  >
                    {ticket.photoDataUrl ? (
                      <img
                        src={ticket.photoDataUrl}
                        alt="Lampiran Foto Masalah/Permintaan"
                        className="photo-preview"
                        style={{ maxHeight: "64px", maxWidth: "100%", objectFit: "contain", margin: "0 auto" }}
                      />
                    ) : (
                      <div style={{ color: "#334155" }}>
                        {ticket.lineLocation ? `Lokasi: ${ticket.lineLocation}` : "-"}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ width: "49%" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "bold", textAlign: "center", marginBottom: "1px" }}>
                    Uraian Pekerjaan/작업 내용 설명
                  </div>
                  <div
                    style={{
                      border: "1px solid #000",
                      height: "74px",
                      padding: "4px",
                      fontSize: "8.5px",
                      overflow: "hidden",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {ticket.description || ticket.title}
                  </div>
                </div>
              </div>

              {/* BAGIAN BAWAH: DIISI OLEH PENERIMA / ENGINEERING */}
              <div style={{ border: "1px solid #000", marginTop: "5px", padding: "3px" }}>
                <div
                  style={{
                    backgroundColor: "#dcfce7",
                    border: "1px solid #000",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    padding: "2px",
                  }}
                >
                  Diisi Oleh Penerima/수신자 작성란
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", gap: "8px" }}>
                  <table style={{ width: "48%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "44%", fontSize: "8.5px", padding: "1px 3px" }}>Tanggal Terima/접수일</td>
                        <td style={{ width: "4%", fontSize: "8.5px" }}>:</td>
                        <td style={{ fontSize: "8.5px", fontWeight: "bold" }}>{ticket.receivedDate || "-"}</td>
                      </tr>
                      <tr>
                        <td style={{ fontSize: "8.5px", padding: "1px 3px" }}>Waktu/시간</td>
                        <td style={{ fontSize: "8.5px" }}>:</td>
                        <td style={{ fontSize: "8.5px", fontWeight: "bold" }}>{ticket.receivedTime || "-"}</td>
                      </tr>
                      <tr>
                        <td style={{ fontSize: "8.5px", padding: "1px 3px" }}>Nama Penerima/수신자 성명</td>
                        <td style={{ fontSize: "8.5px" }}>:</td>
                        <td style={{ fontSize: "8.5px", fontWeight: "bold" }}>{ticket.receiverName || "-"}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table style={{ width: "50%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "36px",
                            border: "1px solid #000",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "9px",
                          }}
                        >
                          {ticket.executorType === "Team Engineer" ? "V" : ""}
                        </td>
                        <td style={{ fontSize: "8.5px", padding: "1px 6px" }}>
                          Dikerjakan Oleh Team Engineer/엔지니어 팀 수행
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            width: "36px",
                            border: "1px solid #000",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "9px",
                          }}
                        >
                          {ticket.executorType === "Vendor" ? "V" : ""}
                        </td>
                        <td style={{ fontSize: "8.5px", padding: "1px 6px" }}>
                          Dikerjakan Oleh Vendor/외부 업체(벤더) 수행
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TABEL MAN POWER TEAM ENGINEER */}
                <div
                  style={{
                    borderTop: "1px solid #000",
                    marginTop: "3px",
                    paddingTop: "2px",
                    textAlign: "center",
                    fontSize: "8.5px",
                    fontWeight: "bold",
                  }}
                >
                  Diisi Apabila Dikerjakan Oleh Team Engineer/엔지니어 팀이 작업한 경우 작성
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "2px" }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ width: "22%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>
                        MAN POWER/인력 (인원)
                      </th>
                      <th rowSpan={2} style={{ width: "13%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>
                        NIP
                      </th>
                      <th rowSpan={2} style={{ width: "14%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>
                        Tanggal/날짜
                      </th>
                      <th colSpan={2} style={{ width: "26%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>
                        Waktu/시간
                      </th>
                      <th rowSpan={2} style={{ width: "10%", border: "1px solid #000", fontSize: "7.5px", padding: "1px" }}>
                        TOTAL/합계
                      </th>
                      <th rowSpan={2} style={{ width: "15%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>
                        PARAF/서명 (사인)
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: "1px solid #000", fontSize: "7.5px", padding: "1px" }}>Mulai/시작</th>
                      <th style={{ border: "1px solid #000", fontSize: "7.5px", padding: "1px" }}>Selesai/종료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedManPower.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000", fontSize: "8px", height: "13px", padding: "0 3px" }}>
                          {row.name}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.nip}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.date}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.startTime}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.endTime}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.total}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>
                          {row.sign}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TABEL MATERIAL YANG TERPAKAI */}
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "4px" }}>
                  <thead>
                    <tr>
                      <th colSpan={7} style={{ border: "1px solid #000", fontSize: "8.5px", padding: "1.5px" }}>
                        Material yang terpakai/사용 자재 / 소모품
                      </th>
                    </tr>
                    <tr>
                      <th style={{ width: "7%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>No/번호</th>
                      <th style={{ width: "22%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>Material/자재명</th>
                      <th style={{ width: "8%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>Qty/수량</th>
                      <th style={{ width: "8%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>Unit/단위</th>
                      <th style={{ width: "21%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>Description/설명</th>
                      <th style={{ width: "19%", border: "1px solid #000", fontSize: "8px", padding: "1px" }}>Remark/비고</th>
                      <th style={{ width: "15%", border: "1px solid #000", fontSize: "7.5px", padding: "1px" }}>
                        Paraf Warehouse/창고 확인 서명
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedMaterials.map((mat, idx) => (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center", height: "13px" }}>
                          {mat.name ? idx + 1 : ""}
                        </td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", padding: "0 3px" }}>{mat.name}</td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>{mat.qty}</td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>{mat.unit}</td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", padding: "0 3px" }}>{mat.description}</td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", padding: "0 3px" }}>{mat.remark}</td>
                        <td style={{ border: "1px solid #000", fontSize: "8px", textAlign: "center" }}>{mat.whSign}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* BAGIAN VENDOR */}
                <div
                  style={{
                    borderTop: "1px solid #000",
                    marginTop: "4px",
                    paddingTop: "2px",
                    textAlign: "center",
                    fontSize: "8.5px",
                    fontWeight: "bold",
                  }}
                >
                  Diisi Apabila Dikerjakan Oleh Team Vendor/외부 업체(벤더)가 작업한 경우 작성
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "2px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000", height: "22px", textAlign: "center", fontSize: "8px" }}>
                        {ticket.vendorSectionHead || ""}
                      </td>
                      <td style={{ border: "1px solid #000", height: "22px", textAlign: "center", fontSize: "8px" }}>
                        {ticket.vendorProjectHead || ""}
                      </td>
                      <td style={{ border: "1px solid #000", height: "22px", textAlign: "center", fontSize: "8px" }}>
                        {ticket.vendorName || ""}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000", textAlign: "center", fontSize: "8px", fontWeight: "bold", padding: "1px" }}>
                        Section Head
                      </td>
                      <td style={{ border: "1px solid #000", textAlign: "center", fontSize: "8px", fontWeight: "bold", padding: "1px" }}>
                        Project Section head
                      </td>
                      <td style={{ border: "1px solid #000", textAlign: "center", fontSize: "8px", fontWeight: "bold", padding: "1px" }}>
                        Vendor
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}