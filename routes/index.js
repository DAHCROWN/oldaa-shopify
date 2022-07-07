// const { json } = require('body-parser');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const jwt = require('jsonwebtoken')
const app = express();
const axios = require('axios')
var cors = require('cors')
const env = app.get('env');
var corsOptions = {
  origin: 'https://oldaa.myshopify.com',


  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
const { paymentsApi, locationsApi, checkoutApi, customersApi, transactionsApi } = require('../util/square-client');

const Shopify = require('shopify-api-node');

var shipping_rates = [
  { cov: [0, 15], amt: 9.25 },
  { cov: [15, 75], amt: 11.20 },
  { cov: [75, 125], amt: 16.00 },
]


const shopify = new Shopify({
  shopName: 'oldaa',
  // apiKey: '846d4dae55ec9ee7c389e3c0066bc936',
  accessToken: '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'
});

shopify.on('callLimits', (limits) => console.log(limits));
var salt = "very salty salt"


/* GET hom(e page. */

router.post('/get-details', cors(), async (req, res) => {
  let newArray = []

  let data = JSON.parse(req.body.mainData)
  console.log(data)
  var token = await jwt.sign(data, salt)
  var sd = { url: 'https://oldaa.herokuapp.com/contact-details/' + token }
  res.json(sd)
})

router.get('/contact-details/:token', async (req, res) => {
  var token = req.params.token
  var decoded = await jwt.decode(token, salt)
  console.log(decoded)
  console.log("decoded")

  var items = decoded.items
  var total = decoded.items_subtotal_price / 100
  var shipping_ = 0
  function getShippingRate(total, shipping_rates) {
    shipping_rates.forEach(rate => {
      console.log(total > rate.cov[0] && total < rate.cov[1])
      if (total > rate.cov[0] && total < rate.cov[1]) {
        console.log(rate.amt)
        shipping_ = rate.amt
      }
    });
  }
  getShippingRate(total, shipping_rates)
  console.log("done")
  res.render('checkout', { items: items, total: total, token: token, shipping_rate: shipping_ })
})

router.post('/contact-details/:token', (req, res) => {
  // console.log(req.body, req.path)
  var order_id = 0

  var token = req.params.token
  var decoded = jwt.decode(token, salt)
  var line_items = []
  var data = req.body

  var shipping_address = {
    first_name: data.firstname,
    last_name: data.lastname,
    address1: data.address1,
    address1: data.address2,
    phone: data.phone,
    company: data.company,
    city: data.city,
    province: "nil",
    country: data.country,
    zip: data.zip
  }

  var customer = {
    first_name: data.firstname,
    last_name: data.lastname,
    email: data.email,
  }

  decoded.items.forEach(item => {
    let poductObj = {
      variant_id: item.id,
      quantity: item.quantity
    }
    line_items.push(poductObj)
  });

  var orderData = {
    line_items: line_items,
    shipping_address: shipping_address,
    customer: customer,
    price: decoded.items_subtotal_price,
    email: data.email,
    delivery_method: data.delivery_method
  }

  runit()

  async function runit() {
    var token1 = await jwt.sign(orderData, salt)
    res.redirect(`/process-payment/${token1}?item=${token}`)
  }
})


router.get('/process-payment/:token', async function (req, res) {
  const locationResponse = await locationsApi.retrieveLocation(process.env.SQUARE_LOCATION_ID);
  const currency = locationResponse.result.location.currency;
  const country = locationResponse.result.location.country;

  // Set the app and location ids for Payment Web SDK to use
  var token1 = req.query.item
  var decoded1 = jwt.decode(token1, salt)
  var token = req.params.token
  var decoded = await jwt.decode(token, salt)
  var shipping_ = 0
  function getShippingRate(total, shipping_rates, delivery_method) {
    if (delivery_method == "shipping") {
      shipping_rates.forEach(rate => {
        console.log(total > rate.cov[0] && total < rate.cov[1])
        if (total > rate.cov[0] && total < rate.cov[1]) {
          console.log(rate.amt)
          shipping_ = rate.amt
        }
      });
    }
  }
  var total = decoded.price / 100
  getShippingRate(total, shipping_rates, decoded.delivery_method)
  res.render('index', {
    env,
    title: 'Make Payment',
    squareApplicationId: process.env.SQUARE_APPLICATION_ID,
    squareLocationId: process.env.SQUARE_LOCATION_ID,
    squareAccountCountry: country,
    squareAccountCurrency: currency,
    token: token,
    total: String(parseFloat((total + shipping_).toFixed(8))),
    items: decoded1.items,
    total1: decoded1.items_subtotal_price / 100,
  });
});

router.post('/process-payment/:token', async (req, res) => {
  const token = req.body.token;
  const ntoken = req.params.token
  var decoded = await jwt.decode(ntoken, salt)
  var shipping_ = 0

  function getShippingRate(total, shipping_rates, delivery_method) {
    if (delivery_method == "shipping") {
      shipping_rates.forEach(rate => {
        console.log(total > rate.cov[0] && total < rate.cov[1])
        if (total > rate.cov[0] && total < rate.cov[1]) {
          console.log(rate.amt)
          shipping_ = rate.amt
        }
      });
    }
  }
  var total = decoded.price / 100
  getShippingRate(total, shipping_rates, decoded.delivery_method)

  // length of idempotency_key should be less than 45
  const idempotencyKey = uuidv4();
  // get the currency for the location
  const locationResponse = await locationsApi.retrieveLocation(process.env.SQUARE_LOCATION_ID);
  const currency = locationResponse.result.location.currency;
  var total = Number(decoded.price / 100)
  // Charge the customer's card
  console.log(decoded)
  const requestBody = {
    idempotencyKey,
    sourceId: token,
    amountMoney: {
      amount: parseFloat((total + shipping_).toFixed(8)) * 100, // $1.00 charge
      currency
    }
  };

  try {
    const { result: { payment } } = await paymentsApi.createPayment(requestBody);
    let main_id = payment.id
    console.log(main_id)
    const result = await JSON.stringify(payment, (key, value) => {
      return typeof value === "bigint" ? parseInt(value) : value;
    }, 4);

    await shopify.order
      .create(
        {
          line_items: decoded.line_items,
          customer: decoded.customer,
          billing_address: decoded.shipping_address,
          shipping_address: decoded.shipping_address,
          email: decoded.email,
          note: `Payment via square with id: ${main_id}. Delivery type: ${decoded.delivery_method}`
        }
      )
      .then((order) =>
        console.log(order),
        res.json({ RESULT: result }))
      .catch((err) =>
        console.log(err),
        res.json({ errors: "Something went wrong" }))

    // res.json({
    //   RESULT: result
    // });

  } catch (error) {
    console.log(error)
    res.json(error.result);
  }
});



router.post("/checkout", cors(), async (req, res) => {

  var customer_id = uuidv4()

  let newArray = []
  let data = JSON.parse(req.body.mainData)
  console.log(data)

  var line_items = []
  data.items.forEach(element => {
    let item = {
      variant_id: '',
      quantity: ''
    }
    let newData = {
      basePriceMoney: {}
    }
    let amount = element.price//.substr(1, element.price.length -5)
    let mmamount = amount
    console.log(mmamount)
    item.variant_id = element.id
    item.quantity = element.quantity

    newData.name = element.title //+ ` Type = ${element.type}`,
    newData.quantity = element.quantity.toString()
    newData.basePriceMoney.amount = mmamount
    newData.basePriceMoney.currency = 'EUR'
    newArray.push(newData)
    newData = {}
    line_items.push(item)
  });
  var verifyToken = await jwt.sign({
    line_items: { line_items }
  }, salt
  )
  console.log(process.env.SQUARE_LOCATION_ID)
  console.log(newArray)
  try {

    const response = await checkoutApi.createCheckout(process.env.SQUARE_LOCATION_ID,
      {

        idempotencyKey: uuidv4(),
        order: {
          order: {
            locationId: process.env.SQUARE_LOCATION_ID,
            referenceId: 'reference_id',
            // customerId: "customer_id",
            lineItems: newArray,
            // taxes: [
            //   {
            //     uid: '38ze1696-z1e3-5628-af6d-f1e04d947fg3',
            //     type: 'INCLUSIVE',
            //     percentage: '7.75',
            //     scope: 'LINE_ITEM',
            //     name:"mine"
            //   }
            // ],
            discounts: [
              {
                uid: uuidv4(),
                type: 'FIXED_AMOUNT',
                amountMoney: {
                  amount: 0,
                  currency: 'EUR'
                },
                scope: 'LINE_ITEM',
                name: "mine"

              }
            ]
          },
          idempotencyKey: uuidv4()
        },
        askForShippingAddress: true,
        merchantSupportEmail: 'merchant+support@website.com',
        // prePopulateBuyerEmail: 'example@email.com',
        // prePopulateShippingAddress: {
        //   addressLine1: '1455 Market St.',
        //   addressLine2: 'Suite 600',
        //   locality: 'San Francisco',
        //   administrativeDistrictLevel1: 'CA',
        //   postalCode: '94103',
        //   country: 'US',
        //   firstName: 'Jane',
        //   lastName: 'Doe'
        // },
        redirectUrl: `https://oldaa.herokuapp.com/verify/${verifyToken}`,
        // additionalRecipients: [
        //   {
        //     locationId: '057P5VYJ4A5X1',
        //     description: 'Application fees',
        //     amountMoney: {
        //       amount: 60,
        //       currency: 'USD'
        //     }
        //   }
        // ]
      }
    );

    console.log(response);
    res.json({ url: response.result.checkout.checkoutPageUrl })
    //redirect to Url
  } catch (error) {
    console.log(error);
  }
})




router.get('/verify/:token', async (req, res) => {
  var token = req.params.token
  var decoded = jwt.decode(token, salt)
  var txn_id = req.query.transactionId
  console.log(txn_id)

  try {
    setTimeout(async () => {
      // const customer_id = await axios.get(`https://connect.squareup.com/v2/locations/${process.env.SQUARE_LOCATION_ID}/transactions/${txn_id}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      //       accept: "*/*",
      //       "accept-encoding": "gzip,deflate,br"
      //     },
      //   });
      var customer_id = await transactionsApi.retrieveTransaction(process.env.SQUARE_LOCATION_ID, txn_id)
      console.log(customer_id)
      var customer_idx = customer_id.result.transaction.tenders[0].customer_id
      console.log("this is customer", customer_idx)
      const response = await customersApi.retrieveCustomer(customer_idx);
      var data = response.result.customer
      var shipping_address = {
        first_name: data.givenName,
        last_name: data.familyName,
        address1: data.address.addressLine1,
        phone: '00000000000',
        city: data.address.locality,
        province: data.address.addressLine1,
        country: data.address.country,
        zip: data.address.postalCode,

      }
      // console.log(decoded.line_items)
      var dodo = {
      line_items: decoded.line_items.line_items,
            customer: {
              first_name: data.givenName,
              last_name: data.familyName,
              email: data.emailAddress
            },
            billing_address: shipping_address,
            shipping_address: shipping_address,
            email: data.emailAddress,
            note: `Payment via square `
      }
      console.log(dodo)
      await shopify.order
        .create(
          {
            line_items: decoded.line_items.line_items,
            customer: {
              first_name: data.givenName,
              last_name: data.familyName,
              email: data.emailAddress
            }
            ,
            billing_address: shipping_address,
            shipping_address: shipping_address,
            email: data.emailAddress
          })
        .then((order) =>
          res.redirect('https://oldaa.myshopify.com/pages/acknowledgement')
          
        )
        .catch((err) =>
          console.log(err)
          // res.json({ errors: "Something went wrong"})
        )

    }, 10000);

  } catch (error) {
    console.error(error);
  }


  // try {
  //   const response = await customersApi.retrieveCustomer(decoded.customer_id);

  //   console.log(decoded,response.result);
  // await shopify.order
  // .create(
  //   {
  //     line_items: decoded.line_items,
  //     customer: decoded.customer,
  //     billing_address: decoded.shipping_address,
  //     shipping_address: decoded.shipping_address,
  //     email: decoded.email,
  //     note: `Payment via square `
  //   }
  // )
  // .then((order) =>
  //   console.log(order),
  //   res.json({ RESULT: result }))
  // .catch((err) =>
  //   console.log(err),
  //   //   res.json({ errors: "Something went wrong" }))
  // } catch(error) {
  //   console.log(error);
  // }
})





module.exports = router;


