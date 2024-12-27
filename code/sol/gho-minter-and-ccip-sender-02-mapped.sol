// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

interface GhoTokenInterface {
	function transfer(address, uint) external returns (bool); //to - value
	function allowance(address, address) external returns (uint256); //owner, spender
	function balanceOf(address) external returns (uint256); 
}
interface aGhoTokenInterface {
	function borrowAllowance(address, address) external returns (uint256); //to - value
}
interface AavePoolInterace {
	function getUserAccountData(address) external returns (uint256, uint256, uint256, uint256, uint256, uint256);
	//totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor
	function borrow(address, uint256, uint256, uint16, address) external;
	//asset, amount, interestRateMode, referralCode, onBehalfOf
}
interface LinkTokenInterface {
	function transfer(address, uint) external returns (bool); //to - value
	function allowance(address, address) external returns (uint256); //owner, spender
	function balanceOf(address) external returns (uint256); 
}
interface CCIPInterface {
	function allowlistDestinationChain(uint64, bool) external returns (bool);
	function transferTokensPayLINK(uint64, address, address, uint256) external returns (bytes32); 
	//_destinationChainSelector, _receiver, _token, _amount.  returns messageId
	function transferTokensPayNative(uint64, address, address, uint256) external returns (bytes32);
	function withdraw(address) external; //_beneficiary (withdraws ETH from contract)
	function withdrawToken( address, address) external; //_beneficiary, _token
	function transferOwnership(address) external; //Change owner of CCIP contract
	function acceptOwnership() external;
}

contract FOF_GHOSender is ConfirmedOwner{
	//Events
	event RequestSent(uint256 gameID, uint256 requestId);

	//Global Variables
	uint256 public gameID = 0;
	uint256 public curGameID;
	address public msgSender;

	//Mapped Data
	mapping(uint256 => uint256) public scaled_value;
	mapping(uint256 => address) public player_add;
    mapping(uint256 => address) public pymt_add;
	mapping(uint256 => uint256) public randNumb;
	mapping(uint256 => uint256) public gameToReqID;
    mapping(uint256 => uint256) public game_value;
	mapping(uint256 => uint256) public reqIDToGame;
	mapping(uint256 => bool) public reqFulfilled;
	mapping(uint256 => bool) public paidOut;
	
	//Borrowing Settings
	uint256[6] public aaveUserAccountData;

	/************ External Contract Addresses and Interface Assignments ************/

	address linkAddress =  0x779877A7B0D9E8603169DdbD7836e478b4624789; //Address LINK - Sepolia Testnet

	//Address and Interface - Aave Pool (for borrowing / minting GHO)
	address aavePoolAddABI = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
	AavePoolInterace aavePool = AavePoolInterace(aavePoolAddABI);
	
	//Address and Interface - GHO Token
	address ghoAddress = 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60; //GHO Address
	GhoTokenInterface ghoTkn = GhoTokenInterface(ghoAddress);

	//Address and Interface - GHO Debt Token Address - Sepolia
	address aGhoTknAdd = 0x67ae46EF043F7A4508BD1d6B94DB6c33F0915844;
	aGhoTokenInterface aGhoTkn = aGhoTokenInterface(aGhoTknAdd);

	//Address and Interface - CCIP Sending Contract Address - Sepolia
	address ccipSenderContractAddress = 0xFf9627fE89F32997d65C7CB246a70A36fe56beD5;
	CCIPInterface ccipSender = CCIPInterface(ccipSenderContractAddress);
	
	constructor() ConfirmedOwner(msg.sender){
		gameID = 0;
	}

	//This function gathers the conditions we will need to start the transfer
	function initSettings(uint256 _game_value, address _pymt_add) public{
		require(_pymt_add != address(0), "Invalid Payment Address");
        require(_game_value > 0, "Invalid Payment Address");
		game_value[gameID] = _game_value; //We map the value transfer from the game
        msgSender = msg.sender;
        player_add[gameID] = msg.sender; //Map the Player
        scaled_value[gameID]  = _game_value * 10**10;
		pymt_add[gameID] = _pymt_add; //And the payment address
		paidOut[gameID] = false; //Ensure payout bool is false;
		readyPlayer(gameID);
		gameID++; //Then increment the gameID so that it doesn't reuse.
	}

	//Checks Players Into the Game
	function readyPlayer(uint256 _gameID) public{
		//Verify Borrowing Power
		uint256 borrowPower = checkBorrowingPower(msg.sender);
		uint256 gameValue = game_value[_gameID];
		require(borrowPower > gameValue, "Insufficent borrowing power. You must post more collateral to play this game.");
		uint256 borrowAllow = aGhoTkn.borrowAllowance(msg.sender,address(this));
		require(borrowAllow >= scaled_value[_gameID], "You must delegate more credit to the game contract.");
        borrowAndSendTokens(_gameID);
	}

	//This function retrieves the borrowing power of an arbitrary address
	function checkBorrowingPower(address _pAddress) public returns (uint256) {
		(, , uint256 availableBorrowsETH, , , ) = aavePool.getUserAccountData(_pAddress);
		return availableBorrowsETH;
	}

	function borrowAndSendTokens(uint256 _gameID) public{
        address payer;
        aavePool.borrow(ghoAddress, scaled_value[_gameID], 2, 0, payer); //Borrow GHO
        ghoTkn.transfer(ccipSenderContractAddress, scaled_value[_gameID]); //Transfer GHO to Sender Contract
		uint64 arbiSepCS = 3478487238524512106; //Destination Chain Selector (Arbitrum Sepolia)
		ccipSender.transferTokensPayLINK(arbiSepCS, pymt_add[_gameID], ghoAddress, scaled_value[_gameID]); //Then call transfer function on sender contract
	}
	//Withdraw Link (From This Contract)
	function withdrawLink(address _withdrawlAdd) public onlyOwner{
		LinkTokenInterface link = LinkTokenInterface(linkAddress);
		require(link.transfer(_withdrawlAdd, link.balanceOf(address(this))), 'Unable to transfer');
	}

	//Withdraw ETH (From This Contract)
	function withdrawETH(uint256 amount, address _withdrawlAdd) public onlyOwner{
		address payable to = payable(_withdrawlAdd);
		to.transfer(amount);
	}

	//Transfer Ownership of CCIP Sender Contract
	function ccipSenderTransferOwnership(address _newOwner) public onlyOwner {
		ccipSender.transferOwnership(_newOwner);
	}
	//Accept Ownership of CCIP Sender Contract
	function ccipAcceptOwnership() public onlyOwner {
		ccipSender.acceptOwnership();
	}
	//Add or remove destination chain
	function ccipAddDestinationChain(uint64 _newDest, bool _yayOrNay) public onlyOwner {
		ccipSender.allowlistDestinationChain(_newDest, _yayOrNay);
	}
	//Withdraw ETH (From CCIP Sender Contract)
	function ccipWithdrawETH(address _withdrawlAdd) public onlyOwner{
		ccipSender.withdraw(_withdrawlAdd);
	}
	//Withdraw Token (From CCIP Sender Contract)
	function ccipWithdrawTkn(address _withdrawlAdd, address _tknAdd) public onlyOwner{
		ccipSender.withdrawToken(_withdrawlAdd, _tknAdd);
	}
}