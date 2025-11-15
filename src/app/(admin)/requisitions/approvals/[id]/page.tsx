"use client";

import React, { useState, useTransition, useCallback } from "react";
import { useParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";

export default function ApprovalForm() {
  const params = useParams();
  const id = params?.id as string;
  const [isPending, startTransition] = useTransition();

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

  // Store the date in standard format (yyyy-MM-dd) and display in desired format
  const currentDateStandard = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
  const currentDateDisplay = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [formData, setFormData] = useState({
    approvalTo: "",
    approvalDate: currentDateStandard, // Store the current date in standard format
    approvalReference: "",
    approvalSubject: "",
    legalSignature: "APPROVE", // Default to APPROVE
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

    startTransition(async () => {
      try {
        const res = await fetch(`/api/requisitions/${id}/approval`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            legalSignatureDate: currentDateStandard,
            approvalStatus: formData.legalSignature === "APPROVE" ? "LEGAL_APPROVED" : "LEGAL_REJECTED",
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        setMessage({ type: "success", text: "✅ Approval submitted successfully!" });
        setFormData(prev => ({
          ...prev,
          legalComments: "",
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage({
          type: "error",
          text: `❌ Failed to submit approval: ${msg}`,
        });
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
            <select
              name="legalSignature"
              value={formData.legalSignature}
              onChange={handleChange}
              className="border border-gray-400 text-black bg-white"
            >
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
            </select>
            <span className="border border-gray-400 text-black bg-white p-2">{currentDateDisplay}</span>
          </div>
          <TextArea
            name="legalComments"
            value={formData.legalComments}
            onChange={handleChange}
            placeholder="Legal Department Comments"
            className="mt-3 border border-gray-400 text-black bg-white"
          />
        </div>

        {/* SECTION 2 - TECHNICAL */}
        <div className="border border-black p-4">
          <h2 className="font-semibold mb-3 text-black">2. Technical Department</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="technicalSignature"
              value={formData.technicalSignature}
              readOnly
              placeholder="Technical Signature"
              className="border border-gray-400 text-gray-500 bg-gray-200"
            />
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formData.technicalSignatureDate}</span>
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
            <Input
              name="financialSignature"
              value={formData.financialSignature}
              readOnly
              placeholder="Financial Signature"
              className="border border-gray-400 text-gray-500 bg-gray-200"
            />
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formData.financialSignatureDate}</span>
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
            <Input
              name="commercialSignature"
              value={formData.commercialSignature}
              readOnly
              placeholder="Commercial Signature"
              className="border border-gray-400 text-gray-500 bg-gray-200"
            />
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formData.commercialSignatureDate}</span>
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
            <Input
              name="businessDevelopmentSignature"
              value={formData.businessDevelopmentSignature}
              readOnly
              placeholder="Business Development Signature"
              className="border border-gray-400 text-gray-500 bg-gray-200"
            />
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formData.businessDevelopmentSignatureDate}</span>
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
            <Input
              name="procurementSignature"
              value={formData.procurementSignature}
              readOnly
              placeholder="Procurement Signature"
              className="border border-gray-400 text-gray-500 bg-gray-200"
            />
            <span className="border border-gray-400 text-gray-500 bg-gray-200 p-2">{formData.procurementSignatureDate}</span>
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
    </div>
  );
}