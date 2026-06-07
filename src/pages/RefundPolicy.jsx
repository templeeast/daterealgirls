import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Refund & payment policy is now covered in Section 4 of the Terms of Use
export default function RefundPolicy() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/terms', { replace: true }); }, [navigate]);
  return null;
}