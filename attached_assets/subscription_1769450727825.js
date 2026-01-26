const { error, success } = require("../../apiRespose/apiResponse");
const Subscription = require("../../models/admin/subscription");
const Transaction = require("../../models/user/transaction");
const User = require("../../models/user/user");
const moment = require("moment");
const { getText } = require("../../language/lang");
const UserSubcription = require("../../models/user/userSubcription");
const { default: mongoose } = require("mongoose");
const descount = require("../../models/admin/descount");

// exports.proceedPayment = async (req, res) => {
//   try {
//     const { subscription } = req.body;
//     const newSubscription = await Subscription.findById(subscription);
//     if (!newSubscription) {
//       return res
//         .status(206)
//         .json(
//           error(
//             getText("Please provide a valid subscription plan", req.language),
//             res.statusCode
//           )
//         );
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.user._id,
//       {
//         planId: newSubscription._id,
//         plan_valid_from: new Date(),
//         plan_valid_till: new Date(moment().add(1, "month")),
//         auto_renewal: true,
//         plan_type: "Monthly",
//       },
//       { new: true }
//     );

//     const transaction = await Transaction.create({
//       user: req.user._id,
//       transactionId: Date.now().toString(),
//       amount: newSubscription.price,
//       status: "Success",
//       subscription: newSubscription._id,
//     });

//     res
//       .status(200)
//       .json(
//         success(
//           getText("Payment Successful", req.language),
//           { transaction },
//           res.statusCode
//         )
//       );
//   } catch (err) {
//     console.log(err);
//     res.status(400).json(error("Internal server error.", res.statusCode));
//   }
// };
exports.proceedPayment = async (req, res) => {
  try {
    const { subscription, promoCode } = req.body;

    const newSubscription = await Subscription.findById(subscription);
    if (!newSubscription) {
      return res
        .status(206)
        .json(
          error(
            getText("Please provide a valid subscription plan", req.language),
            res.statusCode
          )
        );
    }

    let finalAmount = newSubscription.price;
    let appliedPromo = null;

    if (promoCode) {
      const promo = await descount.findOne({
        promoCode: promoCode.trim(),
        selectPlan: newSubscription._id,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (!promo) {
        return res
          .status(206)
          .json(
            error(
              getText("Invalid or expired promo code", req.language),
              res.statusCode
            )
          );
      }

      if (promo.discountType === "percentage") {
        finalAmount = finalAmount - (finalAmount * promo.price) / 100;
      } else if (promo.discountType === "fixed") {
        finalAmount = finalAmount - promo.price;
      }

      if (finalAmount < 0) finalAmount = 0;
      appliedPromo = promo._id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        planId: newSubscription._id,
        plan_valid_from: new Date(),
        plan_valid_till: new Date(moment().add(1, "month")),
        auto_renewal: true,
        plan_type: "Monthly",
      },
      { new: true }
    );

    const transaction = await Transaction.create({
      user: req.user._id,
      transactionId: Date.now().toString(),
      amount: finalAmount,
      status: "Success",
      subscription: newSubscription._id,
      ...(appliedPromo && { promoCode: appliedPromo }),
    });

    res
      .status(200)
      .json(
        success(
          getText("Payment Successful", req.language),
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("Internal server error.", res.statusCode));
  }
};

exports.getSubscriptionList = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      // isDeleted: false,
      status: true,
    });

    res
      .status(200)
      .json(
        success(
          getText("Subscription list fetched successfully", req.language),
          { subscriptions },
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const subcription = await UserSubcription.findByIdAndDelete(subscriptionId);
    // const users = await User.findById(req.user._id);
    // users.autoMativeTotalCredit = 0;
    // users.autoMativeCredit = 0;
    // users.autoMativeLimit = 0;
    // users.sparePartCredit = 0;
    // users.sparePartLimit = 0;
    // users.sparePartTotalCredit = 0;
    // await users.save();
    // subcription.type = "Cancelled";
    // await subcription.save();
    res
      .status(200)
      .json(
        success(
          getText("Subscription cancelled successfully", req.language),
          {},
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.addUserSubcription = async (req, res) => {
  try {
    const {
      amount,
      validity,
      subscription,
      updateSubcription,
      planType,
      credit,
      productLimit,
      appleResponse,
    } = req.body;
    console.log(req.body);

    if (!validity) {
      return res
        .status(201)
        .json(error("Please provide validity", res.statusCode));
    }
    if (!subscription) {
      return res
        .status(201)
        .json(error("Please provide subscription", res.statusCode));
    }
    if (!planType) {
      return res
        .status(201)
        .json(error("Please provide planType", res.statusCode));
    }

    const user = await User.findById(req.user._id);
    if (appleResponse) {
      const appleTokes = JSON.parse(appleResponse);
      // const usersDetails = await User.findById(req.user._id);
      // const addressDetails = await Address.findById(address);
      const data = {
        tran: {
          id: "234",
          class: "ecom",
          type: "sale",
          description: "ApplePay transaction",
          amount: amount,
          test: 0,
          currency: "SAR",
          method: "applepay",
        },
        applepay: {
          token: {
            paymentData: {
              header: {
                transactionId:
                  appleTokes.details.applePayToken.paymentData.header
                    ?.transactionId || "",
                ephemeralPublicKey:
                  appleTokes.details.applePayToken.paymentData.header
                    ?.ephemeralPublicKey || "",
                publicKeyHash:
                  appleTokes.details.applePayToken.paymentData.header
                    ?.publicKeyHash || "",
              },
              data: appleTokes.details.applePayToken.paymentData?.data || "",
              signature:
                appleTokes.details.applePayToken.paymentData?.signature || "",
              version:
                appleTokes.details.applePayToken.paymentData?.version ||
                "EC_v1",
            },
            transactionIdentifier:
              appleTokes.details.applePayToken.transactionIdentifier || "",
            paymentMethod: {
              network:
                appleTokes.details.applePayToken.paymentMethod.network ||
                "Unknown",
              type:
                appleTokes.details.applePayToken.paymentMethod.type ||
                "Unknown",
              displayName:
                appleTokes.details.applePayToken.paymentMethod.displayName ||
                "Unknown",
            },
          },
        },
        // customer: {
        //   name: {
        //     forenames: usersDetails.firstName,
        //     surname: usersDetails.lastName,
        //   },
        //   email: usersDetails.email,
        //   address: {
        //     line1: addressDetails.locality,
        //     country: "AE",
        //     city: addressDetails.city,
        //   },
        //   phone: addressDetails.mobileNumber,
        // },
        store: process.env.TELR_STORE_ID,
        authkey: "NjFN^LTdqZ#b2Jmb",
      };
      try {
        const telrResponse = await axios.post(
          "https://secure.telr.com/gateway/remote.json",
          data
        );

        const paymentUrl = telrResponse.data;
        console.dir(paymentUrl, { depth: null });

        if (paymentUrl.transaction.status != "A") {
          return res
            .status(206)
            .json(
              error(
                `Payment failed due to ${paymentUrl.transaction.message}`,
                res.statusCode
              )
            );
        }
      } catch (err) {
        console.error(err);
        res.status(500).json(error("Internal Server Error", res.statusCode));
      }
    }
  
    const subscriptionUpdate = await UserSubcription.findOne({
      user: req.user._id,
      planType: planType,
    });
    console.log("data", subscriptionUpdate);

    if (subscriptionUpdate) {
      subscriptionUpdate.amount = amount;
      subscriptionUpdate.validity = validity;
      subscriptionUpdate.subscription = subscription;
      subscriptionUpdate.planType = planType;
      subscriptionUpdate.credit = +credit;
      subscriptionUpdate.productLimit = +productLimit;
      subscriptionUpdate.type = "Upgrade";
      await subscriptionUpdate.save();
      if (planType === "AutoMative") {
        console.log("data 2", planType);
        console.log("Before - AutoMativeCredit:", user.autoMativeCredit);
        console.log("Credit to add:", credit);
        user.autoMativeCredit += Number(credit) || 0;
        user.autoMativeLimit += Number(productLimit) || 0;
        user.autoMativeTotalCredit += Number(credit) || 0;
        await user.save();
      }
      if (planType === "Spare Parts") {
        console.log("Data1 ",planType);
        
        user.sparePartCredit += Number(credit) || 0;
        user.sparePartLimit += Number(productLimit) || 0;
        user.sparePartTotalCredit += Number(credit) || 0;
        await user.save();
      }
      return res
        .status(200)
        .json(
          success(
            getText("Subscription upgrade successfully", req.language),
            { subscriptionUpdate },
            res.statusCode
          )
        );
    }else{
 const subscriptions = await UserSubcription.create({
      amount: amount,
      validity: validity,
      subscription: subscription,
      user: req.user._id,
      planType: planType,
      credit: credit,
      productLimit: productLimit,
    });
      if (planType === "AutoMative") {
      user.autoMativeCredit = credit;
      user.autoMativeLimit = productLimit;
      user.autoMativeTotalCredit = credit;
      await user.save();
    }
    if (planType === "Spare Parts") {
      user.sparePartCredit = credit;
      user.sparePartLimit = productLimit;
      user.sparePartTotalCredit = credit;
      await user.save();
    }
    return res
      .status(200)
      .json(
        success(
          getText("Subscription add successfully", req.language),
          { subscriptions },
          res.statusCode
        )
      );
    }
   
  } catch (err) {
    console.error(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.getMySubcription = async (req, res) => {
  try {
    const now = new Date(); // current date
    const subscriptions = await UserSubcription.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "subscription",
          foreignField: "_id",
          as: "subscription",
        },
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          validity: { $gte: now }, // adjust field name to match your schema
        },
      },
    ]);
    res
      .status(200)
      .json(
        success(
          getText("Subcription list", req.language),
          { subscriptions },
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err);
    res.status(500).json(error("Internal Server Error", res.statusCode));
  }
};

exports.appplyPromo = async (req, res) => {
  try {
    const { code } = req.body;
    const promoCode = await descount.findOne({
      promoCode: code,
    });
    if (!promoCode) {
      return res.status(200).json(error("Invalid promo code", res.statusCode));
    }
    // if (orderValue < promoCode.value) {
    //   return res
    //     .status(200)
    //     .json(
    //       error(
    //         req.language === "Arabic"
    //           ? `يجب أن تكون قيمة الطلب ${promoCode.value} على الأقل،`
    //           : `Order value must be at least ${promoCode.value}`,
    //         res.statusCode,
    //       ),
    //     );
    // }
    const currentDate = new Date();
    if (promoCode.validity < currentDate) {
      return res
        .status(200)
        .json(
          error(
            req.language === "Arabic"
              ? "انتهت صلاحية الرمز الترويجي"
              : "Promo code validity has expired",
            res.statusCode
          )
        );
    }
    if (promoCode.used >= promoCode.limit) {
      return res
        .status(200)
        .json(
          error(
            req.language === "Arabic"
              ? "تم الوصول إلى حد استخدام الرمز الترويجي"
              : "Promo code usage limit reached",
            res.statusCode
          )
        );
    }
    // promoCode.used += 1;
    // await promoCode.save();
    // if (!promoCode) {
    //   return res.status(200).json(error("No Any Promo Code", res.statusCode));
    // }
    res
      .status(200)
      .json(
        success(
          req.language === "Arabic"
            ? "تم تطبيق الرمز الترويجي"
            : "Promo code applied",
          { promoCode },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);

    res.status(400).json(error("Failed", res.statusCode));
  }
};
