import { UserListItem } from "../UserListItem";

export default function UserListItemExample() {
  return (
    <div className="max-w-2xl border rounded-xl">
      <UserListItem
        id="1"
        name="Rahul Sharma"
        phone="+91 98765 43210"
        balance={450}
        lastSeen="2 hours ago"
        onChat={() => {/* Example: Handle chat click */ }}
        onBlock={() => {/* Example: Handle block click */ }}
      />
      <UserListItem
        id="2"
        name="Priya Patel"
        phone="+91 98765 43211"
        balance={125}
        status="blocked"
        lastSeen="1 day ago"
        onChat={() => {/* Example: Handle chat click */ }}
        onBlock={() => {/* Example: Handle block click */ }}
      />
    </div>
  );
}
