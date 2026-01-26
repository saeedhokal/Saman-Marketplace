import { SagaActions } from '../redux/sagas/SagaActions';
import ApiUrls from './ApiUrls';

export const ApiCalls = ({ apiType }) => {
  let requestType = '';
  let requestUrl = '';

  switch (apiType) {

    // ================ GET REQUEST =================
    case SagaActions.USER_DATA:
      requestType = 'GET';
      requestUrl = ApiUrls.USER_DATA_URL;
      break;

    case SagaActions.GET_FAQ:
      requestType = 'GET';
      requestUrl = ApiUrls.GET_FAQ_URL;
      break;

    case SagaActions.READ_NOTIFICATION:
      requestType = 'GET';
      requestUrl = ApiUrls.READ_NOTIFICATION_URL;
      break;
    case SagaActions.READ_ALL_NOTIFICATION:
      requestType = 'GET';
      requestUrl = ApiUrls.READ_ALL_NOTIFICATION_URL;
      break;
    case SagaActions.GET_SELLER_DETAIL:
      requestType = 'GET';
      requestUrl = ApiUrls.GET_SELLER_DETAIL_URL;
      break;
    case SagaActions.GET_ALL_CATEGORY:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_ALL_CATEGORY_URL;
      break;
    case SagaActions.GET_ALL_QUERY:
      requestType = 'GET';
      requestUrl = ApiUrls.GET_ALL_QUERY_URL;
      break;



    /* ==================== POST REQUESTS ====================  */

    case SagaActions.SIGNUP_USER:
      requestType = 'POST';
      requestUrl = ApiUrls.SIGNUP_USER_URL;
      break;

    case SagaActions.ADD_PRODUCT:
      requestType = 'POST';
      requestUrl = ApiUrls.ADD_PRODUCT_URL;
      break;

    case SagaActions.PROCEED_PAYMENT:
      requestType = 'POST';
      requestUrl = ApiUrls.PROCEED_PAYMENT_URL;
      break;



    case SagaActions.CONTACT_US:
      requestType = 'POST';
      requestUrl = ApiUrls.CONTACT_US_URL;
      break;

    case SagaActions.HELP_AND_SUPPORT:
      requestType = 'POST';
      requestUrl = ApiUrls.HELP_AND_SUPPORT_URL;
      break;
    case SagaActions.SUBSCRIPTION_PAYMENT:
      requestType = 'POST';
      requestUrl = ApiUrls.SUBSCRIPTION_PAYMENT_URL;
      break;
    case SagaActions.ADD_USER_SUBSCRIPTION:
      requestType = 'POST';
      requestUrl = ApiUrls.ADD_USER_SUBSCRIPTION_URL;
      break;
        case SagaActions.UPLOAD_PRODUCT_IMAGE:
      requestType = 'POST';
      requestUrl = ApiUrls.UPLOAD_PRODUCT_IMAGE_URL;
      break;

    // =================== PUT REQUESTS ====================
    case SagaActions.LOGIN_USER:
      requestType = 'PUT';
      requestUrl = ApiUrls.LOGIN_URL;
      break;

    case SagaActions.SEND_OTP:
      requestType = 'PUT';
      requestUrl = ApiUrls.SEND_OTP_URL;
      break;
    case SagaActions.VERIFY_OTP:
      requestType = 'PUT';
      requestUrl = ApiUrls.VERIFY_OTP_URL;
      break;


    case SagaActions.FORGOT_PASSWORD:
      requestType = 'PUT';
      requestUrl = ApiUrls.FORGOT_PASSWORD_URL;
      break;


    case SagaActions.CHANGE_PASSWORD:
      requestType = 'PUT';
      requestUrl = ApiUrls.CHANGE_PASSWORD_URL;
      break;
    case SagaActions.UPDATE_PASSWORD:
      requestType = 'PUT';
      requestUrl = ApiUrls.UPDATE_PASSWORD_URL;
      break;
    case SagaActions.GET_NOTIFICATION:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_NOTIFICATION_URL;
      break;

    case SagaActions.GET_USER_POLICY:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_USER_POLICY_URL;
      break;

    case SagaActions.GET_ALL_SUBCATEGORY:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_ALL_SUBCATEGORY_URL;
      break;
    case SagaActions.GET_SUBCATEGORY_LIST:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_SUBCATEGORY_LIST_URL;
      break;


    // product
    case SagaActions.GET_SELLER_PRODUCT:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_SELLER_PRODUCT_URL;
      break;
    case SagaActions.GET_PRODUCT_BY_ID:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_PRODUCT_BY_ID_URL;
      break;
    case SagaActions.GET_ALL_PRODUCT:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_ALL_PRODUCT_URL;
      break;

    case SagaActions.SEARCH_PRODUCT:
      requestType = 'PUT';
      requestUrl = ApiUrls.SEARCH_PRODUCT_URL;
      break;
    case SagaActions.GET_PRODUCT_BY_SELLER:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_PRODUCT_BY_SELLER_URL;
      break;
    case SagaActions.GET_TOP_BIKES:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_TOP_BIKES_URL;
      break;

    case SagaActions.GET_TOP_PRODUCT:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_TOP_PRODUCT_URL;
      break;
    case SagaActions.GET_RECENT_PRODUCT:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_RECENT_PRODUCT_URL;
      break;

    // home banner api
    case SagaActions.GET_HOME_BANNER:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_HOME_BANNER_URL;
      break;
    case SagaActions.GET_TUTORIAL_LIST:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_TUTORIAL_LIST_URL;
      break;
    case SagaActions.GET_SEARCH_HISTORY:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_SEARCH_HISTORY_URL;
      break;

    // subscription
    case SagaActions.GET_ALL_SUBSCRIPTION:
      requestType = 'PUT';
      requestUrl = ApiUrls.GET_ALL_SUBSCRIPTION_URL;
      break;
    case SagaActions.CANCEL_SUBSCRIPTION:
      requestType = 'PUT';
      requestUrl = ApiUrls.CANCEL_SUBSCRIPTION_URL;
      break;
    case SagaActions.APPLY_PROMO_CODE:
      requestType = 'PUT';
      requestUrl = ApiUrls.APPLY_PROMO_CODE_URL;
      break;
    case SagaActions.UPDATE_DELISTING_PRODUCT_VALIDITY:
      requestType = 'PUT';
      requestUrl = ApiUrls.UPDATE_DELISTING_PRODUCT_VALIDITY_URL;
      break;

    // ================== PATCH REQUESTS ====================
    case SagaActions.EDIT_PROFILE:
      requestType = 'PATCH';
      requestUrl = ApiUrls.EDIT_PROFILE_URL;
      break;
    case SagaActions.EDIT_PRODUCT:
      requestType = 'PATCH';
      requestUrl = ApiUrls.EDIT_PRODUCT_URL;
      break;
    case SagaActions.GET_MY_SUBSCRIPTION:
      requestType = 'PATCH';
      requestUrl = ApiUrls.GET_MY_SUBSCRIPTION_URL;
      break;
    case SagaActions.GET_DELISTING_PRODUCT:
      requestType = 'PATCH';
      requestUrl = ApiUrls.GET_DELISTING_PRODUCT_URL;
      break;

  


    case SagaActions.LOGOUT_USER:
      requestType = 'PATCH';
      requestUrl = ApiUrls.LOGOUT_USER_URL;
      break;

    /* ==================== DELETE REQUESTS ====================  */

    case SagaActions.DELETE_ALL_NOTIFICATION:
      requestType = 'DELETE';
      requestUrl = ApiUrls.DELETE_ALL_NOTIFICATION_URL;
      break;
    case SagaActions.DELETE_NOTIFICATION:
      requestType = 'DELETE';
      requestUrl = ApiUrls.DELETE_NOTIFICATION_URL;
      break;
    case SagaActions.DELETE_PRODUCT:
      requestType = 'DELETE';
      requestUrl = ApiUrls.DELETE_PRODUCT_URL;
      break;
    case SagaActions.DELETE_SEARCH_HISTORY:
      requestType = 'DELETE';
      requestUrl = ApiUrls.DELETE_SEARCH_HISTORY_URL;
      break;

    default:
      requestType = '';
      requestUrl = '';
      break;
  }
  return { requestType, requestUrl };
};
