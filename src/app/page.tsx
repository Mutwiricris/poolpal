// import { redirect } from 'next/navigation';

export default function Home() {
  // redirect('/login');
  return (
    <div>
      <h1>Home</h1>
      <a href="/login">Login</a>
    </div>
  );
}
