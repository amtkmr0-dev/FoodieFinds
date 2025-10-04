import { CreatorProfileHeader } from "../CreatorProfileHeader";

export default function CreatorProfileHeaderExample() {
  return (
    <div className="max-w-2xl border rounded-xl">
      <CreatorProfileHeader
        name="Sarah Johnson"
        country="India"
        followers={1250}
        price={45}
        isOnline={true}
        isFollowing={false}
        onTalkNow={() => console.log("Talk now clicked")}
        onFollow={() => console.log("Follow clicked")}
      />
    </div>
  );
}
