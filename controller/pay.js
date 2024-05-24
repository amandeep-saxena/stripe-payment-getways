const { Publishable, Secret } = process.env


const stripe = require('stripe')(Secret)


// const payment = async(req,res)=>{

//     try {

//     stripe.customers.create({
//         email: req.body.stripeEmail,
//         source: req.body.stripeToken,
//         name: 'Sandeep Sharma',
//         address: {
//             line1: '115, Vikas Nagar',
//             postal_code: '281001',
//             city: 'Mathura',
//             state: 'Uttar Pradesh',
//             country: 'India',
//         }
//     })
//     .then((customer) => {

//         return stripe.charges.create({
//             amount: req.body.amount,     // amount will be amount*100
//             description: req.body.productName,
//             currency: 'INR',
//             customer: customer.id
//         });
//     })
//     .then((charge) => {
//         res.redirect("/success")
//     })
//     .catch((err) => {
//         res.redirect("/failure")
//     });


//     } catch (error) {
//         console.log(error.message);
//     }

// }






const addCostumer = async (req, res) => {

    try {

        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email
        });

        res.status(200).send(customer);

    } catch (error) {
        console.log(error)
    }
}




const addNewCard = async (req, res, next) => {
    const {
        customer_Id,
        card_Name,
        card_ExpYear,
        card_ExpMonth,
        card_Number,
        card_CVC,
    } = req.body;

    try {
        const card_Token = await stripe.tokens.create({
            card: {
                name: card_Name,
                number: card_Number,
                exp_month: card_ExpMonth,
                exp_year: card_ExpYear,
                cvc: card_CVC,
            },
        });

        const card = await stripe.customers.createSource(customer_Id, {
            source: `${card_Token.id}`,
        });

        return res.status(200).send({ card: card.id });
    } catch (error) {
        throw new Error(error);
    }
}




const createCharges = async (req, res, next) => {
    try {
        const createCharge = await stripe.charges.create({
            receipt_email: 'asaxena@neuvays.com',
            amount: 50 * 100, //USD*100
            currency: "inr",
            card: req.body.card_ID,
            customer: req.body.customer_Id,
        });
        res.send(createCharge);
    } catch (err) {
        throw new Error(error);
    }
}



module.exports = {
    addCostumer,
    addNewCard,
    createCharges,
}
// const addNewCard = async (req, res) => {
//     try {
//         const {
//             customer_id,
//             card_Name,
//             card_ExpYear,
//             card_ExpMonth,
//             card_Number,
//             card_CVC
//         } = req.body

//         const card_token = await stripe.tokens.create({
//             name: card_Name,
//             number: card_Number,
//             exp_year: card_ExpYear,
//             exp_month: card_ExpMonth,
//             cvc: card_CVC
//         })

//         const card = await stripe.customers.createSource(customer_id, {
//             source: `${card_token.id}`
//         })
//         res.status(200).send({ cards: card.id })
//     } catch (error) {
//         console.log(error)
//     }
// }





// const payment  =async (req,res) =>{

//         const { amount, currency, source, description } = req.body;

//         try {
//           const paymentIntent = await stripe.paymentIntents.create({
//             amount,
//             currency,
//             source,
//             description,
//           });

//           res.json({ SECRET: paymentIntent.SECRET });
//         } catch (error) {
//           res.status(500).json({ error: error.message });
//         }

// }


