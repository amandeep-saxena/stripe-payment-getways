const express = require("express");
const app = express();
// const mongoose = require("mongoose");
var bodyParser = require("body-parser");

const { MongoClient, ServerApiVersion } = require("mongodb");
const nodemailer = require("nodemailer");
const client = new MongoClient(
  "mongodb+srv://saxenaman903:7iBj7Pkhtfj2bMGl@cluster0.j2jkj8p.mongodb.net/",
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);

// Connect to the client
client.connect();

require("dotenv").config();
console.log(process.env);

// app.post("/webhookapp",express.raw({ type: "application/json" }),webhook);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  if (req.originalUrl === "/webhookapp") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const router = require("./router/pay-router");

const PublishableKey =
  "pk_test_51NsmiQSILhT441ffVrOEq30fXnNOGkBC0gVKQx3WHaR9SX6sRKL8o9zJ7wgkoXmHMNcU4QhlZdMgEWhnNL1lsIlN006ZyEBofY";

// MONGODB = "mongodb+srv://aman12:1vcnqNhKU1ORADCk@cluster0.j2jkj8p.mongodb.net"

// mongoose.connect(process.env.MONGODB, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
//     .then(() => console.log('Connected! successfull-------- '))
//     .catch((err) => {
//         console.log(err)
//     })

const stripe = require("stripe")(
  "sk_test_51NsmiQSILhT441ffeeud94VPhQYyRy7SPmZSqA74Pq01qx24QVn245Dq3kK2jrK2PdXDfKsR5jUC9GgCNaFGeUz600SML4LGD1"
);

const mockDb = {
  getUserById: async (userId) => {
    return {
      stripe_session_id:
        "cs_test_a1fDkl0Fe53kB3couIlUnSJ2I957FglljzkfJGre4mzGXVOF6hglKNNWzL",
      paid_sub: false,
    };
  },
  updateUserStripe: async (userId, paidSubStatus) => {
    console.log(
      `Mock update for user ${userId} with paidSubStatus: ${paidSubStatus}`
    );

    return [{ userId, paid_sub: paidSubStatus }];
  },
};

// Set the mock database object to the app for easy access
app.set("db", mockDb);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      success_url: "https://899f-103-44-53-141.ngrok-free.app/success_url",
      cancel_url: "https://899f-103-44-53-141.ngrok-free.app/cancel_url",
      line_items: [
        {
          price: "price_1OAeYqSILhT441ffSs02kev1", // Replace with your actual price ID
          quantity: 1,
        },
      ],
      mode: "subscription",
    });

    console.log(session);

    const sessionId = session.id;
    console.log("sessionId: ", sessionId);

    res.send({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/stripe-session", async (req, res) => {
  try {
    // console.log("req.body: ", req.body);
    const { userId } = req.body;
    console.log("userId: ", userId);

    const db = req.app.get("db");

    // Get user from your database
    const user = await db.getUserById(userId);
    console.log(user);
    if (!user.stripe_session_id || user.paid_sub === true) {
      return res.send("fail");
    }

    const session = await stripe.checkout.sessions.retrieve(
      user.stripe_session_id
    );
    console.log("session: ", session);

    if (session && session.payment_status === "paid") {
      let updatedUser = await db.updateUserStripe(userId, true);
      updatedUser = updatedUser[0];
      console.log(updatedUser);

      return res.send("success");
    } else {
      return res.send("fail");
    }
  } catch (error) {
    console.error(
      "An error occurred while retrieving the Stripe session:",
      error
    );
    return res.send("fail");
  }
});

/// use webhook event ///

// payment_methos : pm_card_visa

app.post("/create-customer12", async (req, res) => {
  const { email, payment_method } = req.body;

  try {
    const customer = await stripe.customers.create({
      email,
      payment_method,
      invoice_settings: { default_payment_method: payment_method },
    });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/create-subscription12", async (req, res) => {
  const { customerId } = req.body;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: "price_1PJHZJSILhT441ffJQvHEcLN" }],
      expand: ["latest_invoice.payment_intent"],
    });

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// var endpointSecret = `whsec_UPuEOz1t24XhuNAsQUrgv7hjUVmzxvOS`;
// app.post(

//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     const body = req.body;

//     console.log("Received webhook request with signature:", sig);
//     console.log("Received webhook request body:", body.toString());

//     try {
//       var event = stripe.webhooks.constructEvent(
//         body,
//         sig,
//         "whsec_2g3zQPrYuoMm9tdxkeZfnnxNfJUdbY6t"
//       );

//       console.log("Webhook event:", event);

//       switch (event.type) {
//         case "payment_intent.succeeded":
//           const paymentIntent = event.data.object;
//           console.log(`PaymentIntent was successful!`);
//           break;
//         case "invoice.payment_succeeded":
//           const invoice = event.data.object;
//           console.log(`Invoice payment succeeded!`);
//           break;
//         default:
//           console.log(`Unhandled event type ${event.type}`);
//       }

//       res.json({ received: true });
//     } catch (err) {
//       console.error("⚠️ Webhook signature verification failed.", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }
//   }
// );
// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.create({
//       success_url: "http://localhost:6000/success_url",
//       cancel_url: "http://localhost:6000/cancel_url",
//       line_items: [
//         {
//           price: "price_1OAeYqSILhT441ffSs02kev1",
//           quantity: 1,
//         },
//       ],
//       mode: "subscription",
//     });

//     console.log(session);

//     const sessionId = session.id;
//     console.log("sessionId: ", sessionId);

//     res.send({ url: session.url });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.get("/stripe-session", async (req, res) => {
//   console.log("req.body: ", req.body);
//   const { userId } = req.body;
//   console.log("userId: ", userId);

//   const db = req.app.get("db");

//   // get user from you database
//   const user = {
//     stripe_session_id:
//       "cs_test_a1fDkl0Fe53kB3couIlUnSJ2I957FglljzkfJGre4mzGXVOF6hglKNNWzL",
//     paid_sub: false,
//   };

//   if (!user.stripe_session_id || user.paid_sub === true)
//     return res.send("fail");

//   try {
//     const session = await stripe.checkout.sessions.retrieve(
//       user.stripe_session_id
//     );
//     console.log("session: ", session);

//     // const sessionResult = {
//     //   id: 'cs_test_a1lpAti8opdtSIDZQIh9NZ6YhqMMwC0H5wrlwkUEYJc6GXokj2g5WyHkv4',
//     //   …
//     //   customer: 'cus_PD6t4AmeZrJ8zq',
//     //   …
//     //   status: 'complete',
//     //   …
//     //   subscription: 'sub_1OOgfhAikiJrlpwD7EQ5TLea',
//     //  …
//     // }

//     // update the user
//     if (session && session.status === "complete") {
//       let updatedUser = await db.update_user_stripe(userId, true);
//       updatedUser = updatedUser[0];
//       console.log(updatedUser);

//       return res.send("success");
//     } else {
//       return res.send("fail");
//     }
//   } catch (error) {
//     // handle the error
//     console.error(
//       "An error occurred while retrieving the Stripe session:",
//       error
//     );
//     return res.send("fail");
//   }
// });

// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.create({
//       success_url: "localhost:6000/success_url",
//       cancel_url: "localhost:6000/cancel_url",
//       line_items: [
//         {
//           price: "price_1PJHZJSILhT441ffJQvHEcLN",
//           quantity: 1,
//         },
//       ],
//       mode: "subscription",
//     });
//     console.log(session)
//     //   console.log("session: ", session.id, session.url, session)

//     // get id, save to user, return url
//       const sessionId = session.id;
//       console.log("sessionId: ", sessionId);

//     // save session.id to the user in your database

//       res.send({ url: session.url })
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });
app.post("/webhookapp",express.raw({ type: "application/json" }),async (request, response) => {
    const sig = request.headers["stripe-signature"];
    let session = "";

    let event;

    const testPayloadString = JSON.stringify(request.body, null, 2 ,sig );
    const testSecret = "whsec_UPuEOz1t24XhuNAsQUrgv7hjUVmzxvOS";

    const testHeader = stripe.webhooks.generateTestHeaderString({
      payload: testPayloadString,
      secret: testSecret,
      sig 
    });

    try {
      
      event = stripe.webhooks.constructEvent(
        testPayloadString,
        testHeader,
        testSecret
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed.", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case "checkout.session.async_payment_failed":
        // const checkoutSessionAsyncPaymentFailed = event.data.object;
        session = event.data.object;
        console.log("Async payment failed:", session);
        break;

      case "checkout.session.completed":
        // const checkoutSessionAsyncPaymentSucceeded = event.data.object;
        session = event.data.object;
        console.log("Payment succeeded:", session);

        const emailTO = session.customer_details.email;
        const productLink =
          "https://drive.google.com/file/d/11IIZpIaafmlnUrGSFvkGVLu7XII3bHMH/view?usp=drive_link";

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: "abhinavsaxena119@gmail.com",
            pass: "bkwgjnfawvkmpjhe",
          },
        });

        const mailOptions = {
          from: "abhinavsaxena119@gmail.com",
          to: emailTO,
          subject: "Thanks for your payment",
          text: `Hello ${session.customer_details.email}, thanks for your payment.`,
          html: `<p>Hello ${session.customer_details.email},</p><p>Thanks for your payment. Here is your product link: <a href="${productLink}">Download Product</a></p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.messageId);
          }
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
  }
);

// app.post(
//   "/webhook1",
//   express.raw({ type: "application/json" }),
//   (request, response) => {
//     const sig = request.headers["stripe-signature"];

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//       response.status(400).send(`Webhook Error: ${err.message}`);
//       return;
//     }

//     // Handle the event
//     switch (event.type) {
//       case "checkout.session.async_payment_failed":
//         const checkoutSessionAsyncPaymentFailed = event.data.object;
//         // Then define and call a function to handle the event checkout.session.async_payment_failed
//         break;
//       case "checkout.session.completed":
//         const checkoutSessionCompleted = event.data.object;
//         // Then define and call a function to handle the event checkout.session.completed
//         break;
//       // ... handle other event types
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
//   }
// );

app.get("/success_url", (req, res) => {
  res.send("PaymentIntent was successful");
});

app.get("/cancel_url", (req, res) => {
  res.send("cancel");
});
// app.post("/create-subscription", async (req, res) => {
//   try {
//     const { customer_id, price_id } = req.body;

//     const subscription = await stripe.subscriptions.create({
//         customer: customer_id,
//       items: [
//         {
//           price: "price_1PHYp0SILhT441ffn59uErpH",
//         },
//       ],
//       expand: ["latest_invoice.payment_intent"],
//     });

//     res.status(200).json(subscription);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post("/", (req, res) => {});

// app.use(router);

// app.get("/app", (req, res) => {
//   res.send(
//     "hkjhadjkhadjkadhjadjkasdjkdsbjkdsdbjsdcbjksdcbjkdscbsdkjcbkjsdcbjksdcbjkdscbkjsdcfbjkdscbhsdcvjhsfvhsdfb"
//   );
// });

app.listen(6000, console.log("hii done"));
