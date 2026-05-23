import { useState, useCallback } from 'react';

/**
 * Custom hook for managing CRUD loading states
 * Returns startLoading, stopLoading functions and overlayProps for CrudLoadingOverlay
 */
const useLoading = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [action, setAction] = useState('');
  const [subject, setSubject] = useState('');

  const startLoading = useCallback((loadAction = 'loading', loadSubject = '') => {
    setAction(loadAction);
    setSubject(loadSubject);
    setIsVisible(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsVisible(false);
    setAction('');
    setSubject('');
  }, []);

  const overlayProps = {
    isVisible,
    action,
    subject,
  };

  return { startLoading, stopLoading, overlayProps };
};

export default useLoading;
