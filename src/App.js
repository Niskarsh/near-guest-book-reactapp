import React, { Component } from 'react';
import './App.css';
import "@near-wallet-selector/modal-ui/styles.css"
import { Wallet } from './components/near-wallet';

window.Buffer = window.Buffer || require("buffer").Buffer;

class App extends Component {
  state = {
    counter: 0,
    CONTRACT_ADDRESS: 'counter2.niskarsh31.testnet',
    NETWORK: 'testnet',
    wallet: {},
    walletSignedIn: false,
    caller: 'Sign in to access counT',
    increment: 'Increase',
    decrement: 'Decrease',
    reset: 'Reset',
    step: 1,
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

  increase = async () => {
    const { wallet, CONTRACT_ADDRESS, step } = this.state;
    this.setState({ increment: 'Pending' })
    await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'increment', args: { step } });
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    this.setState({ counter: newValue, increment: 'Increase' });
  }

  decrease = async () => {
    const { wallet, CONTRACT_ADDRESS, step } = this.state;
    this.setState({ decrement: 'Pending' })
    await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'decrement', args: { step } });
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    this.setState({ counter: newValue, decrement: 'Decrease' });
  }

  reset = async  () => {
    const { wallet, CONTRACT_ADDRESS } = this.state;
    this.setState({ reset: 'Pending' })
    await wallet.callMethod({ contractId: CONTRACT_ADDRESS, method: 'reset' });
    let newValue = await this.currentValue({ wallet, CONTRACT_ADDRESS });
    this.setState({ counter: newValue, reset: 'Reset' });
  }

  currentValue = async ({ wallet, CONTRACT_ADDRESS }) => wallet.viewMethod({
    contractId: CONTRACT_ADDRESS, method: 'get_num',
  });

  handleChange = (event) => {
    let value = event.target.value
    try {
      value = parseInt(value, 10);
      this.setState({ step: value });
    } catch(err) {
      this.setState({ step: 1 });
    }
  };

  async componentDidMount() {
    let { wallet, CONTRACT_ADDRESS, NETWORK } = this.state;
    if (!(Object.keys(wallet).length)) {
      wallet = new Wallet({
        createAccessKeyFor: CONTRACT_ADDRESS,
        network: NETWORK,
      });
    }
    let isSignedIn = await wallet.startUp();
    let ab = await wallet.viewMethod({
      contractId: CONTRACT_ADDRESS, method: 'get_num',
    })
    let counter = await this.currentValue({ wallet, CONTRACT_ADDRESS }); 
    this.setState({ wallet, walletSignedIn: Boolean(isSignedIn), counter,
      caller: isSignedIn ? `Welcome: ${wallet.accountId}`: 'Sign in to access counT'
    });
  }

  render() {
    let { counter, walletSignedIn, caller, increment, decrement, reset, step } = this.state;
    return (
      <div className="App">
        <h1>This counter lives in the NEAR blockchain! [TESTNET]</h1>
        <p>Share with your friends, or just watch the counter go</p>
        <p>To participate, login</p>
        <p>Once done, reset the counter. OR leave it for some other time</p>
        <h2>{ caller }</h2>
        
        <button onClick={this.walletSignIn} hidden={walletSignedIn} >Connect wallet</button>
        <button onClick={this.walletSignOut} hidden={!walletSignedIn}>Disconnect wallet</button>
        <h2>Counter: {counter}</h2>
        <input aria-label='change' placeholder='Step value' type='text' value={step} onChange={this.handleChange}/>
        <button onClick={this.increase} disabled={!walletSignedIn} l> {increment} </button>
        <button onClick={this.decrease} disabled={!walletSignedIn}> {decrement} </button>
        <button onClick={this.reset} disabled={!walletSignedIn}> {reset} </button>
      </div>
    )
  }
}

export default App;
