
import { Alert, Linking, Platform } from 'react-native';
import { requestMultiple, PERMISSIONS, RESULTS, requestNotifications } from 'react-native-permissions';
// import Geolocation from 'react-native-geolocation-service';
import messaging from "@react-native-firebase/messaging"

const openSettings = () => {
  Alert.alert(
    'Note',
    'Please enable app permissions from settings',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: async () => {
          try {
            await Linking.openSettings();
          } catch (error) {
            console.warn('Failed to open settings:', error);
          }
        },
      },
    ],
    { cancelable: true }
  );
};

export default requestPermissions = async (res) => {
  try {
    // await messaging().registerDeviceForRemoteMessages();
    // if (Platform.OS === 'ios') {
    //   Geolocation.requestAuthorization('whenInUse');
    //   Geolocation.requestAuthorization('always');
    // }

    let notificationPermission = await requestNotifications(['alert', 'sound']);
    console.log('notificationPermission : ', notificationPermission);

    const permissions = Platform.OS === 'ios'
      ? [
        // PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        PERMISSIONS.IOS.NOTIFICATIONS,
      ]
      : [
        // PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ];

    if (permissions) {
      const response = await requestMultiple(permissions);

      let permissionDenied = false;

      for (const permission in response) {
        if (response[permission] === RESULTS.GRANTED) {
          console.log(`${permission} permission granted`);
          res && res(true);
        } else if (
          response[permission] === RESULTS.DENIED ||
          response[permission] === RESULTS.BLOCKED
        ) {
          permissionDenied = true;
          console.log(`${permission} permission denied or blocked`);
        }
      }

      // Show settings alert only once if any permission is denied or blocked
      if (permissionDenied) {
        res && res(false);
        openSettings();
      }
    }
  } catch (error) {
    console.log('Error requesting permissions:', error);
    if (Platform.OS === 'android') {
      openSettings();
    }
  }
};
