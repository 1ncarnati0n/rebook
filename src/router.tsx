import { createBrowserRouter,createHashRouter , Navigate } from 'react-router-dom';

const isExtension = typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';

const createRouter = isExtension ? createHashRouter : createBrowserRouter;

export const router = createRouter([
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
