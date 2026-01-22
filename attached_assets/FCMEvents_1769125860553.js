import analytics from '@react-native-firebase/analytics';

export const trackEvents = async (eventName, payload) => {
  try {
    await analytics().logEvent(eventName, payload);
    console.log(`FCM EVENT ${eventName} logged with payload:`, payload);
  } catch (error) {
    console.error('Error logging event: ', error);
  }
};
