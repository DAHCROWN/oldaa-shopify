async function giftCardPay(fieldEl, buttonEl) {
  // Create a giftcard payment object and attach to page
  const giftcard = await window.payments.giftCard({
    style: {
      '.input-container.is-focus': {
        borderColor: '#006AFF'
      },
      '.message-text.is-error': {
        color: '#BF0020'
      }
    }
  });
  await giftcard.attach(fieldEl);

  async function eventHandler(event) {
    // Clear any existing messages
    window.paymentFlowMessageEl.innerText = '';

    try {
      const result = await giftcard.tokenize();
      // console.log(result)
      if (result.status === 'OK') {
        // Use global method from sq-payment-flow.js
        window.createPayment(result.token);
      }
    } catch (e) {
      if (e.message) {
        console.log(e)
        window.showError(`Error: ${e.message}`);
      } else {
        window.showError('Something went wrong');
      }
    }
  }

  buttonEl.addEventListener('click', eventHandler);
}
