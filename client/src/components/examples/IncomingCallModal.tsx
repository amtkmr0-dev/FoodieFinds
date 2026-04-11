import { IncomingCallModal } from "../IncomingCallModal";

export default function IncomingCallModalExample() {
  return (
    <IncomingCallModal
      callerName="System Call"
      pricePerMinute={45}
      onAccept={() => {/* Example: Handle call acceptance */ }}
      onReject={() => {/* Example: Handle call rejection */ }}
    />
  );
}
