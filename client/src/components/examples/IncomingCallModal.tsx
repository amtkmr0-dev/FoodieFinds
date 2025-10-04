import { IncomingCallModal } from "../IncomingCallModal";

export default function IncomingCallModalExample() {
  return (
    <IncomingCallModal
      callerName="System Call"
      pricePerMinute={45}
      onAccept={() => console.log("Call accepted")}
      onReject={() => console.log("Call rejected")}
    />
  );
}
