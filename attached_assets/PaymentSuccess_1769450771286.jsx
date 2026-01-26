import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const PaymentSuccess = () => {
  useEffect(() => {
    Swal.fire({
      title: 'Payment Successful! 🎉',
      text: 'Thank you for your purchase. Your transaction has been completed successfully.',
      icon: 'success',
      confirmButtonText: 'Continue',
      confirmButtonColor: '#4CAF50',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: `
        rgba(0,0,123,0.4)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `
    }).then((result) => {
      if (result.isConfirmed) {
        // Try to close the tab
        try {
          // For modern browsers
          if (window.history.length <= 1) {
            window.close();
          } else {
            // If there's history, go back first
            window.history.back();
            setTimeout(() => window.close(), 100);
          }
        } catch (e) {
          // Fallback for browsers that block window.close()
          window.location.href = 'about:blank';
          
          // Alternative fallback - redirect to home
          // window.location.href = '/';
        }
      }
    });
  }, []);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0
    }}>
      {/* You could add a loading spinner here */}
    </div>
  );
};

export default PaymentSuccess;