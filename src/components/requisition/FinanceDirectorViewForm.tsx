"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { CheckLineIcon, CloseLineIcon } from "@/icons";

type Requisition = Record<string, unknown> & {
  id: number;
  requisitionTo?: string;
  requisitionFrom?: string;
  date?: string;
  description?: string;
  vendorRegistedName?: string;
  vendorTradingName?: string;
  vendorAddress?: string;
  vendorContactPerson?: string;
  vendorPhoneNumber?: string;
  vendorEmail?: string;
  justification?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: string;
  durationWeeks?: string;
  durationMonths?: string;
  durationYears?: string;
  isRenewable?: string;
  renewalWeeks?: string;
  renewalMonths?: string;
  renewalYears?: string;
  contractPrice?: string;
  vat?: string;
  totalContractPrice?: string;
  totalOnsignature?: string;
  downPayment?: string;
  balancePayment?: string;
  deliveryDays?: string;
  deliveryWeeks?: string;
  deliveryMonths?: string;
  deliveryNA?: string;
  penalties?: string;
  acceptanceConditions?: string;
  warrantyDays?: string;
  warrantyWeeks?: string;
  warrantyMonths?: string;
  warrantyNA?: string;
  serviceSupport?: string;
  specialIssues?: string;
};

export default function FinanceDirectorViewForm({ requisition, onSubmit, submitting, error, onCancel }: {
  requisition: Requisition;
  onSubmit: (funding: "YES" | "NO") => void;
  submitting?: boolean;
  error?: string | null;
  onCancel: () => void;
}) {
  const [funding, setFunding] = useState<"YES" | "NO" | "">("");
  const today = new Date().toISOString().split("T")[0];
  const readOnly = "border border-gray-400 bg-gray-100 text-gray-600 cursor-not-allowed rounded-md";
  const val = (k: keyof Requisition, fallback: string = "") => String(requisition?.[k] ?? fallback);
  const fdDate = funding ? today : "";
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const [hodPreviewUrl, setHodPreviewUrl] = useState<string | null>(null);
  const [fdPreviewUrl, setFdPreviewUrl] = useState<string | null>(null);
  const getAccessToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  };
  const getEmail = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("email") || sessionStorage.getItem("email") || "").trim();
  };
  const normalizeSignatureBlob = async (blob: Blob): Promise<string> => {
    try {
      const img = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return URL.createObjectURL(blob);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = (r + g + b) / 3;
        if (avg > 235) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const processed = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      return URL.createObjectURL(processed || blob);
    } catch {
      return URL.createObjectURL(blob);
    }
  };
  useEffect(() => {
    const load = async () => {
      try {
        const path = String(requisition?.["headOfDept"] ?? "");
        if (!path) return;
        const match = path.match(/\/file\/([0-9]+)/);
        const sigId = match?.[1];
        if (!sigId) return;
        const token = getAccessToken();
        const headers: Record<string, string> = { accept: "*/*" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = await normalizeSignatureBlob(blob);
        setHodPreviewUrl(url);
      } catch {}
    };
    load();
  }, [requisition]);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        if (!funding) return;
        const email = getEmail();
        const headers: Record<string, string> = { accept: "*/*" };
        const token = getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/signature/user/email?email=${encodeURIComponent(email)}`, { headers });
        if (!res.ok) return;
        const pathText = await res.text();
        const match = String(pathText || "").trim().match(/\/file\/([0-9]+)/);
        const sigId = match?.[1];
        if (!sigId) return;
        const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers });
        if (!imgRes.ok) return;
        const blob = await imgRes.blob();
        const url = await normalizeSignatureBlob(blob);
        setFdPreviewUrl(url);
      } catch {}
    };
    fetchPreview();
  }, [funding]);

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
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">2. Details of Vendor / Supplier / Service Provider</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          {[
            { label: "Registered Name", field: "vendorRegistedName" },
            { label: "Trading Name", field: "vendorTradingName" },
            { label: "Business Address (physical)", field: "vendorAddress" },
            { label: "Name of Authorized Representative and Capacity", field: "vendorContactPerson" },
            { label: "Contact Number", field: "vendorPhoneNumber" },
            { label: "Email Address", field: "vendorEmail" },
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">{item.label}</div>
              <div className="p-2 border-b border-black">
                {item.field === "vendorAddress" ? (
                  <TextArea readOnly name={item.field} rows={3} defaultValue={val(item.field as keyof Requisition)} className={readOnly + " w-full"} />
                ) : (
                  <Input readOnly name={item.field} defaultValue={val(item.field as keyof Requisition)} className={readOnly + " w-full"} />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="border border-black p-4 mt-8">
        <h2 className="text-md font-semibold text-black mb-2">3. Justification of Contract</h2>
        <TextArea readOnly name="justification" rows={3} defaultValue={val("justification")} className={readOnly + " w-full"} />
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">4. Contract Duration</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract Start Date</div>
          <div className="p-2 border-b border-black">
            <Input readOnly name="startDate" defaultValue={formatDisplayDate(val("startDate"))} className={readOnly} />
          </div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Duration of Contract</div>
          <div className="p-2 border-b border-black grid grid-cols-4 gap-2">
            <Input readOnly name="durationDays" defaultValue={val("durationDays")} className={readOnly + " w-full"} />
            <Input readOnly name="durationWeeks" defaultValue={val("durationWeeks")} className={readOnly + " w-full"} />
            <Input readOnly name="durationMonths" defaultValue={val("durationMonths")} className={readOnly + " w-full"} />
            <Input readOnly name="durationYears" defaultValue={val("durationYears")} className={readOnly + " w-full"} />
          </div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract End Date</div>
          <div className="p-2 border-b border-black">
            <Input readOnly name="endDate" defaultValue={formatDisplayDate(val("endDate"))} className={readOnly} />
          </div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Is the contract subject to renewal?</div>
          <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center text-black opacity-70">
            <label className="flex items-center gap-2"><input type="radio" disabled checked={val("isRenewable") === "YES"} /> Yes</label>
            <label className="flex items-center gap-2"><input type="radio" disabled checked={val("isRenewable", "NO") !== "YES"} /> No</label>
            <span className="ml-4 italic">If yes, for a further:</span>
            <Input readOnly name="renewalWeeks" defaultValue={val("renewalWeeks")} className={readOnly + " w-16"} />
            <Input readOnly name="renewalMonths" defaultValue={val("renewalMonths")} className={readOnly + " w-16"} />
            <Input readOnly name="renewalYears" defaultValue={val("renewalYears")} className={readOnly + " w-16"} />
          </div>
        </div>
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">5. Value of Contract</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract Price</div>
          <div className="p-2 border-b border-black"><Input readOnly name="contractPrice" defaultValue={val("contractPrice")} className={readOnly + " w-full"} /></div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">VAT (or other taxes)</div>
          <div className="p-2 border-b border-black"><Input readOnly name="vat" defaultValue={val("vat")} className={readOnly + " w-full"} /></div>
          <div className="bg-blue-100 italic text-black font-semibold border-r border-black p-3">Total Contract Price</div>
          <div className="p-2 border-b border-black italic"><Input readOnly name="totalContractPrice" defaultValue={val("totalContractPrice")} className={readOnly + " w-full"} /></div>
        </div>
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">6. Payment Terms</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Total amount to be paid in full on signature</div>
          <div className="p-3 border-b border-black"><Input readOnly name="totalOnsignature" defaultValue={val("totalOnsignature")} className={readOnly + " w-full"} /></div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Down payment/deposit</div>
          <div className="p-3 border-b border-black"><Input readOnly name="downPayment" defaultValue={val("downPayment")} className={readOnly + " w-full"} /></div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Balance and payment period</div>
          <div className="p-3 border-b border-black"><TextArea readOnly name="balancePayment" rows={2} defaultValue={val("balancePayment")} className={readOnly + " w-full"} /></div>
        </div>
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">7. Delivery Terms</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Delivery Period</div>
          <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center">
            <Input readOnly name="deliveryDays" defaultValue={val("deliveryDays")} className={readOnly + " w-16"} />
            <Input readOnly name="deliveryWeeks" defaultValue={val("deliveryWeeks")} className={readOnly + " w-16"} />
            <Input readOnly name="deliveryMonths" defaultValue={val("deliveryMonths")} className={readOnly + " w-16"} />
            <label className="flex items-center gap-2 text-black ml-4 opacity-70"><input type="radio" disabled checked={val("deliveryNA") === "YES"} /> N/A</label>
          </div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Penalties for Late Delivery</div>
          <div className="p-3 border-b border-black"><TextArea readOnly name="penalties" rows={2} defaultValue={val("penalties")} className={readOnly + " w-full"} /></div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Acceptance Testing Conditions</div>
          <div className="p-3 border-b border-black"><TextArea readOnly name="acceptanceConditions" rows={2} defaultValue={val("acceptanceConditions")} className={readOnly + " w-full"} /></div>
        </div>
      </div>

      <div className="border border-black mt-8">
        <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">8. Warranty Terms</h2>
        <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Warranty Period</div>
          <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center">
            <Input readOnly name="warrantyDays" defaultValue={val("warrantyDays")} className={readOnly + " w-16"} />
            <Input readOnly name="warrantyWeeks" defaultValue={val("warrantyWeeks")} className={readOnly + " w-16"} />
            <Input readOnly name="warrantyMonths" defaultValue={val("warrantyMonths")} className={readOnly + " w-16"} />
            <label className="flex items-center gap-2 text-black ml-4 opacity-70"><input type="radio" disabled checked={val("warrantyNA") === "YES"} /> N/A</label>
          </div>
          <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Is service level/maintenance support required post warranty period?</div>
          <div className="p-3 border-b border-black flex items-center gap-4 opacity-70">
            <label className="flex items-center gap-2 text-black"><input type="radio" disabled checked={val("serviceSupport") === "YES"} /> Yes</label>
            <label className="flex items-center gap-2 text-black"><input type="radio" disabled checked={val("serviceSupport") === "NO"} /> No</label>
            <label className="flex items-center gap-2 text-black"><input type="radio" disabled checked={val("serviceSupport") === "NA"} /> N/A</label>
          </div>
        </div>
      </div>

      <div className="border border-black p-4 mt-8">
        <h2 className="text-md font-semibold text-black mb-2">9. Other Special Issues to be Incorporated in the Contract</h2>
        <TextArea readOnly name="specialIssues" rows={3} defaultValue={val("specialIssues")} className={readOnly + " w-full"} />
        <p className="italic text-sm mt-2 text-gray-800">(Please specify above)</p>
      </div>

      <div className="border border-black p-4 mt-8">
        <h2 className="text-md font-semibold text-black mb-2">10. Administrative Issues</h2>
        <div className="border border-black text-sm mb-4">
          <div className="flex justify-between items-center border-b border-black p-3">
            <div className="flex items-center gap-3 text-black">
              Funding for the contract price is available:
              <label className="flex items-center gap-2 ml-2">
                <input type="radio" name="funding" value="YES" checked={funding === "YES"} onChange={() => setFunding("YES")} />
                <span className="text-emerald-700 flex items-center gap-1"><CheckLineIcon /> Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="funding" value="NO" checked={funding === "NO"} onChange={() => setFunding("NO")} />
                <span className="text-red-700 flex items-center gap-1"><CloseLineIcon /> No</span>
              </label>
            </div>
          <div className="flex items-center gap-2">
              {fdPreviewUrl ? (
                <div className="border border-gray-400 bg-white p-2 h-12 w-48 relative rounded-md">
                  <Image src={fdPreviewUrl} alt="Finance Director Signature" fill sizes="100%" className="object-contain" />
                </div>
              ) : (
                <Input readOnly name="financeDirector" defaultValue="" placeholder="----------------------------------------------" className={readOnly + " w-48"} />
              )}
              <Input readOnly name="financeDate" defaultValue={formatDisplayDate(fdDate)} placeholder="------------------------------------------------------" className={readOnly + " w-40"} />
          </div>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-black opacity-70">
            <div className="flex items-center gap-3 text-black">
              Procurement Procedures have been complied with:
              <label className="flex items-center gap-1 ml-2"><input type="radio" value="YES" disabled /> Yes</label>
              <label className="flex items-center gap-1"><input type="radio" value="NO" disabled /> No</label>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly name="procurementManager" defaultValue="" placeholder="-----------------------------------" className={readOnly + " w-48"} />
              <Input readOnly name="procurementDate" defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-40"} />
            </div>
          </div>
        </div>
        <div className="border border-black p-4">
            <div className="grid grid-cols-2 gap-6 text-sm text-black">
            <div>
              {hodPreviewUrl ? (
                <div className="border border-gray-400 bg-white p-2 h-12 w-3/4 mb-2 relative rounded-md">
                  <Image src={hodPreviewUrl} alt="HOD Signature" fill sizes="100%" className="object-contain" />
                </div>
              ) : null}
              <h2 className="text-md font-semibold text-black mb-2">Head of Department</h2>
            </div>
            <div>
              <Input readOnly defaultValue={formatDisplayDate(today)} className={readOnly + " w-3/4 mb-1"} />
              <div>Date</div>
            </div>
          </div>
        </div>

        <p className="mt-6 font-semibold text-black">Received by Legal Department:</p>
        <div className="grid grid-cols-2 gap-6 mt-2 text-sm text-black">
          <div>
            <Input readOnly defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-3/4 mb-1"} />
            <div>Company Secretary</div>
          </div>
          <div>
            <Input readOnly defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-3/4 mb-1"} />
            <div>Date</div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" className="rounded-full text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={onCancel}>Cancel</Button>
        <Button size="sm" variant="outline" className="rounded-full text-green-700 ring-1 ring-inset ring-green-300 hover:bg-green-50" onClick={() => funding && onSubmit(funding)} disabled={submitting || !funding}>{submitting ? "Submitting..." : "Submit"}</Button>
      </div>
      <footer className="text-xs text-center text-gray-500 mt-10 italic">PowerTel Communications — Imagine it. Live it.</footer>
    </div>
  );
}