async function SquarePaymentFlow() {

  // Create card payment object and attach to page
  if (document.getElementById('card-container')) {
    CardPay(document.getElementById('card-container'), document.getElementById('card-button'));
  }
  

  // Create Apple pay instance
  if (document.getElementById('apple-pay-button')) {
    ApplePay(document.getElementById('apple-pay-button'));
  }
  

  // Create Google pay instance
  if (document.getElementById('google-pay-button')) {
    GooglePay(document.getElementById('google-pay-button'));
  }
  

  // Create ACH payment
  if (document.getElementById('ach-button')) {
     ACHPay(document.getElementById('ach-button'));
  }
 
if (document.getElementById('gift-card-container')) {
  giftCardPay(document.getElementById('gift-card-container'), document.getElementById('gift-card-button'))
}
}

window.payments = Square.payments(window.applicationId, window.locationId);

window.paymentFlowMessageEl = document.getElementById('payment-flow-message');
window.paymentFlowMessageE2 = document.getElementById('payment-flow-messages');

window.showSuccess = function(message) {
  window.paymentFlowMessageEl.classList.add('success');
  window.paymentFlowMessageEl.classList.remove('error');
  // window.paymentFlowMessageE2.classList.add('success');
  // window.paymentFlowMessageE2.classList.remove('error');
  window.paymentFlowMessageEl.innerText = message;
  // window.paymentFlowMessageE2.innerText = message;

}

window.showError = function(message) {
  window.paymentFlowMessageEl.classList.add('error');
  window.paymentFlowMessageEl.classList.remove('success');
  // window.paymentFlowMessageE2.classList.add('error');
  // window.paymentFlowMessageE2.classList.remove('success');
  window.paymentFlowMessageEl.innerText = message;
  // window.paymentFlowMessageE2.innerText = message;

}

window.createPayment = async function(token) {
  const dataJsonString = JSON.stringify({
    token
  });

  try {
    const response = await fetch(`/process-payment/${window.orderToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: dataJsonString
    });

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      if (data.errors[0].detail) {
        window.showError(data.errors[0].detail);
      } else {
        window.showError('Payment Failed.');
      }
    } else {
      window.showSuccess('Payment Successful!');
      setTimeout(() => {
         window.location = "https://yogasmokes.com/cart?clearcart=true"
      }, 2);
     
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Hardcoded for testing purpose, only used for Apple Pay and Google Pay
window.getPaymentRequest = function() {
  return {
    countryCode: window.country,
    currencyCode: window.currency,   
    total: { amount: window.total, label: 'Total' },
    
  };
};

SquarePaymentFlow();                    


var payBtn  = document.querySelectorAll('.pay-btn')
var payBlock = document.querySelectorAll('.pay-block')


if (payBtn) {
  
  payBtn.forEach(btn => {
  btn.addEventListener('click',function () {
    
    payBlock.forEach(block => {
      console.log(btn.dataset.btntype, block.dataset.blocktype)
      
        if (btn.dataset.btntype != block.dataset.blocktype){
            block.classList.add('d-none')
            btn.classList.remove('active-btn')         
        }else{
          block.classList.remove('d-none')
          btn.classList.add('active-btn')
        }   
            
    });    
    
  })
  
});

}



var toggleSum = document.querySelector('.toggle-summary')

if(toggleSum){
  toggleSum.addEventListener('click',function () {
    document.querySelector('.order-md-last').style.display ="block"
    toggleSum.style.display = 'none'
  })
}