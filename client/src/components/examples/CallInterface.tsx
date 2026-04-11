import { CallInterface } from "../CallInterface";

export default function CallInterfaceExample() {
  return (
    <CallInterface
      creatorName="Sarah Johnson"
      creatorId="1"
      pricePerMinute={45}
      callType="audio"
      onEndCall={() => {/* Example: Handle end call */ }}
    />
  );
}
