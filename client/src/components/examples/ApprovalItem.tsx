import { ApprovalItem } from "../ApprovalItem";

export default function ApprovalItemExample() {
  return (
    <div className="max-w-3xl border rounded-xl">
      <ApprovalItem
        id="1"
        creatorName="Sarah Johnson"
        type="kyc"
        status="pending"
        details="Updated Aadhar & PAN documents"
        timestamp="2 hours ago"
        onApprove={() => console.log("Approved")}
        onReject={() => console.log("Rejected")}
      />
      <ApprovalItem
        id="2"
        creatorName="Rahul Verma"
        type="profile"
        status="approved"
        details="Profile picture changed"
        timestamp="1 day ago"
      />
    </div>
  );
}
