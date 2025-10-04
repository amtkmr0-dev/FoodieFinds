import { CreatorCard } from "../CreatorCard";

export default function CreatorCardExample() {
  return (
    <div className="max-w-xs">
      <CreatorCard
        id="1"
        name="Sarah Johnson"
        price={45}
        country="India"
        followers={1250}
        isOnline={true}
        onClick={() => console.log("Creator card clicked")}
      />
    </div>
  );
}
