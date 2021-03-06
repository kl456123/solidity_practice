// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract SimpleAuction{
  address payable public beneficiary;
  uint public auctionEndTime;

  address public highestBidder;
  uint public highestBid;

  mapping(address => uint) pendingReturns;

// end of aution
  bool ended;


  event HighestBidIncreased(address bidder, uint amount);
  event AuctionEnded(address winner, uint amount);

  error AuctionAlreadyEnded();
  error BidNotHighEnough(uint highestBid);
  error AuctionNotYetEnded();
  error AuctionEndAlreadyCalled();

  constructor(uint _biddingTime, address payable _beneficiary){
    beneficiary = _beneficiary;
    auctionEndTime = block.timestamp + _biddingTime;
  }


  function bid() public payable{
    if(block.timestamp > auctionEndTime){
      revert AuctionAlreadyEnded();
    }

    if(msg.value<=highestBid){
      revert BidNotHighEnough(highestBid);
    }

    if(highestBid !=0){
      // highestBidder may be a contract
      // using an untrusted contract is a security risk.
      pendingReturns[highestBidder] += highestBid;
    }

    highestBidder = msg.sender;
    highestBid = msg.value;
    emit HighestBidIncreased(msg.sender, msg.value);
  }


  function withdraw() public returns (bool) {
    uint amount = pendingReturns[msg.sender];
    if(amount>0){
      // set it first before executing send
      pendingReturns[msg.sender] = 0;
      if(!payable(msg.sender).send(amount)){
        pendingReturns[msg.sender] = amount;
        return false;
      }
    }
    return true;
  }


  function auctionEnd()public{
    // check conditions
    if(block.timestamp < auctionEndTime){
      revert AuctionNotYetEnded();
    }
    if(ended){
      revert AuctionEndAlreadyCalled();
    }

    // effects
    ended = true;
    emit AuctionEnded(highestBidder, highestBid);

    // interaction
    beneficiary.transfer(highestBid);
  }
}
