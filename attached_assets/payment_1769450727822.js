
const axios=require("axios");
const { error, success } = require("../../apiRespose/apiResponse");



exports.subcriptionPayment = async (req, res) => {
    const {
      amount,
      email,
      names,
      lastName,
      address,
      city,
      state,
      country,
      pincode,
      mobileNumber,
      merchantId,
    } = req.body;
    //const merchant = await Merchant.findById(merchantId);
    const data = {
      method: "create",
      store: 32400,
      authkey:"3SWWK@m9Mz-5GNtS",
      framed: 0,
      order: {
        cartid: "1234",
        test: 0,
        amount: amount,
        currency: "AED",
        description: "User created new order",
      },
      return: {
        authorised: "https://admin.thesamanapp.com/PaymentSuccess",
        declined: "https://admin.thesamanapp.com/PaymentFailed",
        cancelled: "https://admin.thesamanapp.com/PaymentFailed",
      },
      customer: {
        ref: "xxx", //unique customer identification
        email: email,
        name: {
          title: names,
          forenames: "xxx",
          surname: lastName,
        },
        address: {
          line1: address,
          line2: "xxx",
          line3: "xxx",
          city: city,
          state: state,
          country: country,
          areacode: pincode,
        },
        phone: mobileNumber,
      },
      //splitpayment: { id: 1 },
    };
    console.log(data);
    try {
      const response = await axios.post(
        "https://secure.telr.com/gateway/order.json",
        data,
      );
      const paymentUrl = response.data;
      res.status(201).json(success("Success", { paymentUrl }, res.statusCode));
    } catch (err) {
      console.log(err);
      res.status(400).json(error("Error", res.statusCode));
    }
    
  };