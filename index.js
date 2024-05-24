const express = require("express");
const app = express();
// const mongoose = require("mongoose");
var bodyParser = require("body-parser");
// const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");

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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
      success_url: "https://0193-103-44-53-141.ngrok-free.app/success_url",
      cancel_url: "https://0193-103-44-53-141.ngrok-free.app/cancel_url",
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





app.post("/webhook",bodyParser.raw({ type: "application/json" }),(req, res) => {
    const sig = req.headers["stripe-signature"];
    const body = req.body;

    console.log("Received webhook request with signature:", sig);
    // console.log("Received webhook request body:", body.toString());

    try {
      var event = stripe.webhooks.constructEvent(
        body,
        sig,
        "whsec_2g3zQPrYuoMm9tdxkeZfnnxNfJUdbY6t"
      );
     
      console.log("Webhook event:", event);

      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent was successful!`);
          break;
        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          console.log(`Invoice payment succeeded!`);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
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

app.get("/success_url", (req, res) => {
  res.send("done");
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
