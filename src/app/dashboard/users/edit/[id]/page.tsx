'use client';

import React, { useEffect, useState } from "react";
import UserForm from "../../user-form";
import { getUserById } from "@/lib/user-service";
import { useRouter } from "next/navigation";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getUserById(id)
      .then((u) => {
        if (!u) {
          setError('User not found');
        } else {
          setUser(u);
        }
      })
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  if (error || !user) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error || 'User not found'}</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <UserForm
        user={user}
        onClose={() => router.push('/dashboard/users')}
        onSaved={() => router.push('/dashboard/users')}
      />
    </div>
  );
}
