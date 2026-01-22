import DeviceInfo, { getUniqueId } from 'react-native-device-info'
// import moment from "moment-timezone";
// import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
import messaging from "@react-native-firebase/messaging"

export const getFcmToken = async () => {
    let fcmToken = await messaging().getToken();
    console.log("fcm token : ", fcmToken);
    // setFcm(fcmToken)
    return fcmToken
}

export const getDeviceDetails = async (res) => {

    let deviceDetails = {
        deviceId: '',
        deviceOS: Platform.OS,
        deviceName: '',
        buildNumber: '',
        fcmToken: '',
        OSVersion: '',
    }

    // try {

    //     const position = await new Promise((resolve, reject) => {
    //         Geolocation.getCurrentPosition(resolve, reject, {
    //             enableHighAccuracy: true, 
    //             timeout: 15000, 
    //             maximumAge: 10000
    //         });
    //     });

    //     const { latitude, longitude } = position?.coords;
    //     const timezone = moment.tz.guess({ lat: latitude, lon: longitude });
    //     deviceDetails.timezone = timezone;
    //     console.log("Precise Timezone:", timezone);

    // } catch (error) {
    //     console.error("Geolocation Error:", error);
    // }
    console.log("Device details 1:", deviceDetails);

    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Authorization status:', authStatus);
        } else {
            console.log('User denied permission');
        }

        // Ensure the app is registered for remote messages
        // await messaging().registerDeviceForRemoteMessages();

        await getFcmToken().then(res => {
            deviceDetails.fcmToken = res;
        })

        await getUniqueId().then((id) => {
            deviceDetails.deviceId = id;
        })
            .catch((err) => console.log(err))

        let buildNumber = DeviceInfo.getBuildNumber();
        deviceDetails.buildNumber = buildNumber;

        let OSVersion = DeviceInfo.getSystemVersion();
        deviceDetails.OSVersion = OSVersion;

        const deviceName = await DeviceInfo.getDeviceName();
        deviceDetails.deviceName = deviceName;
    } catch (error) {
        console.error("DeviceInfo Error:", error);
    }

    console.log("Device details :", deviceDetails);
    res && res(deviceDetails)
    // return deviceDetails 
};