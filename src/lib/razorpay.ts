let scriptPromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    Razorpay?: unknown;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
}
