// Configurações
const contractAddress = "0x0D47699aeeFA93Bf25daFd5eC8cC973Dd239C8a0"; // Substitua pelo endereço do seu contrato
const abi = [
    {
        "inputs": [
            {"internalType": "address", "name": "_tokenAddress", "type": "address"},
            {"internalType": "uint256", "name": "_referralReward", "type": "uint256"},
            {"internalType": "uint256", "name": "_referrerReward", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "referrer", "type": "address"}
        ],
        "name": "Registered",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "referrerReward",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contractBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_referrer", "type": "address"}],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
        "name": "registerInitialUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_newReferralReward", "type": "uint256"}, {"internalType": "uint256", "name": "_newReferrerReward", "type": "uint256"}],
        "name": "setRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_referrer", "type": "address"}],
        "name": "getReferrals",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
];
const baseUrl = window.location.href; // URL base da plataforma
// Configuração do Telegram
const TELEGRAM_BOT_TOKEN = "8102052298:AAEdJ5A8VC5QMWzci4rFUMOqbl319n_T11A";
const TELEGRAM_GROUP_ID = "-1002178729694";
// Elementos da página
const connectWalletButton = document.getElementById("connectWallet");
const userInfo = document.getElementById("userInfo");
const userAddress = document.getElementById("userAddress");
const contractBalance = document.getElementById("contractBalance");
const referralLink = document.getElementById("referralLink");
const qrcodeElement = document.getElementById("qrcode");
const registerForm = document.getElementById("registerForm");
const referrerAddressInput = document.getElementById("referrerAddress");
const registerButton = document.getElementById("registerButton");
const telegramUsernameInput = document.getElementById("telegramUsername");
const statusMessage = document.getElementById("statusMessage");

let web3;
let contract;
let userAccount;

// Desativa o botão de registro por padrão
registerButton.disabled = true;

// Conectar à carteira
connectWalletButton.addEventListener("click", async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            userAddress.textContent = userAccount;
            userInfo.classList.remove("hidden");
            contract = new web3.eth.Contract(abi, contractAddress);
            updateContractBalance();
            generateReferralLink(userAccount);
            registerForm.classList.remove("hidden");
        } catch (error) {
            statusMessage.textContent = "Erro ao conectar à carteira: " + error.message;
        }
    } else {
        statusMessage.textContent = "MetaMask não instalado!";
    }
});

// Atualizar saldo do contrato
async function updateContractBalance() {
    const balance = await contract.methods.contractBalance().call();
    contractBalance.textContent = web3.utils.fromWei(balance, "ether") + " tokens";
}

        telegramUsernameInput.addEventListener("input", async () => {
            const username = telegramUsernameInput.value.replace("@", ""); // Remove o "@" se o usuário digitar

            if (username.length > 0) {
                statusMessage.textContent = "Verificando usuário...";
                const userId = await getUserIdByUsername(username);

                if (userId) {
                    const isMember = await isUserInGroup(userId);

                    if (isMember) {
                        registerButton.disabled = false;
                        statusMessage.textContent = "Verificação concluída! Você pode se registrar.";
                    } else {
                        registerButton.disabled = true;
                        statusMessage.textContent = "Você precisa ser membro do grupo para se registrar!";
                    }
                } else {
                    registerButton.disabled = true;
                    statusMessage.textContent = "Nome de usuário inválido ou não encontrado.";
                }
            } else {
                registerButton.disabled = true;
                statusMessage.textContent = "";
            }
        });

        // Função para buscar o ID numérico do usuário pelo @username
        async function getUserIdByUsername(username) {
            try {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUserId?username=${username}`);
                const data = await response.json();

                if (data.userId) {
                    return data.userId; // Retorna o ID numérico do usuário
                } else {
                    console.error("Erro na resposta da API:", data.error || "Usuário não encontrado.");
                    return null;
                }
            } catch (error) {
                console.error("Erro ao buscar ID do usuário:", error);
                return null;
            }
        }

        // Função para verificar se o usuário está no grupo
        async function isUserInGroup(userId) {
            try {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${TELEGRAM_GROUP_ID}&user_id=${userId}`);
                const data = await response.json();

                console.log("Resposta da API do Telegram (verificação de grupo):", data); // Log para depuração

                if (data.ok && ["member", "administrator", "creator"].includes(data.result.status)) {
                    return true; // Usuário está no grupo
                } else {
                    console.error("Erro na verificação de grupo:", data.description || "Usuário não está no grupo.");
                    return false;
                }
            } catch (error) {
                console.error("Erro ao verificar grupo:", error);
                return false;
            }
        }

// Gerar link de referência
function generateReferralLink(userAddress) {
    const url = new URL(window.location.href);
    url.searchParams.set("ref", userAddress);
    referralLink.href = url.toString();
    referralLink.textContent = url.toString();
    generateQRCode(url.toString()); // Gera o QR Code
}

// Gerar QR Code
function generateQRCode(url) {
    qrcodeElement.innerHTML = ""; // Limpa o conteúdo anterior
    new QRCode(qrcodeElement, {
        text: url,
        width: 128,
        height: 128,
    });
}

// Registrar usuário
registerButton.addEventListener("click", async () => {
    const referrerAddress = referrerAddressInput.value;
    const username = telegramUsernameInput.value.replace("@", "");

    if (!web3.utils.isAddress(referrerAddress)) {
        statusMessage.textContent = "Endereço do referenciador inválido!";
        return;
    }

    if (!username) {
        statusMessage.textContent = "Nome de usuário do Telegram é necessário!";
        return;
    }

    try {
        statusMessage.textContent = "Registrando...";
        await contract.methods.registerUser(referrerAddress).send({ from: userAccount });
        statusMessage.textContent = "Registrado com sucesso!";
        updateContractBalance();
    } catch (error) {
        statusMessage.textContent = "Erro ao registrar: " + error.message;
    }
});
