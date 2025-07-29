// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BettingGame is ReentrancyGuard {
    event GameClosed(uint256 indexed gameId);

    struct Bet {
        address payable user;
        uint256 amount;
        uint256 gameID;
    }

    struct Game {
        string description;
        bool isOpen;
        uint256 totalBetAmount;
        address player1;
        address player2;
    }

    Game[] public games;
    mapping(uint256 => mapping(address => uint256)) public lastBetTime; // Moved mapping outside the struct
    mapping(uint256 => Bet[]) public gameBets;
    uint256 public numGames;

    constructor() {
        numGames =   0;
    }

    event GameCreated(uint256 indexed gameId, string description);

    function createGame(string memory _description) public {
        games.push(Game({
            description: _description,
            isOpen: true,
            totalBetAmount:  0,
            player1: address(0),
            player2: address(0)
        }));
        numGames++;
    }

    function addPlayer1(uint256 _gameId, address _player1) public {
        require(_gameId < numGames, "Invalid game ID");
        require(games[_gameId].player1 == address(0), "Player  1 already added for this game");

        games[_gameId].player1 = _player1;
        games[_gameId].isOpen = true;
    }

    function addPlayer2(uint256 _gameId, address _player2) public {
        require(_gameId < numGames, "Invalid game ID");
        
        require(games[_gameId].player2 == address(0), "Player  2 already added for this game");

        games[_gameId].player2 = _player2;
        games[_gameId].isOpen = true;
    }

    modifier canBet(uint256 _gameId, address _player) {
        require(block.timestamp >= lastBetTime[_gameId][_player] +   5 minutes, "Must wait   5 minutes between bets");
        _;
    }

    function playerBet(uint256 _gameId, uint256 _betAmount) public payable {
        require(_gameId < numGames, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.isOpen, "Game is not open");
        require(msg.value == _betAmount, "Incorrect bet amount");
        require(_betAmount >=   0.0001   ether, "Bet amount must be at least   0.0001   ether");
        require(msg.sender == game.player1, "Must be Player  1");

        // Update the last bet time for Player  1
        lastBetTime[_gameId][msg.sender] = block.timestamp;

        // Update userBets and totalBetAmount
        gameBets[_gameId].push(Bet(payable(msg.sender), _betAmount, _gameId));
        game.totalBetAmount += _betAmount;
    }

    function player2Bet(uint256 _gameId, uint256 _betAmount) public payable {
        require(_gameId < numGames, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.isOpen, "Game is not open");
        require(msg.value == _betAmount, "Incorrect bet amount");
        require(_betAmount >=   0.0001   ether, "Bet amount must be at least   0.0001   ether");
        require(msg.sender == game.player2, "Must be Player  2");

        // Update the last bet time for Player  2
        lastBetTime[_gameId][msg.sender] = block.timestamp;

        // Update userBets and totalBetAmount
        gameBets[_gameId].push(Bet(payable(msg.sender), _betAmount, _gameId));
        game.totalBetAmount += _betAmount;
    }



    function closeGame(uint256 _gameId, bool player1Wins) public nonReentrant {
        require(_gameId < numGames, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.isOpen, "Game is already closed");
        game.isOpen = false;

        // Determine the winner and loser based on the boolean value
        address winner = player1Wins ? game.player1 : game.player2;
        address loser = player1Wins ? game.player2 : game.player1;

        // Calculate the total bet amount for the winner and the loser
        uint256 winnerBet =   0;
        uint256 loserBet =   0;
        for (uint i =   0; i < gameBets[_gameId].length; i++) {
            if (gameBets[_gameId][i].user == winner) {
                winnerBet += gameBets[_gameId][i].amount;
            } else if (gameBets[_gameId][i].user == loser) {
                loserBet += gameBets[_gameId][i].amount;
            }
        }

        // Check if there were any bets made
        uint256 totalPayout = game.totalBetAmount;
        uint256 winnerPayout = totalPayout;
        uint256 loserPayout = 0;

        // Distribute the winnings
        payable(winner).transfer(winnerPayout);
        payable(loser).transfer(loserPayout);

        emit GameClosed(_gameId);
    }

}