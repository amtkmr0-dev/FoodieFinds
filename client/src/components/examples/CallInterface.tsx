import { CallInterface } from "../CallInterface";

export default function CallInterfaceExample() {
  return (
    <CallInterface
      creatorName="Sarah Johnson"
      pricePerMinute={45}
      currentBalance={450}
      onEndCall={() => console.log("End call")}
      onSendGift={() => console.log("Send gift")}
      onRecharge={() => console.log("Recharge")}
    />
  );
}
