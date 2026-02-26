import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LibraryPage } from '@/features/library/components/LibraryPage';
import { ReaderPage } from '@/features/reader/components/ReaderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/library" replace />,
  },
  {
    path: '/library',
    element: <LibraryPage />,
  },
  {
    path: '/reader/:bookId',
    element: <ReaderPage />,
  },
]);
