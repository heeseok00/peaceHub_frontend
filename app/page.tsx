import { redirect } from 'next/navigation';

// 루트 페이지는 로그인 페이지로 리다이렉트
export default function Home() {
  redirect('/login');
}
