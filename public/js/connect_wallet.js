var x = document.getElementById("creategames");
var cover = document.getElementById("showCover");
const { ethereum } = window;

if (ethereum) {
  var provider = new ethers.providers.Web3Provider(ethereum);
}

const isMetaMaskConnected = async () => {
  const accounts = await provider.listAccounts();
  return accounts.length > 0;
};

isMetaMaskConnected().then((connected) => {
  if (connected) {
    // metamask is connected
    document.getElementById("connectButton").innerHTML = "Connected!";
    x.style.display = "block";
    cover.style.display = "none";
  } else {
    // metamask is not connected
    document.getElementById("connectButton").innerHTML = "Connect Wallet";
    x.style.display = "none";
    cover.style.display = "block";
  }
});

async function connectWallet() {
  const { ethereum } = window;
  if (!ethereum) {
    console.log("Metamask not detected");
    document.getElementById("connectButton").innerHTML =
      "Please install Metamask";
    return;
  }
  let chainId = await ethereum.request({ method: "eth_chainId" });

  const SepoliaChainId = "0xaa36a7";

  if (chainId !== SepoliaChainId) {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SepoliaChainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SepoliaChainId,
                chainName: "Sepolia Test Network",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"],
                blockExplorerUrls: ["https://sepolia.etherscan.io/"],
              },
            ],
          });
        } catch (addError) {
          console.log("Failed to add Sepolia network to Metamask");
          document.getElementById("connectButton").innerHTML =
            "Failed to switch to Sepolia";
          return;
        }
      } else {
        console.log("Failed to switch to Sepolia network");
        document.getElementById("connectButton").innerHTML =
          "Failed to switch to Sepolia";
        return;
      }
    }
  }

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const connectedAddress = accounts[0]; // Assuming the first account is the connected one
  console.log("Connected wallet address:", connectedAddress);
  // await ethereum.request({ method: "eth_requestAccounts" });
  document.getElementById("connectButton").innerHTML = "Connected!";
  x.style.display = "block";
  cover.style.display = "none";
}
////////////////
// const accessToContract = async () => {
//   try {
//     const response = await fetch("../public/contract/abi.json");
//     const ABI = await response.json();
//     const Address = "0x4768bB79Da6141bC1D86095503701e04c021B462";

//     window.web3 = await new Web3(window.ethereum);
//     window.contract = await new ethers.Contract(Address, ABI);
//   } catch (error) {
//     console.error("Error accessing contract:", error);
//   }
// };

const readFromContract = async () => {
  try {
    const response = await fetch("../public/contract/abi.json");
    const ABI = await response.json();
    const Address = "0x6996b280785d92fd957B77D623E455ABdFfBF2D6";
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    window.web3 = await new Web3(window.ethereum);
    window.contract = await new ethers.Contract(Address, ABI, signer);
    const getGameId = await window.contract.numGames();
    let gameId = parseInt(getGameId);
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const connectedAddress = accounts[0];

    // Create the game
    const createGameData = await window.contract.createGame(gameId, {
      gasLimit: 2000000,
    });
    console.log("Game created:", createGameData);

    const addplayer1 = await window.contract.addPlayer1(gameId, connectedAddress, {
      gasLimit: 2000000,
    });
    console.log("Add player 1:", addplayer1);

    // Place a bet
    const betAmount = ethers.utils.parseUnits("0.00012", "ether");
    console.log("Bet amount:", betAmount);
    const placeBetData = await window.contract.playerBet(gameId,betAmount, {
      value: betAmount,
      gasLimit: 2000000,
    });
    console.log("Bet placed:", placeBetData);

    
    // Redirect to another page if both actions were successful
    if (createGameData && placeBetData) {
      window.location.replace(
        "/white?code=" + $("#codeInput").val() + "&address=" + connectedAddress
      );
    }
  } catch (error) {
    console.error("Error accessing contract:", error);
  }
};

///////////////////////

// $('#createGame').on('click', function () {
//     window.location.replace('/white?code=' + $('#codeInput').val() + '&bet=' + $('#bet').val());
// });
 $("#joinGame").on("click", async function () {
  try {
    const response = await fetch("../public/contract/abi.json");
    const ABI = await response.json();
    const Address = "0x6996b280785d92fd957B77D623E455ABdFfBF2D6";
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    window.web3 = await new Web3(window.ethereum);
    window.contract = await new ethers.Contract(Address, ABI, signer);
    const getGameId = await window.contract.numGames();
    // let gameId = parseInt(getGameId);
    let gameId = parseInt(getGameId) - 1;
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const connectedAddress = accounts[0];

    // Create the game
    // const createGameData = await window.contract.createGame(gameId, {
    //   gasLimit: 2000000,
    // });
    // console.log("Game created:", createGameData);

    const addplayer2 = await window.contract.addPlayer2(gameId, connectedAddress, {
      gasLimit: 2000000,
    });
    console.log("Add player 2:", addplayer2);

    // Place a bet
    const betAmount = ethers.utils.parseUnits("0.00012", "ether");
    console.log("Bet amount:", betAmount);
    const placeBetData = await window.contract.player2Bet(gameId,betAmount, {
      value: betAmount,
      gasLimit: 2000000,
    });
    console.log("Bet placed:", placeBetData);

   
    // Redirect to another page if both actions were successful
    if (placeBetData) {
      window.location.replace(
        "/black?code=" + $("#codeInput").val() + "&address=" + connectedAddress
      );
    }
  } catch (error) {
    console.error("Error accessing contract:", error);
  }
  
});

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("error") == "invalidCode") {
  $("#errorMessage").text("Invalid invite code");
}
