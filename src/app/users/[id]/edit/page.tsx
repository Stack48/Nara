'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { api } from '@/lib/axios';
import { UserDTO } from '@/types/user';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get<UserDTO>(`/users/${id}`)
      .then((res: { data: UserDTO }) => setUser(res.data))
      .catch((e: { response?: { status?: number } }) => {
        if (e.response?.status === 404) notFound();
        setError("Impossible de charger l'utilisateur");
      });
  }, [id]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (
      form.elements.namedItem('email') as HTMLInputElement
    ).value.trim();
    const nameRaw = (
      form.elements.namedItem('name') as HTMLInputElement
    ).value.trim();

    try {
      await api.put(`/users/${id}`, { email, name: nameRaw || null });
      router.push('/users');
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setError(msg ?? 'Une erreur est survenue');
    }
  }

  if (!user && !error) return null;

  return (
    <div className='mx-auto max-w-lg px-6 py-10'>
      <div className='mb-8'>
        <Link
          href='/users'
          className='text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
        >
          ← Retour à la liste
        </Link>
        <h1 className='mt-4 text-2xl font-semibold tracking-tight'>
          Modifier l&apos;utilisateur
        </h1>
      </div>

      {error && (
        <p
          className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
          role='alert'
        >
          {error}
        </p>
      )}

      {user && (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div>
            <label htmlFor='email' className='mb-1 block text-sm font-medium'>
              Email <span className='text-red-600'>*</span>
            </label>
            <input
              id='email'
              name='email'
              type='email'
              required
              defaultValue={user.email}
              autoComplete='email'
              className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100'
            />
          </div>
          <div>
            <label htmlFor='name' className='mb-1 block text-sm font-medium'>
              Nom
            </label>
            <input
              id='name'
              name='name'
              type='text'
              defaultValue={user.name ?? ''}
              autoComplete='name'
              className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100'
            />
          </div>
          <div className='flex gap-3 pt-2'>
            <button
              type='submit'
              className='rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            >
              Enregistrer
            </button>
            <Link
              href='/users'
              className='rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800'
            >
              Annuler
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
