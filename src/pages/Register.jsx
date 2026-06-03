import { registerNewUser } from '@/api/db-services';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await registerNewUser(email, password, fullName);
      
      if (result.success) {
         navigate('/', { replace: true });
      } else {
         setError(result.errorMessage);
      }
    } catch (err) {
      setError(t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };
