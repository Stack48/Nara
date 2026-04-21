'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { UserDTO } from '@/types/user';

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserDTO[]>('/users')
      .then((res: { data: UserDTO[] }) => setUsers(res.data))
      .catch(() => setError('Impossible de charger les utilisateurs'));
  }, []);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("Impossible de supprimer l'utilisateur");
    }
  }

  return (
    <div className='mx-auto max-w-4xl px-6 py-10'>
      <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold tracking-tight'>Utilisateurs</h1>
        <div className='flex gap-3'>
          <Link
            href='/'
            className='rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800'
          >
            Accueil
          </Link>
          <Link
            href='/users/new'
            className='rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
          >
            Nouvel utilisateur
          </Link>
        </div>
      </div>

      {error && (
        <p
          className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
          role='alert'
        >
          {error}
        </p>
      )}

      {users.length === 0 && !error ? (
        <p className='text-neutral-600 dark:text-neutral-400'>
          Aucun utilisateur.{' '}
          <Link href='/users/new' className='underline'>
            Créer le premier
          </Link>
          .
        </p>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800'>
          <table className='w-full min-w-[32rem] text-left text-sm'>
            <thead className='border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50'>
              <tr>
                <th className='px-4 py-3 font-medium'>Email</th>
                <th className='px-4 py-3 font-medium'>Nom</th>
                <th className='px-4 py-3 font-medium text-neutral-500'>
                  Créé le
                </th>
                <th className='px-4 py-3 text-right font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className='border-b border-neutral-100 last:border-0 dark:border-neutral-800'
                >
                  <td className='px-4 py-3'>{user.email}</td>
                  <td className='px-4 py-3 text-neutral-600 dark:text-neutral-400'>
                    {user.name ?? '—'}
                  </td>
                  <td className='px-4 py-3 text-neutral-500'>
                    {new Intl.DateTimeFormat('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(user.createdAt))}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex justify-end gap-2'>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className='rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800'
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className='rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900'
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
