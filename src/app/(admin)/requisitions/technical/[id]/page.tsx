"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";

export default function TechApprovalForm() {
  const { id } = useParams();
  const router = useRouter();
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);
  const [techDecision, setTechDecision] = useState<"" | "APPROVE" | "REJECT">("");
  const [legalPreviewUrl, setLegalPreviewUrl] = useState<string | null>(null);
  const [financialPreviewUrl, setFinancialPreviewUrl] = useState<string | null>(null);
  const [commercialPreviewUrl, setCommercialPreviewUrl] = useState<string | null>(null);
  const [bdPreviewUrl, setBdPreviewUrl] = useState<string | null>(null);
  const [procPreviewUrl, setProcPreviewUrl] = useState<string | null>(null);

  // Current date in ISO format for backend
  const currentDateISO = new Date().toISOString(); 

  const formatDateForDisplay = (dateString: string) => {
    const d = new Date(dateString);
    const month = d.toLocaleString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const [formData, setFormData] = useState({
    approvalTo: "",
    approvalDate: currentDateISO,
    approvalSubject: "",
    legalSignature: "",
    legalSignatureDate: "",
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
    approvalStatus: "PENDING", // Default status
    approvalReference: "", // Added approvalReference
  });

  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const fromLocal = localStorage.getItem("access_token");
    const fromSession = sessionStorage.getItem("access_token");
    return (fromLocal || fromSession || "").trim();
  };

  useEffect(() => {
    const fetchApprovalDetails = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const resApprovalDetails = await fetch(`http://localhost:8080/api/v1/approvals/find/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resApprovalDetails.ok) throw new Error(await resApprovalDetails.text());
        const data = await resApprovalDetails.json();
        setApprovalId(String(data.id ?? ""));
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage({ type: "error", text: `❌ Failed to fetch approval details: ${msg}` });
      }
    };
    fetchApprovalDetails();
  }, [id]);

  useEffect(() => {
    const token = getAccessToken();
    const headers: Record<string, string> = { accept: "*/*" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const load = async (value: string | undefined | null, setUrl: (v: string | null) => void) => {
      try {
        const v = String(value || "").trim();
        if (!v) return;
        const match = v.match(/\/file\/([0-9]+)/);
        const sigId = match?.[1];
        if (!sigId) return;
        const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers });
        if (!imgRes.ok) return;
        const blob = await imgRes.blob();
        const url = URL.createObjectURL(blob);
        setUrl(url);
      } catch {}
    };
    load(formData.legalSignature, setLegalPreviewUrl);
    load(formData.financialSignature, setFinancialPreviewUrl);
    load(formData.commercialSignature, setCommercialPreviewUrl);
    load(formData.businessDevelopmentSignature, setBdPreviewUrl);
    load(formData.procurementSignature, setProcPreviewUrl);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const status = value === "APPROVE" ? "TECHNICAL_APPROVED" : value === "REJECT" ? "TECHNICAL_REJECTED" : "PENDING";
    setFormData((prev) => ({
      ...prev,
      technicalSignatureDate: currentDateISO,
      approvalStatus: status,
    }));
    setTechDecision(value as "" | "APPROVE" | "REJECT");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setConfirmOpen(true);
  };

  const getEmail = () => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("email") || sessionStorage.getItem("email") || "").trim();
  };

  const signTechnical = async () => {
    try {
      setMessage(null);
      const email = getEmail();
      if (!email) throw new Error("Missing user email");
      const token = getAccessToken();
      const headers: Record<string, string> = { accept: "*/*" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const pathRes = await fetch(`/api/signature/user/email?email=${encodeURIComponent(email)}`, { headers });
      if (!pathRes.ok) throw new Error(await pathRes.text());
      const pathText = await pathRes.text();
      const path = String(pathText || "").trim();
      if (!path) throw new Error("Signature path not found");
      setSignaturePath(path);
      const match = path.match(/\/file\/([0-9]+)/);
      const sigId = match?.[1];
      if (!sigId) throw new Error("Invalid signature path");
      const imgRes = await fetch(`/api/signature/file/${encodeURIComponent(sigId)}`, { headers });
      if (!imgRes.ok) throw new Error(await imgRes.text());
      const blob = await imgRes.blob();
      const url = URL.createObjectURL(blob);
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
        const token = getAccessToken();
        if (!token || !approvalId) throw new Error("Unauthorized");
        const updateBody: Record<string, unknown> = {
          ...formData,
          technicalSignatureDate: currentDateISO,
          technicalComments: formData.technicalComments,
        };
        updateBody.technicalSignature = signaturePath ? signaturePath : undefined;
        const res = await fetch(`http://localhost:8080/api/v1/approvals/update/${approvalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updateBody),
        });
        if (!res.ok) throw new Error(await res.text());

        const postPayload: Record<string, unknown> = {
          approvalStatus: formData.approvalStatus,
          technicalSignatureDate: currentDateISO,
          technicalComments: formData.technicalComments,
        };
        if (signaturePath) postPayload.technicalSignature = signaturePath;
        await fetch(`/api/requisitions/${id}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(postPayload),
        });
        setConfirmOpen(false);
        setMessage({ type: "success", text: "✅ Technical decision submitted." });
        router.push("/requisitions/technical");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage({ type: "error", text: `❌ Failed to update approval details: ${msg}` });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white border-2 border-black shadow-lg rounded-sm p-10 text-gray-900">
      {/* HEADER */}
      <div className="border border-black rounded-sm overflow-hidden mb-8">
        <div className="flex justify-end pr-4 pt-4">
          <Image
            src="/images/powertel.png"
            alt="PowerTel Logo"
            width={140}
            height={60}
          />
        </div>
        <div className="bg-blue-200 border-t border-b border-black py-3 text-center">
          <h1 className="text-lg font-bold underline text-black uppercase">
            Technical Approval Form
          </h1>
        </div>
        <div className="p-6 text-sm text-black space-y-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">TO:</span>
            <Input
              name="approvalTo"
              value={formData.approvalTo}
              onChange={handleInputChange}
              readOnly
              className="w-full border border-gray-400 text-black rounded-lg"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold w-20">Date:</span>
            <span className="border border-gray-400 text-black bg-white p-2 rounded-lg">
              {formatDateForDisplay(formData.approvalDate)}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-semibold w-20">RE:</span>
            <span className="border border-gray-400 text-black bg-white p-2 rounded-lg w-full">
              {formData.approvalReference}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 text-black">
        
        {/* SECTION 1 - LEGAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">1. Legal Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {legalPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                <Image src={legalPreviewUrl} alt="Legal Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="legalSignature"
                value={String(formData.legalSignature || "").startsWith("/") ? "" : formData.legalSignature}
                onChange={handleInputChange}
                readOnly
                placeholder="Legal Signature"
                className="border border-gray-400 text-black rounded-lg"
              />
            )}
            <Input
              name="legalSignatureDate"
              value={formData.legalSignatureDate ? formatDateForDisplay(formData.legalSignatureDate) : ""}
              readOnly
              placeholder="Legal Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="legalComments"
            value={formData.legalComments}
            onChange={handleTextareaChange}
            readOnly
            placeholder="Legal Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* SECTION 2 - TECHNICAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">2. Technical Department</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {signaturePreviewUrl ? (
                <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                  <Image src={signaturePreviewUrl} alt="Signature" fill sizes="100%" className="object-contain" />
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={signTechnical}>Sign</Button>
              )}
              <select
                name="technicalSignature"
                value={techDecision}
                onChange={handleSelectChange}
                className="border border-gray-400 text-black rounded-lg"
              >
                <option value="">Select</option>
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
            <Input
              name="technicalSignatureDate"
              value={formData.technicalSignatureDate ? formatDateForDisplay(formData.technicalSignatureDate) : ""}
              readOnly
              placeholder="Technical Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="technicalComments"
            value={formData.technicalComments}
            onChange={handleTextareaChange}
            placeholder="Technical Department Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* SECTION 3 - FINANCIAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">3. Financial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {financialPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                <Image src={financialPreviewUrl} alt="Financial Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="financialSignature"
                value={String(formData.financialSignature || "").startsWith("/") ? "" : formData.financialSignature}
                onChange={handleInputChange}
                readOnly
                placeholder="Financial Signature"
                className="border border-gray-400 text-black rounded-lg"
              />
            )}
            <Input
              name="financialSignatureDate"
              value={formData.financialSignatureDate ? formatDateForDisplay(formData.financialSignatureDate) : ""}
              readOnly
              placeholder="Financial Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="financialComments"
            value={formData.financialComments}
            onChange={handleTextareaChange}
            readOnly
            placeholder="Financial Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* SECTION 4 - COMMERCIAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">4. Commercial Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {commercialPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                <Image src={commercialPreviewUrl} alt="Commercial Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="commercialSignature"
                value={String(formData.commercialSignature || "").startsWith("/") ? "" : formData.commercialSignature}
                onChange={handleInputChange}
                readOnly
                placeholder="Commercial Signature"
                className="border border-gray-400 text-black rounded-lg"
              />
            )}
            <Input
              name="commercialSignatureDate"
              value={formData.commercialSignatureDate ? formatDateForDisplay(formData.commercialSignatureDate) : ""}
              readOnly
              placeholder="Commercial Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="commercialComments"
            value={formData.commercialComments}
            onChange={handleTextareaChange}
            readOnly
            placeholder="Commercial Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* SECTION 5 - BUSINESS DEVELOPMENT */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">5. Business Development</h2>
          <div className="grid grid-cols-2 gap-4">
            {bdPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                <Image src={bdPreviewUrl} alt="Business Development Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="businessDevelopmentSignature"
                value={String(formData.businessDevelopmentSignature || "").startsWith("/") ? "" : formData.businessDevelopmentSignature}
                onChange={handleInputChange}
                readOnly
                placeholder="Business Development Signature"
                className="border border-gray-400 text-black rounded-lg"
              />
            )}
            <Input
              name="businessDevelopmentSignatureDate"
              value={formData.businessDevelopmentSignatureDate ? formatDateForDisplay(formData.businessDevelopmentSignatureDate) : ""}
              readOnly
              placeholder="Business Development Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="businessDevelopmentComments"
            value={formData.businessDevelopmentComments}
            onChange={handleTextareaChange}
            readOnly
            placeholder="Business Development Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* SECTION 6 - PROCUREMENT */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">6. Procurement Department</h2>
          <div className="grid grid-cols-2 gap-4">
            {procPreviewUrl ? (
              <div className="border border-gray-400 bg-white p-2 h-12 w-full relative rounded-lg">
                <Image src={procPreviewUrl} alt="Procurement Signature" fill sizes="100%" className="object-contain" />
              </div>
            ) : (
              <Input
                name="procurementSignature"
                value={String(formData.procurementSignature || "").startsWith("/") ? "" : formData.procurementSignature}
                onChange={handleInputChange}
                readOnly
                placeholder="Procurement Signature"
                className="border border-gray-400 text-black rounded-lg"
              />
            )}
            <Input
              name="procurementSignatureDate"
              value={formData.procurementSignatureDate ? formatDateForDisplay(formData.procurementSignatureDate) : ""}
              readOnly
              placeholder="Procurement Signature Date"
              className="border border-gray-400 text-black rounded-lg"
            />
          </div>
          <TextArea
            name="procurementComments"
            value={formData.procurementComments}
            onChange={handleTextareaChange}
            readOnly
            placeholder="Procurement Comments"
            className="mt-3 border border-gray-400 text-black rounded-lg"
          />
        </div>

        {/* FEEDBACK */}
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-900 hover:bg-blue-700 text-white font-semibold mt-6"
        >
          {isPending ? "Submitting..." : "Update Approval Details"}
        </Button>
      </form>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-[560px] p-6 lg:p-10">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-sky-800">Confirm Technical Decision</h3>
          <p className="text-sm text-gray-700 mb-4">Decision: {formData.technicalSignature === "APPROVE" ? "APPROVE" : formData.technicalSignature === "REJECT" ? "REJECT" : ""}</p>
          <div className="mt-2 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={confirmSubmit} disabled={isPending}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}