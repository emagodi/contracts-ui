"use client";

import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";

type ApprovalPayload = {
  approvalTo?: string;
  approvalDate?: string;
  approvalReference?: string;
  legalSignature?: string;
  legalSignatureDate?: string;
  legalComments?: string;
  technicalSignature?: string;
  technicalSignatureDate?: string;
  technicalComments?: string;
  financialSignature?: string;
  financialSignatureDate?: string;
  financialComments?: string;
  commercialSignature?: string;
  commercialSignatureDate?: string;
  commercialComments?: string;
  businessDevelopmentSignature?: string;
  businessDevelopmentSignatureDate?: string;
  businessDevelopmentComments?: string;
  procurementSignature?: string;
  procurementSignatureDate?: string;
  procurementComments?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
};

type Requisition = Record<string, unknown> & {
  requisitionTo?: string;
  requisitionFrom?: string;
  date?: string;
  description?: string;
};

export default function ApprovalForm({ submitting, error, onSubmit, onCancel, requisition }: {
  submitting?: boolean;
  error?: string | null;
  onSubmit: (payload: ApprovalPayload) => void;
  onCancel: () => void;
  requisition?: Requisition | null;
}) {
  const [form, setForm] = useState<ApprovalPayload>({ approvalStatus: "PENDING" });
  const today = new Date().toISOString().split("T")[0];
  const readOnly = "border border-gray-400 bg-gray-100 text-gray-600 cursor-not-allowed";
  const val = (k: keyof Requisition, fallback: string = "") => String((requisition as Requisition)?.[k] ?? fallback);
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const set = (k: keyof ApprovalPayload, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);

  const submit = () => {
    const payload: ApprovalPayload = {
      ...form,
      approvalDate: toIso(form.approvalDate),
      legalSignatureDate: toIso(form.legalSignatureDate),
      technicalSignatureDate: toIso(form.technicalSignatureDate),
      financialSignatureDate: toIso(form.financialSignatureDate),
      commercialSignatureDate: toIso(form.commercialSignatureDate),
      businessDevelopmentSignatureDate: toIso(form.businessDevelopmentSignatureDate),
      procurementSignatureDate: toIso(form.procurementSignatureDate),
    };
    onSubmit(payload);
  };

  const labelCls = "font-semibold text-black";
  const inputCls = "w-full";
  const section = (title: string, children: React.ReactNode) => (
    <div className="border border-black p-4 mt-6">
      <h2 className="text-md font-semibold text-black mb-2">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white border-2 border-black shadow-lg rounded-sm p-10 text-gray-900">
      <div className="border border-black rounded-sm overflow-hidden">
        <div className="flex justify-end pr-4 pt-4">
          <Image src="/images/powertel.png" alt="PowerTel Logo" width={120} height={60} />
        </div>
        <div className="bg-blue-200 border-t border-b border-black py-3 text-center">
          <h1 className="text-lg font-bold underline text-black uppercase">Contract Requisition Form</h1>
        </div>
        <div className="p-6 text-sm text-gray-900 space-y-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20 text-black">TO:</span>
            <Input readOnly name="requisitionTo" defaultValue={val("requisitionTo")} className={readOnly + " w-full"} />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20 text-black">From:</span>
            <Input readOnly name="requisitionFrom" defaultValue={val("requisitionFrom")} className={readOnly + " w-full"} />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20 text-black">Date:</span>
            <Input readOnly name="date" defaultValue={formatDisplayDate(val("date", today))} className={readOnly + " w-1/3"} />
          </div>
          <p className="mt-4 text-gray-800">I hereby request the Legal Department to prepare the contract described below:</p>
        </div>
      </div>

      <div className="border border-black p-4 mt-8">
        <h2 className="text-md font-semibold text-black mb-2">1. Contract Description</h2>
        <TextArea readOnly name="description" rows={3} defaultValue={val("description")} className={readOnly + " w-full"} />
        <p className="mt-2 text-sm italic text-black opacity-70">(Please provide a brief description of the contract: eg for the supply and delivery of 2000 CDMA handsets)</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className={labelCls}>Approval To</div>
          <Input value={form.approvalTo || ""} onChange={(e) => set("approvalTo", e.target.value)} className={inputCls} />
        </div>
        <div>
          <div className={labelCls}>Approval Date</div>
          <Input type="datetime-local" value={form.approvalDate || ""} onChange={(e) => set("approvalDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <div className={labelCls}>Approval Reference</div>
          <Input value={form.approvalReference || ""} onChange={(e) => set("approvalReference", e.target.value)} className={inputCls} />
        </div>
      </div>

      {section("Legal", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.legalSignature || ""} onChange={(e) => set("legalSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.legalSignatureDate || ""} onChange={(e) => set("legalSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.legalComments || ""} onChange={(e) => set("legalComments", e.target.value)} /></div>
        </div>
      ))}

      {section("Technical", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.technicalSignature || ""} onChange={(e) => set("technicalSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.technicalSignatureDate || ""} onChange={(e) => set("technicalSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.technicalComments || ""} onChange={(e) => set("technicalComments", e.target.value)} /></div>
        </div>
      ))}

      {section("Financial", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.financialSignature || ""} onChange={(e) => set("financialSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.financialSignatureDate || ""} onChange={(e) => set("financialSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.financialComments || ""} onChange={(e) => set("financialComments", e.target.value)} /></div>
        </div>
      ))}

      {section("Commercial", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.commercialSignature || ""} onChange={(e) => set("commercialSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.commercialSignatureDate || ""} onChange={(e) => set("commercialSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.commercialComments || ""} onChange={(e) => set("commercialComments", e.target.value)} /></div>
        </div>
      ))}

      {section("Business Development", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.businessDevelopmentSignature || ""} onChange={(e) => set("businessDevelopmentSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.businessDevelopmentSignatureDate || ""} onChange={(e) => set("businessDevelopmentSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.businessDevelopmentComments || ""} onChange={(e) => set("businessDevelopmentComments", e.target.value)} /></div>
        </div>
      ))}

      {section("Procurement", (
        <div className="grid grid-cols-2 gap-4">
          <div><div className={labelCls}>Signature</div><Input value={form.procurementSignature || ""} onChange={(e) => set("procurementSignature", e.target.value)} className={inputCls} /></div>
          <div><div className={labelCls}>Signature Date</div><Input type="datetime-local" value={form.procurementSignatureDate || ""} onChange={(e) => set("procurementSignatureDate", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><div className={labelCls}>Comments</div><TextArea rows={4} value={form.procurementComments || ""} onChange={(e) => set("procurementComments", e.target.value)} /></div>
        </div>
      ))}

      <div className="border border-black p-4 mt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className={labelCls}>Approval Status</div>
            <select value={form.approvalStatus || "PENDING"} onChange={(e) => set("approvalStatus", e.target.value)} className="border border-black w-full p-2 bg-white text-black">
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="rounded-full bg-sky-600 hover:bg-sky-700 text-white" disabled={submitting} onClick={submit}>
          {submitting ? "Saving..." : "Submit Approval"}
        </Button>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <footer className="text-xs text-center text-gray-500 mt-10 italic">
        PowerTel Communications — Imagine it. Live it.
      </footer>
    </div>
  );
}