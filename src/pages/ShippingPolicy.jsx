import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Shipping / digital delivery policy is now covered in Section 3 & 4 of the Terms of Use
export default function ShippingPolicy() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/terms', { replace: true }); }, [navigate]);
  return null;
}