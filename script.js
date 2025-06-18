let spinnerTimerInterval;
let spinnerSeconds = 0;

const skipTimerMessages = ['login', 'logout', 'memuat halaman'];

function showLoadingSpinner(message = 'Memuat Halaman') {
  document.getElementById('loading-spinner').style.display = 'flex';
  document.getElementById('spinner-message').innerText = message;

  clearInterval(spinnerTimerInterval);

  if (skipTimerMessages.includes(message.toLowerCase())) {
    document.getElementById('spinner-timer').innerText = '';
    return;
  }

  spinnerSeconds = 0;
  document.getElementById('spinner-timer').innerText = '0 Detik';

  spinnerTimerInterval = setInterval(() => {
    spinnerSeconds++;
    document.getElementById('spinner-timer').innerText = spinnerSeconds + ' Detik';
  }, 1000);
}

function hideLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'none';
  clearInterval(spinnerTimerInterval);
}

async function clearCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
  }
}

async function loadIframeUrl() {
  try {
    showLoadingSpinner('Memuat data');

    await clearCache();
    const currentTarget = window.location.origin;

    const response = await fetch(`https://url.onemoto.shop/api/re-url?target=${currentTarget}`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data dari server');
    }

    const data = await response.json();

    if (data && data.reurl) {
      const iframe = document.getElementById('dynamicIframe');
      iframe.onload = hideLoadingSpinner;
      iframe.src = data.reurl;
    } else {
      console.error('URL tidak ditemukan untuk target:', currentTarget);
      hideLoadingSpinner();
    }
  } catch (err) {
    console.error('Error:', err);
    hideLoadingSpinner();
  }
}

loadIframeUrl();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        // console.log('Service Worker registered:', registration.scope);
      })
      .catch(error => {
        // console.error('Service Worker registration failed:', error);
      });
  });
}
