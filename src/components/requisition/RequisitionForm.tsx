"use client";

import React, { useTransition, useState, useRef } from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Validation is handled server-side. This component uses native form fields.

export default function RequisitionForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const getAccessToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    fd.forEach((v, k) => {
      values[k] = String(v);
    });

    values.headDate = today;
    if (values.headOfDept === "APPROVED") {
      values.requisitionStatus = "SUBMITTED";
    } else if (values.headOfDept === "REJECTED") {
      values.requisitionStatus = "HOD_REJECTED";
    } else {
      values.requisitionStatus = "SUBMITTED";
    }

    if (!values.isRenewable) values.isRenewable = "NO";
    if (!values.deliveryNA) values.deliveryNA = "NO";
    if (!values.warrantyNA) values.warrantyNA = "NO";
    if (!values.serviceSupport) values.serviceSupport = "NO";
    if (!values.fundingAvailable) values.fundingAvailable = "NO";
    if (!values.procurementComplied) values.procurementComplied = "NO";

    startTransition(async () => {
      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error("User is not authenticated");
        }

        const res = await fetch("http://localhost:8080/api/v1/requisitions/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to create requisition: ${text}`);
        }

        formRef.current?.reset();
        setShowSuccessModal(true);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Submission failed");
        }
      }
    });
  };

  // removed legacy onSubmit from react-hook-form

  const readOnly = "border border-gray-400 bg-gray-100 text-gray-600 cursor-not-allowed";

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white border-2 border-black shadow-lg rounded-sm p-10 text-gray-900">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* HEADER */}
          <div className="border border-black rounded-sm overflow-hidden">
            <div className="flex justify-end pr-4 pt-4">
              <Image src="/images/powertel.png" alt="PowerTel Logo" width={120} height={60} />
            </div>
            <div className="bg-blue-200 border-t border-b border-black py-3 text-center">
              <h1 className="text-lg font-bold underline text-black uppercase">
                Contract Requisition Form
              </h1>
            </div>
            <div className="p-6 text-sm text-gray-900 space-y-3">
              <div className="flex items-center gap-4">
                <span className="font-semibold w-20 text-black">TO:</span>
                <Input name="requisitionTo" placeholder="" className="w-full border border-gray-400 text-black bg-white" />
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-20 text-black">From:</span>
                <Input name="requisitionFrom" placeholder="" className="w-full border border-gray-400 text-black bg-white" />
              </div>
              <div className="flex items-center gap-4">
  <span className="font-semibold w-20 text-black">Date:</span>
  <Input 
    type="date" 
    readOnly 
    name="date"
    defaultValue={today}
    className="border border-gray-400 bg-gray-100 text-black cursor-not-allowed w-1/3" 
  />
</div>


              <p className="mt-4 text-gray-800">
                I hereby request the Legal Department to prepare the contract described below:
              </p>
            </div>
          </div>

          {/* SECTION 1 */}
          <div className="border border-black p-4">
            <h2 className="text-md font-semibold text-black mb-2">1. Contract Description</h2>
            <TextArea name="description" rows={3} placeholder="" className="border border-gray-400 text-black bg-white w-full" />
          </div>

          {/* SECTION 2 */}
          <div className="border border-black">
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
                      <TextArea name={item.field} rows={3} className="border border-gray-400 text-black bg-white w-full" />
                    ) : (
                      <Input name={item.field} className="border border-gray-400 text-black bg-white w-full" />
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="border border-black p-4">
            <h2 className="text-md font-semibold text-black mb-2">3. Justification of Contract</h2>
            <TextArea name="justification" rows={3} placeholder="Provide reason or business justification for this contract..." className="border border-gray-400 text-black bg-white w-full" />
          </div>

          {/* SECTION 4 */}
          <div className="border border-black">
            <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">4. Contract Duration</h2>
            <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract Start Date</div>
              <div className="p-2 border-b border-black">
                <Input type="date" name="startDate" onKeyDown={(e) => e.preventDefault()} className="border border-gray-400 text-black bg-white" />
              </div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Duration of Contract</div>
              <div className="p-2 border-b border-black grid grid-cols-4 gap-2">
                <Input name="durationDays" placeholder="Days" className="border border-gray-400 text-black bg-white w-full" />
                <Input name="durationWeeks" placeholder="Weeks" className="border border-gray-400 text-black bg-white w-full" />
                <Input name="durationMonths" placeholder="Months" className="border border-gray-400 text-black bg-white w-full" />
                <Input name="durationYears" placeholder="Years" className="border border-gray-400 text-black bg-white w-full" />
              </div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract End Date</div>
              <div className="p-2 border-b border-black">
                <Input type="date" name="endDate" onKeyDown={(e) => e.preventDefault()} className="border border-gray-400 text-black bg-white" />
              </div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Is the contract subject to renewal?</div>
              <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center text-black">
                <label className="flex items-center gap-2"><input type="radio" name="isRenewable" value="YES" /> Yes</label>
                <label className="flex items-center gap-2"><input type="radio" name="isRenewable" value="NO" defaultChecked /> No</label>
                <span className="ml-4 italic">If yes, for a further:</span>
                <Input name="renewalWeeks" placeholder="Weeks" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="renewalMonths" placeholder="Months" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="renewalYears" placeholder="Years" className="w-16 border border-gray-400 text-black bg-white" />
              </div>
            </div>
          </div>

          {/* SECTION 5 */}
          <div className="border border-black">
            <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">5. Value of Contract</h2>
            <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Contract Price</div>
              <div className="p-2 border-b border-black"><Input name="contractPrice" placeholder="US$0.00" className="border border-gray-400 text-black bg-white w-full" /></div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">VAT (or other taxes)</div>
              <div className="p-2 border-b border-black"><Input name="vat" placeholder="US$0.00" className="border border-gray-400 text-black bg-white w-full" /></div>
              <div className="bg-blue-100 italic text-black font-semibold border-r border-black p-3">Total Contract Price</div>
              <div className="p-2 border-b border-black italic"><Input name="totalContractPrice" placeholder="US$0.00" className="border border-gray-400 text-black bg-white w-full" /></div>
            </div>
          </div>

          {/* SECTION 6 */}
          <div className="border border-black">
            <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">6. Payment Terms</h2>
            <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Total amount to be paid in full on signature</div>
              <div className="p-3 border-b border-black"><Input name="totalOnsignature" placeholder="US$" className="border border-gray-400 text-black bg-white w-full" /></div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Down payment/deposit</div>
              <div className="p-3 border-b border-black"><Input name="downPayment" placeholder="$0.00 or %" className="border border-gray-400 text-black bg-white w-full" /></div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Balance and payment period</div>
              <div className="p-3 border-b border-black"><TextArea name="balancePayment" rows={2} className="border border-gray-400 text-black bg-white w-full" /></div>
            </div>
          </div>

          {/* SECTION 7 */}
          <div className="border border-black">
            <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">7. Delivery Terms</h2>
            <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Delivery Period</div>
              <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center">
                <Input name="deliveryDays" placeholder="Days" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="deliveryWeeks" placeholder="Weeks" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="deliveryMonths" placeholder="Months" className="w-16 border border-gray-400 text-black bg-white" />
                <label className="flex items-center gap-2 text-black ml-4"><input type="radio" name="deliveryNA" value="YES" /> N/A</label>
              </div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Penalties for Late Delivery</div>
              <div className="p-3 border-b border-black"><TextArea name="penalties" rows={2} className="border border-gray-400 text-black bg-white w-full" /></div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Acceptance Testing Conditions</div>
              <div className="p-3 border-b border-black"><TextArea name="acceptanceConditions" rows={2} className="border border-gray-400 text-black bg-white w-full" /></div>
            </div>
          </div>

          {/* SECTION 8 */}
          <div className="border border-black">
            <h2 className="text-md font-semibold text-black mb-2 p-4 pb-0">8. Warranty Terms</h2>
            <div className="grid grid-cols-[250px_1fr] border-t border-black text-sm">
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Warranty Period</div>
              <div className="p-3 border-b border-black flex flex-nowrap gap-4 items-center">
                <Input name="warrantyDays" placeholder="Days" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="warrantyWeeks" placeholder="Weeks" className="w-16 border border-gray-400 text-black bg-white" />
                <Input name="warrantyMonths" placeholder="Months" className="w-16 border border-gray-400 text-black bg-white" />
                <label className="flex items-center gap-2 text-black ml-4"><input type="radio" name="warrantyNA" value="YES" /> N/A</label>
              </div>
              <div className="bg-blue-100 text-black font-semibold border-r border-black p-3">Is service level/maintenance support required post warranty period?</div>
              <div className="p-3 border-b border-black flex items-center gap-4">
                <label className="flex items-center gap-2 text-black"><input type="radio" name="serviceSupport" value="YES" /> Yes</label>
                <label className="flex items-center gap-2 text-black"><input type="radio" name="serviceSupport" value="NO" defaultChecked /> No</label>
                <label className="flex items-center gap-2 text-black"><input type="radio" name="serviceSupport" value="NA" /> N/A</label>
              </div>
            </div>
          </div>

          {/* SECTION 9 */}
          <div className="border border-black p-4">
            <h2 className="text-md font-semibold text-black mb-2">9. Other Special Issues to be Incorporated in the Contract</h2>
            <TextArea name="specialIssues" rows={3} placeholder="Specify special issues here..." className="border border-gray-400 text-black bg-white w-full" />
            <p className="italic text-sm mt-2 text-gray-800">(Please specify above)</p>
          </div>

          {/* SECTION 10 */}
          <div className="border border-black p-4">
            <h2 className="text-md font-semibold text-black mb-2">10. Administrative Issues</h2>
            <div className="border border-black text-sm mb-4">
              {/* Funding Section */}
              <div className="flex justify-between items-center border-b border-black p-3">
                <div className="flex items-center gap-3 text-black">
                  Funding for the contract price is available:
                  <label className="flex items-center gap-1 ml-2">
                    <input type="radio" value="YES" disabled /> Yes
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" value="NO" disabled /> No
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly name="financeDirector" defaultValue="" placeholder="----------------------------------------------" className={readOnly + " w-48"} />
                  <Input readOnly name="financeDate" defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-40"} />
                </div>
              </div>

              {/* Procurement Section */}
              <div className="flex justify-between items-center p-3 border-b border-black">
                <div className="flex items-center gap-3 text-black">
                  Procurement Procedures have been complied with:
                  <label className="flex items-center gap-1 ml-2">
                    <input type="radio" value="YES" disabled /> Yes
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" value="NO" disabled /> No
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly name="procurementManager" defaultValue="" placeholder="-----------------------------------" className={readOnly + " w-48"} />
                  <Input readOnly name="procurementDate" defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-40"} />
                </div>
              </div>
            </div>

            {/* Head of Department (Dropdown & auto-date) */}
          <div className="border border-black p-4">
    
            <div className="grid grid-cols-2 gap-6 text-sm text-black">
              <div>
                <select name="headOfDept" defaultValue="APPROVED" className="border border-black w-3/4 mb-1 text-black bg-white p-2">
                  <option value="APPROVED">APPROVED</option>
                  {/* <option value="REJECTED">REJECTED</option> */}
                </select>
                <h2 className="text-md font-semibold text-black mb-2">Head of Department</h2>
              </div>
              <div>
                <Input type="date" readOnly name="headDate" defaultValue={today} className={readOnly + " w-3/4 mb-1"} />
                <div>Date</div>
              </div>
            </div>
          </div>

            {/* Legal Department (Read-only) */}
            <p className="mt-6 font-semibold text-black">Received by Legal Department:</p>
            <div className="grid grid-cols-2 gap-6 mt-2 text-sm text-black">
              <div>
                <Input readOnly name="companySecretary" defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-3/4 mb-1"} />
                <div>Company Secretary</div>
              </div>
              <div>
                <Input readOnly name="secretaryDate" defaultValue="" placeholder="------------------------------------------------------" className={readOnly + " w-3/4 mb-1"} />
                <div>Date</div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button disabled={isPending} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-semibold mt-6" type="submit">
            {isPending ? "Submitting..." : "Submit Requisition"}
          </Button>
        </form>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-bold mb-4">✅ Requisition Submitted!</h2>
            <p className="mb-6">Your requisition has been successfully created.</p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/requisitions/submitted");
              }}
              className="bg-blue-700 hover:bg-blue-600 text-white font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      <footer className="text-xs text-center text-gray-500 mt-10 italic">
        PowerTel Communications — Imagine it. Live it.
      </footer>
    </div>
  );
}
