import React, { Component } from 'react';
import './App.css';
import "@near-wallet-selector/modal-ui/styles.css"
import { Wallet } from './components/near-wallet';
import { utils } from 'near-api-js'

window.Buffer = window.Buffer || require("buffer").Buffer;

class App extends Component {
  state = {
    counter: [],
    yourMessages: [],
    CONTRACT_ADDRESS: 'guest-book1.niskarsh31.testnet',
    NETWORK: 'testnet',
    wallet: {},
    walletSignedIn: false,
    caller: 'Sign in to access counT',
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
    console.log('`````````````````````````````')
    this.setState({ increment: 'Pending' })
    let deposit = utils.format.parseNearAmount(step.toString())
    await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'add_message', args: { message }, deposit });
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    this.setState({ counter: newValue, increment: 'Add Message' });
  }



  currentValue = async ({ wallet, CONTRACT_ADDRESS }) => wallet.viewMethod({
    contractId: CONTRACT_ADDRESS, method: 'get_messages',
    args: {
      offset: 0,
      limit: 10,
    }
  });

  handleChange = (event) => {
    let value = event.target.value
    this.setState({ [event.target.name]: event.target.value });
  };

  async componentDidMount() {
    let { wallet, CONTRACT_ADDRESS, NETWORK } = this.state;
    let yourMessages = [];
    if (!(Object.keys(wallet).length)) {
      wallet = new Wallet({
        createAccessKeyFor: CONTRACT_ADDRESS,
        network: NETWORK,
      });
    }
    let isSignedIn = await wallet.startUp();
    // let ab = await wallet.viewMethod({
    //   contractId: CONTRACT_ADDRESS, method: 'get_num',
    // })
    let counter = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    console.log(counter)
    
    if (isSignedIn) {
      yourMessages = await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'messages_by_signed_in_user'});
      yourMessages = await wallet.getTransactionResult(yourMessages.transaction_outcome.id);
      // console.log(`!!!!!!!!!!!!!!!`, sm)
    }
    this.setState({
      wallet, walletSignedIn: Boolean(isSignedIn), counter, yourMessages,
      caller: isSignedIn ? `Welcome: ${wallet.accountId}` : 'Sign in to access counT'
    });
  }

  render() {
    let { counter, yourMessages, message, walletSignedIn, caller, increment, decrement, reset, step } = this.state;
    return (
      <div >
        <div className="App">
          <h1>This counter lives in the NEAR blockchain! [TESTNET]</h1>
          <p>Share with your friends, or just watch the counter go</p>
          <p>To participate, login</p>
          <p>Once done, reset the counter. OR leave it for some other time</p>
          <h2>{caller}</h2>

          <button onClick={this.walletSignIn} hidden={walletSignedIn} >Connect wallet</button>
          <button onClick={this.walletSignOut} hidden={!walletSignedIn}>Disconnect wallet</button>
          <br />
          <br />
          <input name='message' placeholder='Message' type='textarea' value={message} onChange={this.handleChange} />
          <input name='step' aria-label='change' placeholder='Step value' type='text' value={step} onChange={this.handleChange} />
          <button onClick={this.addMessage} disabled={!walletSignedIn} l> {increment} </button>
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
                yourMessages.map((entry, index) => {
                  return <div key={`b_${index}`} className="card">
                    <div style={{ margin: "5px" }}>id: {entry.id}</div>
                    <div style={{ margin: "5px" }}>Premium: {entry.premium_attached || 0} N</div>
                    <div style={{ margin: "5px" }}>Message: {entry.message}</div>
                  </div>
                })
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
