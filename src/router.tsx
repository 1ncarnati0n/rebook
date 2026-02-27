import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/library" replace />,
  },
  {
    path: '/library',
    lazy: async () => {
      const { LibraryPage } = await import(
        '@/features/library/components/LibraryPage'
      );
      return { Component: LibraryPage };
    },
  },
  {
    path: '/reader/:bookId',
    lazy: async () => {
      const { ReaderPage } = await import(
        '@/features/reader/components/ReaderPage'
      );
      return { Component: ReaderPage };
    },
  },
]);
