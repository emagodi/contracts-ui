"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";

export default function ApprovalForm() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);
  const [technicalPreviewUrl, setTechnicalPreviewUrl] = useState<string | null>(null);
  const [financialPreviewUrl, setFinancialPreviewUrl] = useState<string | null>(null);
  const [commercialPreviewUrl, setCommercialPreviewUrl] = useState<string | null>(null);
  const [bdPreviewUrl, setBdPreviewUrl] = useState<string | null>(null);
  const [procPreviewUrl, setProcPreviewUrl] = useState<string | null>(null);

  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const fromLocal = localStorage.getItem("access_token");
    const fromSession = sessionStorage.getItem("access_token");
    return (fromLocal || fromSession || "").trim();
  };

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    const headers: Record<string, string> = { accept: "*/*" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const currentDateStandard = new Date().toISOString().split('T')[0];
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const month = d.toLocaleString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const currentDateDisplay = formatDisplayDate(new Date().toISOString());

  const [formData, setFormData] = useState({
    approvalTo: "",
    approvalDate: currentDateStandard, // Store the current date in standard format
    approvalReference: "",
    approvalSubject: "",
    legalSignature: "APPROVE",
    legalSignatureDate: currentDateStandard, // Store the current date in standard format
    legalComments: "",
    technicalSignature: "",
    technicalSignatureDate: "",
    technicalComments: "",
    financialSignature: "",
    financialSignatureDate: "",
    financialComments: "",
    commercialSignature: "",
    commercialSignatureDate: "",
    commercialComments: "",
    businessDevelopmentSignature: "",
    businessDevelopmentSignatureDate: "",
    businessDevelopmentComments: "",
    procurementSignature: "",
    procurementSignatureDate: "",
    procurementComments: "",
    approvalStatus: "PENDING",
  });

  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setConfirmOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/approvals/${id}`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          technicalSignature: String(data?.technicalSignature || prev.technicalSignature || ""),
          technicalSignatureDate: String(data?.technicalSignatureDate || prev.technicalSignatureDate || ""),
          technicalComments: String(data?.technicalComments || prev.technicalComments || ""),
          financialSignature: String(data?.financialSignature || prev.financialSignature || ""),
          financialSignatureDate: String(data?.financialSignatureDate || prev.financialSignatureDate || ""),
          financialComments: String(data?.financialComments || prev.financialComments || ""),
          commercialSignature: String(data?.commercialSignature || prev.commercialSignature || ""),
          commercialSignatureDate: String(data?.commercialSignatureDate || prev.commercialSignatureDate || ""),
          commercialComments: String(data?.commercialComments || prev.commercialComments || ""),
          businessDevelopmentSignature: String(data?.businessDevelopmentSignature || prev.businessDevelopmentSignature || ""),
          businessDevelopmentSignatureDate: String(data?.businessDevelopmentSignatureDate || prev.businessDevelopmentSignatureDate || ""),
          businessDevelopmentComments: String(data?.businessDevelopmentComments || prev.businessDevelopmentComments || ""),
          procurementSignature: String(data?.procurementSignature || prev.procurementSignature || ""),
          procurementSignatureDate: String(data?.procurementSignatureDate || prev.procurementSignatureDate || ""),
          procurementComments: String(data?.procurementComments || prev.procurementComments || ""),
        }));
      } catch {
        /* removed empty catch */
      }
    };
    load();
  }, [id, authHeaders]);

  useEffect(() => {
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
    const load = async (value: string | undefined | null, setUrl: (v: string | null) => void) => {
      try {
        const v = String(value || "").trim();
        if (!v) return;
        const match = v.match(/\/file\/([0-9]+)/);
        const sigId = match?.[1];
        if (!sigId) return;
        const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers: authHeaders() });
        if (!imgRes.ok) return;
        const blob = await imgRes.blob();
        const url = await normalizeSignatureBlob(blob);
        setUrl(url);
      } catch {}
    };
    load(formData.technicalSignature, setTechnicalPreviewUrl);
    load(formData.financialSignature, setFinancialPreviewUrl);
    load(formData.commercialSignature, setCommercialPreviewUrl);
    load(formData.businessDevelopmentSignature, setBdPreviewUrl);
    load(formData.procurementSignature, setProcPreviewUrl);
  }, [formData, authHeaders]);

  const getEmail = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("email") || sessionStorage.getItem("email") || "").trim();
  };

  const signLegal = async () => {
    try {
      setMessage(null);
      const email = getEmail();
      if (!email) throw new Error("Missing user email");
      const pathRes = await fetch(`/api/signature/user/email?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
      if (!pathRes.ok) throw new Error(await pathRes.text());
      const pathText = await pathRes.text();
      const path = String(pathText || "").trim();
      if (!path) throw new Error("Signature path not found");
      setSignaturePath(path);
      const match = path.match(/\/file\/([0-9]+)/);
      const sigId = match?.[1];
      if (!sigId) throw new Error("Invalid signature path");
      const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers: authHeaders() });
      if (!imgRes.ok) throw new Error(await imgRes.text());
      const blob = await imgRes.blob();
      const normalize = async (b: Blob) => {
        try {
          const img = await createImageBitmap(b);
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return URL.createObjectURL(b);
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b2 = data[i + 2];
            const avg = (r + g + b2) / 3;
            if (avg > 235) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }
          ctx.putImageData(imageData, 0, 0);
          const processed = await new Promise<Blob | null>((resolve) => canvas.toBlob((bb) => resolve(bb), "image/png"));
          return URL.createObjectURL(processed || b);
        } catch {
          return URL.createObjectURL(b);
        }
      };
      const url = await normalize(blob);
      setSignaturePreviewUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: `Failed to load signature: ${msg}` });
    }
  };

  const confirmSubmit = async () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          ...formData,
          legalSignatureDate: currentDateStandard,
          approvalStatus: formData.legalSignature === "APPROVE" ? "LEGAL_APPROVED" : "LEGAL_REJECTED",
        };
        if (signaturePath) payload.legalSignature = signaturePath;
        const res = await fetch(`/api/requisitions/${id}/approval`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        setConfirmOpen(false);
        setMessage({ type: "success", text: "✅ Approval submitted successfully!" });
        setFormData(prev => ({ ...prev, legalComments: "" }));
        router.push("/requisitions/approvals");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage({ type: "error", text: `❌ Failed to submit approval: ${msg}` });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white border-2 border-black shadow-lg rounded-sm p-10 text-gray-900">
      {/* HEADER */}
      <div className="border border-black rounded-sm overflow-hidden mb-8">
        {/* Logo */}
        <div className="flex justify-end pr-4 pt-4">
          <Image src="/images/powertel.png" alt="PowerTel Logo" width={140} height={60} />
        </div>

        {/* Blue Bar */}
        <div className="bg-blue-200 border-t border-b border-black py-3 text-center">
          <h1 className="text-lg font-bold underline text-black uppercase">
            Contract Approval Form
          </h1>
        </div>

        {/* Info Fields */}
        <div className="p-6 text-sm text-black space-y-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">TO:</span>
            <div className="flex-1 mr-2">
              <Input
                name="approvalTo"
                value={formData.approvalTo}
                onChange={handleChange}
                placeholder="Managing Director (A)"
                className="border border-gray-400 text-black bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">Date:</span>
            <span className="flex-1 mr-2 border border-gray-400 text-black bg-white p-2">{currentDateDisplay}</span>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-semibold w-20">RE:</span>
            <div className="flex-1 mr-2">
              <TextArea
                name="approvalReference"
                value={formData.approvalReference}
                onChange={handleChange}
                placeholder="Supply and Delivery of EDFA Multiplexers between Powertel and Compulink Systems (Private) Limited."
                className="border border-gray-400 text-black bg-white"
                rows={4}
              />
            </div>
          </div>

          {/* Instruction Paragraph */}
          <p className="mt-3 text-gray-800">
            Heads of Departments have confirmed that the legal, technical,
            commercial and financial aspects of the contracts are in order.
            You may therefore proceed to append your signature and initial all
            the pages of the contract.
          </p>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 text-black">
        {/* SECTION 1 - LEGAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">1. Legal Department</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {signaturePreviewUrl ? (
                <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                  <Image src={signaturePreviewUrl} alt="Signature" fill sizes="100%" className="object-contain" />
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={signLegal}>Sign</Button>
              )}
              <select
                name="legalSignature"
                value={formData.legalSignature}
                onChange={handleChange}
                className="border border-gray-400 text-black bg-white rounded-md"
              >
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
            <span className="border border-gray-400 text-black bg-white p-2 rounded-md">{currentDateDisplay}</span>
          </div>
          <TextArea
            name="legalComments"
            value={formData.legalComments}
            onChange={handleChange}
            placeholder="Legal Department Comments"
            className="mt-3 border border-gray-400 text-black bg-white rounded-md"
          />
        </div>

        {/* SECTION 2 - TECHNICAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">2. Technical Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {technicalPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={technicalPreviewUrl} alt="Technical Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="technicalSignature"
                value={String(formData.technicalSignature || "").startsWith("/") ? "" : formData.technicalSignature}
                readOnly
                placeholder="Technical Signature"
                className="border border-gray-400 text-gray-500 bg-gray-200"
              />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(formData.technicalSignatureDate)}</span>
          </div>
          <TextArea
            value={formData.technicalComments}
            readOnly
            placeholder="Technical Comments"
            className="mt-3 border border-gray-400 text-gray-500 bg-gray-200"
          />
        </div>

        {/* SECTION 3 - FINANCIAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">3. Financial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {financialPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={financialPreviewUrl} alt="Financial Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="financialSignature"
                value={String(formData.financialSignature || "").startsWith("/") ? "" : formData.financialSignature}
                readOnly
                placeholder="Financial Signature"
                className="border border-gray-400 text-gray-500 bg-gray-200"
              />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(formData.financialSignatureDate)}</span>
          </div>
          <TextArea
            value={formData.financialComments}
            readOnly
            placeholder="Financial Comments"
            className="mt-3 border border-gray-400 text-gray-500 bg-gray-200"
          />
        </div>

        {/* SECTION 4 - COMMERCIAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">4. Commercial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {commercialPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={commercialPreviewUrl} alt="Commercial Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="commercialSignature"
                value={String(formData.commercialSignature || "").startsWith("/") ? "" : formData.commercialSignature}
                readOnly
                placeholder="Commercial Signature"
                className="border border-gray-400 text-gray-500 bg-gray-200"
              />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(formData.commercialSignatureDate)}</span>
          </div>
          <TextArea
            value={formData.commercialComments}
            readOnly
            placeholder="Commercial Comments"
            className="mt-3 border border-gray-400 text-gray-500 bg-gray-200"
          />
        </div>

        {/* SECTION 5 - BUSINESS DEVELOPMENT */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">5. Business Development</h2>
          <div className="grid grid-cols-2 gap-4">
            {bdPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={bdPreviewUrl} alt="Business Development Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="businessDevelopmentSignature"
                value={String(formData.businessDevelopmentSignature || "").startsWith("/") ? "" : formData.businessDevelopmentSignature}
                readOnly
                placeholder="Business Development Signature"
                className="border border-gray-400 text-gray-500 bg-gray-200"
              />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(formData.businessDevelopmentSignatureDate)}</span>
          </div>
          <TextArea
            value={formData.businessDevelopmentComments}
            readOnly
            placeholder="Business Development Comments"
            className="mt-3 border border-gray-400 text-gray-500 bg-gray-200"
          />
        </div>

        {/* SECTION 6 - PROCUREMENT */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">6. Procurement Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {procPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-md">
                <Image src={procPreviewUrl} alt="Procurement Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="procurementSignature"
                value={String(formData.procurementSignature || "").startsWith("/") ? "" : formData.procurementSignature}
                readOnly
                placeholder="Procurement Signature"
                className="border border-gray-400 text-gray-500 bg-gray-200"
              />
            )}
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formatDisplayDate(formData.procurementSignatureDate)}</span>
          </div>
          <TextArea
            value={formData.procurementComments}
            readOnly
            placeholder="Procurement Comments"
            className="mt-3 border border-gray-400 text-gray-500 bg-gray-200"
          />
        </div>

        {/* FEEDBACK */}
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-900 hover:bg-blue-700 text-white font-semibold mt-6"
      >
        {isPending ? "Submitting..." : "Submit Approval"}
      </Button>
    </form>
    <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-[560px] p-6 lg:p-10">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-sky-800">Confirm Legal Approval</h3>
        <p className="text-sm text-gray-700 mb-4">Decision: {formData.legalSignature === "APPROVE" ? "APPROVE" : "REJECT"}</p>
        <div className="mt-2 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={confirmSubmit} disabled={isPending}>Confirm</Button>
        </div>
      </div>
    </Modal>
  </div>
  );
}