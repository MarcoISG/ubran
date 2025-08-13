import { useEffect, useState } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte
    const hasSupport = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(hasSupport);
    
    if (hasSupport) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscription(subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!supported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!supported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Generar VAPID key en Firebase Console
      const vapidPublicKey = 'TU_VAPID_PUBLIC_KEY';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Aquí deberías enviar la subscription al servidor
      // await saveSubscription(subscription);
      
      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      // Aquí deberías eliminar la subscription del servidor
      // await deleteSubscription(subscription);
      
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  return {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
