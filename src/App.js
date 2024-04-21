import React, { Component } from 'react';
import './App.css';
import "@near-wallet-selector/modal-ui/styles.css"
import { Wallet } from './components/near-wallet';
import { utils } from 'near-api-js'
// import { get } from 'https';

window.Buffer = window.Buffer || require("buffer").Buffer;

class App extends Component {
  state = {
    counter: [],
    yourMessages: {
      fetch: false,
      messages: [],
      fetchInProgress: false,
    },
    CONTRACT_ADDRESS: 'guest-book2.niskarsh31.testnet',

    NETWORK: 'testnet',
    wallet: {},
    walletSignedIn: false,
    caller: 'Sign in to submit feedback',
    increment: 'Add Message',
    decrement: 'Decrease',
    reset: 'Reset',
    step: 0,
    message: ""
  };

  toggleWalletModalVisbibility = () => {
    let visible = this.state.walletModalVisible;
    this.setState({ walletModalVisible: !visible });
  }

  walletSignIn = async () => {
    const { CONTRACT_ADDRESS, NETWORK } = this.state;
    const wallet = new Wallet({
      createAccessKeyFor: CONTRACT_ADDRESS,
      network: NETWORK,
    });
    this.setState({ wallet })
    console.log(wallet.accountId)
    let isSignedIn = await wallet.startUp();
    if (!isSignedIn) {
      let sm = await wallet.signIn();
      console.log(sm)
    }
    console.log(wallet.accountId)
  };

  walletSignOut = async () => {
    const { wallet } = this.state;
    if (Object.keys(wallet).length) {
      let isSignedIn = await wallet.startUp();
      if (isSignedIn) {
        wallet.signOut();
      }
    }

    this.setState({ wallet: {} });
  }

  addMessage = async () => {
    const { wallet, CONTRACT_ADDRESS, step, message } = this.state;
    // console.log('`````````````````````````````')
    this.setState({ increment: 'Pending' })
    let deposit = utils.format.parseNearAmount(step.toString())
    await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'add_message', args: { message }, deposit });
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    // let yourMessages = await this.getYourMessages({ wallet, CONTRACT_ADDRESS });
    // console.log(`$$$$$$$$$$$$$$$$$`, yourMessages)
    this.setState({ counter: newValue, increment: 'Add Message' });
  }



  currentValue = async ({ wallet, CONTRACT_ADDRESS }) => wallet.viewMethod({
    contractId: CONTRACT_ADDRESS, method: 'get_messages',
    args: {
      offset: 0,
      limit: 10,
    }
  });

  fetchYourMessages = async () => {
    const { wallet, CONTRACT_ADDRESS } = this.state;
    let yourMessages = await this.getYourMessages({ wallet, CONTRACT_ADDRESS });

    // yourMessages.map(ele => console.log(`$$$$$$$$$$$$$$$$$`, ele))
    
    this.setState ({
      yourMessages: {
        fetch: true,
        fetchInProgress: false,
        messages: yourMessages,
      }
    });
  }

  getYourMessages = async ({ wallet, CONTRACT_ADDRESS }) => {
    this.setState(prevState => ({
      ...prevState,
      yourMessages: {
        ...prevState.yourMessages,
        fetchInProgress: true,
      }
    }))
    let yourMessages = [];
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    // console.log('`````````````````````````````', newValue)
    yourMessages = await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'messages_by_signed_in_user'});
    // console.log('`````````````````````````````')
      yourMessages = await wallet.getTransactionResult(yourMessages.transaction_outcome.id);
    return yourMessages;
    // wallet.viewMethod({
    // contractId: CONTRACT_ADDRESS, method: 'get_messages',
    // args: {
    //   offset: 0,
    //   limit: 10,
    // }
  };

  handleChange = (event) => {
    let value = event.target.value
    this.setState({ [event.target.name]: event.target.value });
  };

  getParameters = (URL) => {
    
    if (decodeURI(URL.split("?")[1]) !== 'undefined'){
    URL = JSON.parse('{"' + decodeURI(URL.split("?")[1]).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') +'"}');
    return URL;
  } else {
    return undefined;
  }
  };
  

  async componentDidMount() {
    let { wallet, CONTRACT_ADDRESS, NETWORK, yourMessages } = this.state;
    let yourMessage = [];
    let fetch = false;
    if (!(Object.keys(wallet).length)) {
      wallet = new Wallet({
        createAccessKeyFor: CONTRACT_ADDRESS,
        network: NETWORK,
      });
    }
    let isSignedIn = await wallet.startUp();
    // // let ab = await wallet.viewMethod({
    // //   contractId: CONTRACT_ADDRESS, method: 'get_num',
    // // })
    let counter = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    // console.log(counter)
    
    if (yourMessages.fetchInProgress && this.getParameters(window.location.href) && this.getParameters(window.location.href).transactionHashes) {
      yourMessage = await wallet.getTransactionResult(this.getParameters(window.location.href).transactionHashes);
      fetch = true;
      // console.log('@@@@@@@@@@@@@@@@@@', yourMessage)
    }
    // if (isSignedIn && (yourMessages.length === 1) && (!(yourMessages[0].id))) {
    //   yourMessages = await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'messages_by_signed_in_user'});
    //   // yourMessages = await wallet.getTransactionResult(yourMessages.transaction_outcome.id);
    //   console.log(`!!!!!!!!!!!!!!!`)
    // }
    let stateEntry = {
      wallet, walletSignedIn: Boolean(isSignedIn), counter,
      caller: isSignedIn ? `Welcome: ${wallet.accountId}` : 'Sign in to submit feedback'
    }
    if (fetch) {
      stateEntry.yourMessages = {
        fetch,
        fetchInProgress: false,
        messages: yourMessage
      }
    }

    this.setState(stateEntry);
  }

  render() {
    let { counter, yourMessages, message, walletSignedIn, caller, increment, step } = this.state;
    return (
      <div >
        <div className="App">
          <h1>This Guest book lives in the NEAR blockchain! [TESTNET]</h1>
          <p>Share reviews of your stay here</p>
          <p>Do leave a Donation if you liked our service</p>
          <h2>{caller}</h2>

          <button onClick={this.walletSignIn} hidden={walletSignedIn} >Connect wallet</button>
          <button onClick={this.walletSignOut} hidden={!walletSignedIn}>Disconnect wallet</button>
          <br />
          <br />
          <input name='message' placeholder='Message' type='textarea' value={message} onChange={this.handleChange} />
          <input name='step' aria-label='change' placeholder='Donation' type='text' onChange={this.handleChange} />
          <button onClick={this.addMessage} disabled={!walletSignedIn}> {increment} </button>
        </div>
        <div className='superContainer'>
          <div className='container'>
            <div className='subContainer'>
              <h2 >All messages </h2>
              {
                counter.map((entry, index) => {
                  return <div key={`a_${index}`} className="card">
                    <div style={{ margin: "5px" }}>id: {entry.id}</div>
                    <div style={{ margin: "5px" }}>Premium: {entry.premium_attached || 0} N</div>
                    <div style={{ margin: "5px" }}>Message: {entry.message}</div>
                  </div>
                })
              }
            </div>

            <div className='subContainer'>
              <h2 >Your messages </h2>
              { 
              yourMessages.fetch ?
                yourMessages.messages.map((entry, index) => {
                  return <div key={`b_${index}`} className="card">
                    <div style={{ margin: "5px" }}>id: {entry.id}</div>
                    <div style={{ margin: "5px" }}>Premium: {entry.premium_attached || 0} N</div>
                    <div style={{ margin: "5px" }}>Message: {entry.message}</div>
                  </div>
                }) : 
                (<button onClick={this.fetchYourMessages} disabled={!walletSignedIn}>Fetch Your Messages</button>)
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
