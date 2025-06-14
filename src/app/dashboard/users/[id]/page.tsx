import UserDetailsClient from "./user-details-client";

// This is a server component
export default function UserDetailsPage({ params }: { params: { id: string } }) {
  return <UserDetailsClient userId={params.id} />;
}
