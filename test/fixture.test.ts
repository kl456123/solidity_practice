import {expect, use} from 'chai';
import {loadFixture, deployContract, solidity} from 'ethereum-waffle';
import BasicToken from '../build/BasicToken.json';
import Voting from '../build/Ballot.json';
import SimplePaymentChannel from '../build/SimplePaymentChannel.json';
import {Wallet, Contract, utils} from 'ethers';
import {Web3Provider} from '@ethersproject/providers';

import {signPayment} from './utils';

use(solidity);

const overrides = {
  gasLimit: 999999
};


describe('Fixtures', ()=>{
  async function fixture([wallet, other]:Wallet[], provider:Web3Provider){
    // token
    const token = await deployContract(wallet, BasicToken, [1000]);

    // voting
    const voting = await deployContract(wallet, Voting, [[
      utils.formatBytes32String("play"),
      utils.formatBytes32String("no play")]]);

    // paymentchannel(pay for salary)
    return {token, wallet, other, voting};
  }
  let token: Contract;
  let wallet: Wallet;
  let voting: Contract;
  let other: Wallet;

  beforeEach(async ()=>{
    const fixture_ = await loadFixture(fixture);
    token = fixture_.token;
    wallet = fixture_.wallet;
    voting = fixture_.voting;
    other = fixture_.other;
  });

  it('Assigns initial balance', async()=>{
    expect(await token.balanceOf(wallet.address)).to.equal(1000);
  });

  it('VotingTest: check owner', async()=>{
    const chairperson = await voting.chairperson();
    expect(chairperson).to.be.eq(wallet.address);

    const voter = await voting.voters(wallet.address);
    expect(voter.weight.toNumber()).to.be.eq(1);
  });

  it('VotingTest: give right to other', async ()=>{
    await voting.giveRightToVote(other.address);
    const voter = await voting.voters(other.address);
    expect(voter.weight).to.be.eq(1);
  });

  it('VotingTest: delegate', async ()=>{
    await voting.delegate(other.address);
    const voter = await voting.voters(other.address);
    expect(voter.voted).to.be.false;
    expect(voter.weight).to.be.eq(1);

    const ownervoter = await voting.voters(wallet.address);
    expect(ownervoter.voted).to.be.true;
    expect(ownervoter.weight).to.be.eq(1);

    voting.connect(other).vote(0, overrides);
    const proposalId = await voting.winningProposal();
    expect(proposalId).to.be.eq(0);
    const winnerName = await voting.winnerName();

    expect(utils.parseBytes32String(winnerName)).to.be.eq("play");
    // voting.once('LogWeight', console.log);
    // voting.once('LogSender', console.log);
  });
});

describe('Fixtures', ()=>{
  async function fixture2([wallet, other]:Wallet[], provider:Web3Provider){
    // token
    const token = await deployContract(wallet, BasicToken, [1000]);

    // paymentchannel(pay for salary)
    const paymentChannel = await deployContract(wallet, SimplePaymentChannel,
      [other.address, 10000000], {value: utils.parseEther("0.1")});
    return {token, wallet, other, paymentChannel, provider};
  }
  let token: Contract;
  let wallet: Wallet;
  let other: Wallet;
  let paymentChannel: Contract;
  let provider: Web3Provider;

  beforeEach(async function(){
    const fixture_ = await loadFixture(fixture2);
    token = fixture_.token;
    wallet = fixture_.wallet;
    other = fixture_.other;
    paymentChannel = fixture_.paymentChannel;
    provider = fixture_.provider;
  });

  it('paymentChannelTest', async ()=>{
    const amount:string = "1000000";
    const signature:string = await signPayment(paymentChannel.address, amount, wallet);

    const wallet_balance_before = await provider.getBalance(wallet.address);
    const other_balance_before = await provider.getBalance(other.address);

    let res = await paymentChannel.connect(other).close(amount, signature, overrides);
    let tx = await res.wait();
    const gasPrice = await provider.getGasPrice();
    console.log('gas fee amount: ', tx.gasUsed.mul(gasPrice).toString());

    const wallet_balance = await provider.getBalance(wallet.address);
    const other_balance = await provider.getBalance(other.address);
    // console.log(wallet_balance.sub(wallet_balance_before).toString(),
      // other_balance.sub(other_balance_before).toString());
    console.log(other_balance_before.toString(), other_balance.toString());
  });

});


