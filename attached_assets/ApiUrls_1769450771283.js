
export const BASEURL =
  'https://admin.thesamanapp.com:2053/';

export default {
  // auth
  LOGIN_URL: `${BASEURL}user/userLogin`,
  SIGNUP_USER_URL: `${BASEURL}user/singup`,
  FORGOT_PASSWORD_URL: `${BASEURL}user/forgotPassword`,
  VERIFY_OTP_URL: `${BASEURL}user/verifyOTP`,
  CHANGE_PASSWORD_URL: `${BASEURL}user/changePassword`,
  UPDATE_PASSWORD_URL: `${BASEURL}user/updatePassword`,
  USER_DATA_URL: `${BASEURL}user/getUserData`,
  SEND_OTP_URL: `${BASEURL}user/forgotPassword`,
  EDIT_PROFILE_URL: `${BASEURL}user/editUserProfile`,
  LOGOUT_USER_URL: `${BASEURL}user/logout`,

  // notification
  GET_NOTIFICATION_URL: `${BASEURL}user/notificationsList`,
  READ_NOTIFICATION_URL: `${BASEURL}user/readNotification`,               //    /:id
  READ_ALL_NOTIFICATION_URL: `${BASEURL}user/markAllNotificationsRead`,
  DELETE_NOTIFICATION_URL: `${BASEURL}user/deleteNotification`,   //    /:id
  DELETE_ALL_NOTIFICATION_URL: `${BASEURL}user/deleteAllNotification`,     // USERID SEND IN BODY
  GET_NOTIFICATION_DETAIL_URL: `${BASEURL}notification/getNotificationDetails`,   //    /:id

  GET_FAQ_URL: `${BASEURL}user/getFAQUserList`,
  CONTACT_US_URL: `${BASEURL}user/contactUs`,
  GET_USER_POLICY_URL: `${BASEURL}user/getUserContent`,
  HELP_AND_SUPPORT_URL: `${BASEURL}user/addHelpSupport`,
  GET_ALL_QUERY_URL: `${BASEURL}user/getHelpSupport`,

  // product
  ADD_PRODUCT_URL: `${BASEURL}user/addProduct`,
  GET_SELLER_PRODUCT_URL: `${BASEURL}user/userProductList`,
  GET_PRODUCT_BY_SELLER_URL: `${BASEURL}user/getSellerProducts`,       //    /:id
  GET_PRODUCT_BY_ID_URL: `${BASEURL}user/getUserProductDetails`,     //    /:id
  EDIT_PRODUCT_URL: `${BASEURL}user/editProduct`,           //    /:id
  DELETE_PRODUCT_URL: `${BASEURL}user/deleteUserProduct`,   //    /:id   change to deleteProduct url
  GET_ALL_PRODUCT_URL: `${BASEURL}user/getAllProductList`,
  GET_SELLER_DETAIL_URL: `${BASEURL}user/getUserDetailsById`,     //    /:id
  SEARCH_PRODUCT_URL: `${BASEURL}user/searchProducts`,
  GET_TOP_PRODUCT_URL: `${BASEURL}user/getTopProducts`,
  GET_TOP_BIKES_URL: `${BASEURL}user/getTopProductsBickes`,
  GET_RECENT_PRODUCT_URL: `${BASEURL}user/getRecentProducts`,
  GET_DELISTING_PRODUCT_URL: `${BASEURL}user/deListingProducts`,
  UPDATE_DELISTING_PRODUCT_VALIDITY_URL: `${BASEURL}user/updateValidity`,   // /:id
  UPLOAD_PRODUCT_IMAGE_URL: `${BASEURL}user/uploadImages`,

  // search
  GET_SEARCH_HISTORY_URL: `${BASEURL}user/getSearchHistory`,
  DELETE_SEARCH_HISTORY_URL: `${BASEURL}user/deleteSearchHistory`,

  // category
  GET_ALL_CATEGORY_URL: `${BASEURL}user/categoryList`,
  GET_ALL_SUBCATEGORY_URL: `${BASEURL}user/getSubCategoriesByCategoryId`,           //    /:id   subCategoryList
  GET_SUBCATEGORY_LIST_URL: `${BASEURL}user/getSubCategoryListParent`,

  // home
  GET_HOME_BANNER_URL: `${BASEURL}user/userBannerList`,
  GET_TUTORIAL_LIST_URL: `${BASEURL}user/gettutorailList`,

  // subscription
  GET_ALL_SUBSCRIPTION_URL: `${BASEURL}user/getSubscriptionList`,
  SUBSCRIPTION_PAYMENT_URL: `${BASEURL}user/subcriptionPayment`,
  PROCEED_PAYMENT_URL: `${BASEURL}user/proceedPayment`,
  CANCEL_SUBSCRIPTION_URL: `${BASEURL}user/cancelSubscription`,
  ADD_USER_SUBSCRIPTION_URL: `${BASEURL}user/UserAddSubcription`,
  GET_MY_SUBSCRIPTION_URL: `${BASEURL}user/getMySUbcriptionPlan`,
  APPLY_PROMO_CODE_URL: `${BASEURL}user/appplyPromo`,
};
