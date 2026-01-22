const { error, success } = require("../../apiRespose/apiResponse");
const serviceAccount = require("../../config/firebase.json");
const admin = require("firebase-admin");
const Device = require("../../models/user/device");
const UserNotification = require("../../models/user/notification");
const {getText}=require('../../language/lang')
const mongoose=require('mongoose')
const moment = require("moment");
//const Notification = require("../../Models/User/notification");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// exports.sendNotificationUser = async (type, data, userId, deviceId) => {
//   try {
//     const filter = {};
//     if (userId) filter.userId = userId;
//     if (deviceId) filter.deviceId = deviceId;

//     if (!userId && !deviceId) {
//       console.log("User ID or Device ID is required");
//       return "User ID or Device ID required";
//     }

//     const devices = await Device.find(filter);
//     for (const device of devices) {
//       const count = await UserNotification.find({
//         user: device.user,
//         isRead: false,
//       }).countDocuments();
//       data.count = String(count);
      
//       let title = "";
//       let body = "";
//       if (type === "CUSTOM") {
//         title = data.title;
//         body = data.message;
//       }
      
//       if (device.fcmToken) {
//         const message = {
//           token: device.fcmToken,
//           data: { ...data },
//           notification: {
//             title: title,
//             body: body,
//           },
//           apns: {
//             payload: {
//               aps: {
//                 badge: count,
//                 sound: "default",
//                 mutableContent: true,
//                 category: "CustomSamplePush",
//               },
//             },
//             fcmOptions: data.icon ? { imageUrl: data.icon } : {},
//           },
//           android: {
//             priority: "high",
//             ttl: 60 * 60 * 24,
//             data: { ...data },
//             notification: {
//               title: title,
//               body: body,
//               sound: "default",
//               defaultSound: true,
//               defaultLightSettings: true,
//               notificationCount: count,
//               visibility: "public",
//               imageUrl: data.icon || undefined,
//             },
//           },
//           webpush: {
//             data: { ...data },
//             notification: {
//               title: title,
//               body: body,
//               icon: data.icon || undefined,
//               dir: "ltr",
//               data: { ...data },
//             },
//             fcmOptions: {},
//           },
//         };

//         await admin
//           .messaging()
//           .send(message)
//           .then((response) => {
//             console.log("Notification Sent:", response);
//           })
//           .catch((error) => {
//             console.log("Error Sending Notification:", error);
//           });
//       }
//     }

//     return "Notification sent successfully";
//   } catch (err) {
//     console.log("Notification Error:", err);
//     return "Error sending notification";
//   }
// };
// exports.sendNotificationUser = async (type, data,userId ) => {
//   try {
//     const devices = await Device.find({ userId: userId });
//     for (const device of devices) {
//       const count = await UserNotification.countDocuments({
//         user:new mongoose.Types.ObjectId(userId),
//         isRead: false,
//       });

//       data.count = String(count);
//       let title = "";
//       let body = "";
//       if (type === "CUSTOM") {
//         title = data.title;
//         body = data.message;
//       }
//       if (device.fcmToken) {
//         const message = {
//           token: device.fcmToken,
//           data: { ...data },
//           notification: {
//             title: title,
//             body: body,
//           },
//           apns: {
//             payload: {
//               aps: {
//                 badge: count,
//                 sound: "default",
//                 mutableContent: true,
//                 category: "CustomSamplePush",
//               },
//             },
//             fcmOptions: data.icon ? { imageUrl: data.icon } : {},
//           },
//           android: {
//             priority: "high",
//             ttl: 60 * 60 * 24,
//             data: { ...data },
//             notification: {
//               title: title,
//               body: body,
//               sound: "default",
//               defaultSound: true,
//               defaultLightSettings: true,
//               notificationCount: count,
//               visibility: "public",
//               imageUrl: data.icon || undefined,
//             },
//           },
//           webpush: {
//             data: { ...data },
//             notification: {
//               title: title,
//               body: body,
//               icon: data.icon || undefined,
//               dir: "ltr",
//               data: { ...data },
//             },
//             fcmOptions: {
//               // link: url,
//             },
//           },
//         };
//         // if (data.image) {
//         //   message.apns.fcmOptions = {
//         //     imageUrl: data.image,
//         //   };
//         //   message.android.notification.imageUrl = data.image;
//         // }
//         admin
//           .messaging()
//           .send(message)
//           .then((response) => {
//             console.log(response);
//             return;
//           })
//           .catch((error) => {
//             console.log(error);
//           });
//       }
//     }

//     return;
//   } catch (err) {
//     console.log(err);
//     return;
//   }
// };

exports.sendNotificationUser = async (type, data, userId) => {
  try {
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //   console.log("Invalid userId:", userId);
    //   return;
    // }

    const devices = await Device.find({ userId: new mongoose.Types.ObjectId(userId) });

    for (const device of devices) {
      const count = await UserNotification.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      });

      data.count = String(count);
      let title = "";
      let body = "";

      if (type === "CUSTOM") {
        title = data.title;
        body = data.message;
      }

      if (device.fcmToken && device.fcmToken.length > 20) {
        const message = {
          token: device.fcmToken,
          data: { ...data },
          notification: {
            title: title,
            body: body,
          },
          apns: {
            payload: {
              aps: {
                badge: count,
                sound: "default",
                mutableContent: true,
                category: "CustomSamplePush",
              },
            },
            fcmOptions: data.icon ? { imageUrl: data.icon } : {},
          },
          android: {
            priority: "high",
            ttl: 60 * 60 * 24,
            data: { ...data },
            notification: {
              title: title,
              body: body,
              sound: "default",
              defaultSound: true,
              defaultLightSettings: true,
              notificationCount: count,
              visibility: "public",
              imageUrl: data.icon || undefined,
            },
          },
          webpush: {
            data: { ...data },
            notification: {
              title: title,
              body: body,
              icon: data.icon || undefined,
              dir: "ltr",
              data: { ...data },
            },
          },
        };

        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log("FCM sent:", response);
          })
          .catch((error) => {
            console.log("FCM Error:", error);
          });
      } else {
        console.log(`Invalid or missing fcmToken for device: ${device._id}`);
      }
    }
  } catch (err) {
    console.log("sendNotificationUser Error:", err);
  }
};


exports.notificationsList = async (req, res) => {
  try {

    const { deviceId, userId,language} = req.body

    let filter = {};

    if (userId) {
      filter.user = userId;
    } else if (deviceId) {
      filter.deviceId = deviceId;
    } else {
      return res.status(200).json(error(getText("User ID or Device ID required",language), res.statusCode));
    }
    const notifications = await UserNotification.find(filter).sort({
      createdAt: -1,
    });;
    res.status(200).json(success(getText("Notification list",language), { notifications }, res.statusCode));
  } catch (err) {
    console.log(err)
    res.status(500).json(error("Server error", res.statusCode));
  }
}

exports.readNotification = async (req, res) => {
  try {
    const notification = await UserNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.status(200).json(success("Notification marked as read", { notification }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const {language}=req.body
    await UserNotification.findByIdAndDelete(req.params.id);

    res.status(200).json(success(getText("Notification deleted successfully",language), {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.deleteAllNotification = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json(error("User ID or Device ID is required", res.statusCode));
    }

    const filter = {};
    if (userId) filter.user = userId;
    if (deviceId) filter.deviceId = deviceId;

    await UserNotification.deleteMany(filter);

    res.status(200).json(success("User's notifications deleted successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};


exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id; 

    const result = await UserNotification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json(
      success("All notifications marked as read", { modifiedCount: result.modifiedCount }, res.statusCode)
    );
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};





