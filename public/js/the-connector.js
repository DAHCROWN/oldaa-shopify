
console.log("wowing")

// const cc_id = document.querySelector('.c-customer').value

// if (cc_id){
//   console.log(cc_id)
// }
// else{
//   console.log(cc_id, "missing")
// }
var Data = {}

async function  getdata() {
  var cartContents = await fetch(window.Shopify.routes.root + 'cart.js')
  .then(response => response.json())
  .then(data => { Data = data});
  var newData = {
    items:[],
    items_subtotal_price:0
  }
  newData.items_subtotal_price=Data.items_subtotal_price
  Data.items.forEach(element => {
    let item ={}
    item.id = element.id
    item.title = element.title
    item.quantity = element.quantity
    item.price = element.price
    newData.items.push(item)
  });
  Data = newData
  console.log(Data)
}
getdata()



// function change(e) {
//   e.preventDefault()
//   let array_of_product = document.querySelectorAll('.cart-product-item'),
//     Product_id = document.querySelectorAll(".c-id"),
//     Product_name = document.querySelectorAll(".c-name"),
//     // Product_type = document.querySelectorAll(".cart__product-variant"),
//     Product_qty = document.querySelectorAll(".c-qty"),
//     Product_price = document.querySelectorAll(".c-price");


//   let i = 0

//   const Data = {cc_id:cc_id,
//                 productArray:[]              
//   }
//   for (let index = 0; index < array_of_product.length; index++) {
//     var newData = {}

//     newData.id = Product_id[index].value
//     newData.name = Product_name[index].value
//     // newData.type = Product_type[index].textContent.trim()
//     newData.qty = Product_qty[index].value
//     newData.price = Product_price[index].value

    
//     Data.productArray.push(newData)
//     console.log(Data)
//     newData = {}
//   }

function change(e) {
  e.preventDefault();
  console.log(Data)
  let mainData = JSON.stringify(Data)
  // document.querySelector('.my-checkout').style.display="block"
  $.post("https://oldaa.herokuapp.com/checkout",
    { mainData }
    ,
    function (data, status) {
      console.log(data)
      let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,
                      width=600,height=700,left=100,top=100`;
      return window.location = data.url
      //     alert("Data: " + data + "\nStatus: " + status);

    });

    
}


var checkoutBtn = document.querySelector("#co-btn")
if (checkoutBtn) {
  console.log('YES ASD')
  checkoutBtn.addEventListener("click", change)
}


function doThis(e) {
  e.preventDefault();
  window.location = window.location.origin
}
 